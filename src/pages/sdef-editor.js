/**
 * sdef-editor.js — Integrated SDEF editor
 * Visual UI mode + raw text editor mode
 */

import { getState, subscribe, setSdefContent, getSdefContent, navigate, setCurrentSdef, getAudioFile, updateUnsavedSdef, clearUnsavedSdef } from '../state/store.js';
import { SDEF_PARAMS, generateSdef, parseSdef } from '../utils/sdef-generator.js';
import { showToast } from '../components/toast.js';
import { detectSoundType, getTypeDefaults, SOUND_TYPES } from '../utils/audio-analyzer.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';

let currentMode = 'visual'; // 'visual' or 'raw'
let currentParams = {};
let currentAudioSource = null;

export function renderSdefEditor(container) {
  const state = getState();
  const selected = state.selectedAssets;
  const entries = Object.entries(selected);
  const currentSdef = state.currentSdef;

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">SDEF Editor</h1>
        <p class="page-description">Edit .sdef files for your sound assets.</p>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('sliders', 'icon-xl')}</div>
        <div class="empty-state-title" data-i18n="project.noAssetsTitle">No Assets Selected</div>
        <div class="empty-state-text" data-i18n="project.noAssetsText">Select assets in the Library first, then edit their SDEF files here.</div>
      </div>
    `;
    renderIcons(container);
    return;
  }

  // Load current params
  if (currentSdef && selected[currentSdef]) {
    const unsavedContent = state.unsavedSdefs[currentSdef];
    const content = getSdefContent(currentSdef);

    currentParams = (unsavedContent || content) ? parseSdef(unsavedContent || content) : {};
    if (!currentParams.wave && selected[currentSdef].customWaves?.length) {
      currentParams.wave = selected[currentSdef].customWaves;
    }
    if (!content) {
      const soundType = detectSoundType(currentSdef);
      const typeDefaults = getTypeDefaults(soundType);
      Object.entries(typeDefaults).forEach(([key, val]) => {
        if (currentParams[key] === undefined) currentParams[key] = val;
      });
    }
  }

  container.innerHTML = `
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title" data-i18n="sdef.title">SDEF Editor</h1>
        <p class="page-description" data-i18n="sdef.description">Edit .sdef parameters — switch between visual UI and raw text modes.</p>
      </div>
    </div>
    <div class="editor-layout">
      <div class="editor-sidebar">
        <div class="sdef-sidebar-header">
          <span>${getIcon('file-audio', 'icon-sm')}</span>
          <span>SDEF Files</span>
          <span class="sdef-count-badge">${entries.length}</span>
        </div>
        <div id="sdef-file-list"></div>
      </div>
      <div class="editor-main" id="editor-main">
        ${currentSdef ? renderEditorContent() : renderNoSelection()}
      </div>
    </div>
  `;

  renderSdefFileList();
  attachEditorHandlers(container);

  renderIcons(container);
  updateTranslations();
}

// Tree state
let sdefFolderTree = {};
let sdefOpenFolders = new Set(); // Stores open folder paths

function renderSdefFileList() {
  const listEl = document.getElementById('sdef-file-list');
  if (!listEl) return;

  const state = getState();
  const selectedEntries = Object.entries(state.selectedAssets);

  if (selectedEntries.length === 0) {
    listEl.innerHTML = '<div class="sdef-file-empty">No assets selected</div>';
    return;
  }

  // Build tree
  const assets = selectedEntries.map(([path, data]) => ({ path, ...data }));
  sdefFolderTree = buildSdefTree(assets);

  // Render
  listEl.innerHTML = renderSdefTreeNode(sdefFolderTree);

  // Handlers
  listEl.querySelectorAll('.sdef-folder-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderPath = el.dataset.folderPath;
      if (sdefOpenFolders.has(folderPath)) {
        sdefOpenFolders.delete(folderPath);
      } else {
        sdefOpenFolders.add(folderPath);
      }
      renderSdefFileList();
    });
  });

  listEl.querySelectorAll('.sdef-file-item').forEach(el => {
    el.addEventListener('click', () => {
      const clickedPath = el.dataset.sdefPath;
      setCurrentSdef(clickedPath);

      // Load params for editor
      const state = getState();
      const content = getSdefContent(clickedPath);
      const unsavedContent = state.unsavedSdefs[clickedPath];
      currentParams = (unsavedContent || content) ? parseSdef(unsavedContent || content) : {};

      const selectedAsset = state.selectedAssets[clickedPath];
      if (!currentParams.wave && selectedAsset?.customWaves?.length) {
        currentParams.wave = selectedAsset.customWaves;
      }

      if (!content) {
        const soundType = detectSoundType(clickedPath);
        const typeDefaults = getTypeDefaults(soundType);
        Object.entries(typeDefaults).forEach(([key, val]) => {
          if (currentParams[key] === undefined) currentParams[key] = val;
        });
      }

      const mainEl = document.getElementById('editor-main');
      if (mainEl) {
        mainEl.innerHTML = renderEditorContent();
        renderIcons(mainEl);
        attachEditorContentHandlers();
      }
      renderSdefFileList(); // Re-render to update active state
    });
  });

  renderIcons(listEl);
}

function buildSdefTree(assets) {
  const root = {};
  for (const asset of assets) {
    const tPath = asset.originalAsset?.treePath || asset.path;
    const parts = tPath.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!node[seg]) node[seg] = { _files: [] };
      node = node[seg];
    }
    if (!node._files) node._files = [];
    node._files.push(asset);
  }
  return root;
}

function renderSdefTreeNode(node, parentPath = [], depth = 0) {
  let html = '';
  const keys = Object.keys(node).filter(k => k !== '_files').sort();
  const state = getState();
  const currentSdef = state.currentSdef;

  for (const key of keys) {
    const child = node[key];
    const currentPathArr = [...parentPath, key];
    const pathStr = currentPathArr.join('/');
    const isOpen = sdefOpenFolders.has(pathStr);
    const count = countSdefFiles(child);
    const indent = depth * 12;

    html += `
            <div class="sdef-folder-item" data-folder-path="${pathStr}" style="padding-left:${8 + indent}px">
                <span class="sdef-folder-toggle ${isOpen ? 'open' : ''}">
                    ${getIcon('chevron-right', 'w-3 h-3')}
                </span>
                <span class="sdef-folder-icon">${getIcon(isOpen ? 'folder-open' : 'folder', 'w-3 h-3')}</span>
                <span class="sdef-folder-name">${key}</span>
                <span class="sdef-folder-count">${count}</span>
            </div>
        `;

    if (isOpen) {
      html += renderSdefTreeNode(child, currentPathArr, depth + 1);
    }
  }

  if (node._files && node._files.length > 0) {
    node._files.sort((a, b) => a.path.localeCompare(b.path)).forEach(file => {
      const state = getState();
      const parts = file.path.split('/');
      const name = parts.pop();
      const isActive = file.path === state.currentSdef;
      const hasContent = !!file.sdefContent;
      const isUnsaved = !!state.unsavedSdefs[file.path];
      const indent = (depth + 1) * 12;

      html += `
               <div class="sdef-file-item ${isActive ? 'active' : ''} ${hasContent ? 'modified' : ''}" 
                    data-sdef-path="${file.path}"
                    style="padding-left:${8 + indent}px">
                 <div class="sdef-file-icon">
                   ${getIcon('file-audio', 'w-3 h-3')}
                 </div>
                 <div class="sdef-file-name truncate">${name}</div>
                 ${isUnsaved ? '<div class="sdef-modified-dot" style="background-color: var(--accent-orange);"></div>' : (hasContent ? '<div class="sdef-modified-dot"></div>' : '')}
               </div>
             `;
    });
  }

  return html;
}

function countSdefFiles(node) {
  let c = (node._files || []).length;
  for (const key of Object.keys(node)) {
    if (key !== '_files') c += countSdefFiles(node[key]);
  }
  return c;
}

function renderNoSelection() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${getIcon('file', 'icon-xl')}</div>
      <div class="empty-state-title" data-i18n="sdef.noSelectionTitle">Select a SDEF file</div>
      <div class="empty-state-text" data-i18n="sdef.noSelectionText">Choose a file from the sidebar to start editing.</div>
    </div>
  `;
}

function renderEditorContent() {
  const state = getState();
  const currentSdef = state.currentSdef;

  const rawContent = currentParams ? generateSdef(currentParams) : '';

  // Group params by group
  const groups = {};
  for (const param of SDEF_PARAMS) {
    if (!groups[param.group]) groups[param.group] = [];
    groups[param.group].push(param);
  }

  const groupMeta = {
    include: { label: t('sdef.groups.include'), icon: 'link', color: '#3b82f6' },
    sample: { label: t('sdef.groups.sample'), icon: 'music', color: '#06b6d4' },
    volume: { label: t('sdef.groups.volume'), icon: 'volume-2', color: '#10b981' },
    frequency: { label: t('sdef.groups.frequency'), icon: 'music-2', color: '#8b5cf6' },
    filtering: { label: t('sdef.groups.filtering'), icon: 'settings-2', color: '#f59e0b' },
    position: { label: t('sdef.groups.position'), icon: 'map-pin', color: '#ef4444' },
    radius: { label: t('sdef.groups.radius'), icon: 'wifi', color: '#06b6d4' },
    cone: { label: t('sdef.groups.cone'), icon: 'triangle', color: '#f59e0b' },
    playmode: { label: t('sdef.groups.playmode'), icon: 'play-circle', color: '#10b981' },
    envelope: { label: t('sdef.groups.envelope'), icon: 'trending-up', color: '#8b5cf6' },
    stereo: { label: t('sdef.groups.stereo'), icon: 'headphones', color: '#3b82f6' },
    doppler: { label: t('sdef.groups.doppler'), icon: 'waves', color: '#ef4444' },
  };

  let visualHtml = '';
  for (const [groupKey, params] of Object.entries(groups)) {
    const meta = groupMeta[groupKey] || { label: groupKey, icon: 'settings', color: '#6b7280' };

    // Translate group label if possible (requires t to be available, or pre-translated)
    // meta.label is already translated in groupMeta definition above? 
    // Wait, groupMeta is defined inside renderEditorContent, using t(). So it's fine.

    let fieldsHtml = '';

    for (const param of params) {
      if (param.key === 'wave') {
        const waves = currentParams.wave || [];
        const waveStr = Array.isArray(waves) ? waves.join('\n') : waves;

        fieldsHtml += `
          <div class="sdef-param-row sdef-param-row--tall">
            <div class="sdef-param-meta">
              <div class="sdef-param-name">${param.key}</div>
              <div class="sdef-param-desc">${param.desc}</div>
            </div>
            <div class="sdef-param-control">
              <textarea class="input-field" data-param="wave" rows="3"
                placeholder="Effects/path/to/sound (one per line for multiple)"
                style="font-size: 12px; min-height: 72px; font-family: var(--font-mono);">${waveStr}</textarea>
              <div class="sdef-param-hint">One path per line for random sample selection</div>
            </div>
          </div>
        `;
        continue;
      }

      const val = currentParams[param.key] ?? '';
      let inputHtml = '';

      if (param.type === 'boolean') {
        inputHtml = `
          <label class="toggle">
            <input type="checkbox" data-param="${param.key}" ${val === true ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        `;
      } else if (param.type === 'vec3') {
        const v = Array.isArray(val) ? val : [0, 0, 0];
        inputHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <input class="input-field sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="0" value="${v[0]}" placeholder="fwd" />
            <input class="input-field sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="1" value="${v[1]}" placeholder="up" />
            <input class="input-field sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="2" value="${v[2]}" placeholder="right" />
          </div>
        `;
      } else if (param.type === 'enum') {
        inputHtml = `
          <select class="input-field" data-param="${param.key}">
            ${param.values.map(v => `<option value="${v}" ${val === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        `;
      } else if (param.type === 'number') {
        inputHtml = `<input class="input-field sdef-num-input" type="number" step="any" data-param="${param.key}" value="${val}" placeholder="${param.default}" />`;
      } else {
        inputHtml = `<input class="input-field" type="text" data-param="${param.key}" value="${val}" placeholder="${param.default}" />`;
      }

      fieldsHtml += `
        <div class="sdef-param-row">
          <div class="sdef-param-meta">
            <div class="sdef-param-name">${param.key}</div>
            <div class="sdef-param-desc">${param.desc}</div>
          </div>
          <div class="sdef-param-control">${inputHtml}</div>
        </div>
      `;
    }

    // Check if collapsed (default open, but maybe we want to save state?)
    // For now, default open.
    visualHtml += `
      <div class="sdef-param-group" style="--group-color:${meta.color};">
        <div class="sdef-param-group-title">
          <span style="display:flex; align-items:center; gap:8px;">
             ${getIcon(meta.icon, 'w-4 h-4')}
             ${meta.label}
          </span>
          <span class="sdef-group-chevron">${getIcon('chevron-down', 'w-4 h-4')}</span>
        </div>
        <div class="sdef-group-content">
           ${fieldsHtml}
        </div>
      </div>
    `;
  }

  const nameOnly = currentSdef ? currentSdef.split('/').pop() : '';
  const folderPath = currentSdef ? currentSdef.split('/').slice(0, -1).join(' / ') : '';
  const hasAudio = !!getAudioFile(currentSdef);

  return `
    <div class="sdef-editor-topbar">
      <div class="sdef-editor-filepath">
        ${folderPath ? `<span class="sdef-editor-folder">${folderPath} /</span>` : ''}
        <span class="sdef-editor-filename">${nameOnly}</span>
      </div>
      <div class="flex-gap">
        ${hasAudio ? `
        <button class="btn btn-secondary btn-sm" id="play-sdef-sound">
          ${getIcon('play', 'w-4 h-4')} <span data-i18n="project.play">Play</span>
        </button>
        ` : ''}
        <div class="sdef-mode-toggle">
          <button class="${currentMode === 'visual' ? 'sdef-mode-btn active' : 'sdef-mode-btn'}" id="mode-visual" data-i18n="sdef.visual">Visual</button>
          <button class="${currentMode === 'raw' ? 'sdef-mode-btn active' : 'sdef-mode-btn'}" id="mode-raw" data-i18n="sdef.raw">Raw</button>
        </div>
        <button class="btn btn-success btn-sm" id="save-sdef">
          ${getIcon('save', 'w-4 h-4')} <span data-i18n="sdef.save">Save</span>
        </button>
      </div>
    </div>
    <div id="visual-editor" class="${currentMode !== 'visual' ? 'hidden' : ''}">
      ${visualHtml}
    </div>
    <div id="raw-editor-container" class="${currentMode !== 'raw' ? 'hidden' : ''}">
      <textarea class="raw-editor" id="raw-editor-textarea">${rawContent}</textarea>
    </div>
  `;
}

function attachEditorHandlers(container) {
  attachEditorContentHandlers();
}

function attachEditorContentHandlers() {
  // Mode toggle
  document.getElementById('mode-visual')?.addEventListener('click', () => {
    currentMode = 'visual';
    document.getElementById('visual-editor')?.classList.remove('hidden');
    document.getElementById('raw-editor-container')?.classList.add('hidden');
    document.getElementById('mode-visual')?.classList.add('active');
    document.getElementById('mode-raw')?.classList.remove('active');
  });

  document.getElementById('mode-raw')?.addEventListener('click', () => {
    collectVisualParams();
    const raw = generateSdef(currentParams);
    const textarea = document.getElementById('raw-editor-textarea');
    if (textarea) textarea.value = raw;

    currentMode = 'raw';
    document.getElementById('visual-editor')?.classList.add('hidden');
    document.getElementById('raw-editor-container')?.classList.remove('hidden');
    document.getElementById('mode-raw')?.classList.add('active');
    document.getElementById('mode-visual')?.classList.remove('active');
  });

  // Group toggles
  document.querySelectorAll('.sdef-param-group-title').forEach(el => {
    el.addEventListener('click', () => {
      el.parentElement.classList.toggle('collapsed');
      // Force icon render update if needed, but chevron handles it via CSS
    });
  });

  // Change tracking for unsaved state
  const rawTextarea = document.getElementById('raw-editor-textarea');
  if (rawTextarea) {
    rawTextarea.addEventListener('input', (e) => {
      const state = getState();
      if (state.currentSdef) updateUnsavedSdef(state.currentSdef, e.target.value);
    });
  }

  document.querySelectorAll('#visual-editor input, #visual-editor select, #visual-editor textarea').forEach(el => {
    const handleUpdate = () => {
      const state = getState();
      if (state.currentSdef) {
        collectVisualParams();
        updateUnsavedSdef(state.currentSdef, generateSdef(currentParams));
      }
    };
    el.addEventListener('input', handleUpdate);
    el.addEventListener('change', handleUpdate);
  });

  // Save
  document.getElementById('save-sdef')?.addEventListener('click', () => {
    const state = getState();
    const currentSdef = state.currentSdef;
    if (!currentSdef) return;

    let content = '';
    if (currentMode === 'raw') {
      content = document.getElementById('raw-editor-textarea')?.value || '';
      currentParams = parseSdef(content);
    } else {
      collectVisualParams();
      content = generateSdef(currentParams);
    }

    setSdefContent(currentSdef, content);
    clearUnsavedSdef(currentSdef);
    renderSdefFileList();
    showToast(t('sdef.saved'), 'success');
  });

  // Play
  document.getElementById('play-sdef-sound')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    playSdefSound(btn);
  });
}

function playSdefSound(btn) {
  const state = getState();
  const currentSdef = state.currentSdef;
  if (!currentSdef) return;

  // Stop if playing
  if (currentAudioSource) {
    if (currentAudioSource.stop) currentAudioSource.stop();
    if (currentAudioSource.pause) currentAudioSource.pause();
    currentAudioSource = null;

    btn.innerHTML = `${getIcon('play', 'w-4 h-4')} <span>${t('project.play')}</span>`;
    if (btn._objectUrl) {
      URL.revokeObjectURL(btn._objectUrl);
      btn._objectUrl = null;
    }

    if (btn.dataset.playing === 'true') {
      btn.dataset.playing = 'false';
      return;
    }
  }

  const file = getAudioFile(currentSdef);
  if (!file) {
    showToast(t('project.missingAudio'), 'warning');
    return;
  }

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  currentAudioSource = audio;
  btn._objectUrl = url;
  btn.innerHTML = `${getIcon('pause', 'w-4 h-4')} <span>${t('project.stop')}</span>`;
  btn.dataset.playing = 'true';

  audio.play();
  audio.onended = () => {
    btn.innerHTML = `${getIcon('play', 'w-4 h-4')} <span>${t('project.play')}</span>`;
    btn.dataset.playing = 'false';
    URL.revokeObjectURL(url);
    btn._objectUrl = null;
    currentAudioSource = null;
  };
}

function collectVisualParams() {
  const container = document.getElementById('visual-editor');
  if (!container) return;

  currentParams = {};

  const waveEl = container.querySelector('[data-param="wave"]');
  if (waveEl && waveEl.value.trim()) {
    const lines = waveEl.value.trim().split('\n')
      .map(l => l.replace(/["'{},\t]/g, '').trim())
      .filter(Boolean);
    currentParams.wave = lines;
  }

  container.querySelectorAll('[data-param]').forEach(el => {
    const key = el.dataset.param;
    if (key === 'wave') return;
    const paramDef = SDEF_PARAMS.find(p => p.key === key);
    if (!paramDef) return;

    if (paramDef.type === 'boolean') {
      currentParams[key] = el.checked;
    } else if (paramDef.type === 'vec3') {
      const idx = parseInt(el.dataset.idx);
      if (!currentParams[key]) currentParams[key] = [0, 0, 0];
      currentParams[key][idx] = parseFloat(el.value) || 0;
    } else if (paramDef.type === 'number') {
      if (el.value !== '') currentParams[key] = parseFloat(el.value);
    } else if (paramDef.type === 'enum') {
      currentParams[key] = el.value;
    } else {
      if (el.value) currentParams[key] = el.value;
    }
  });
}
