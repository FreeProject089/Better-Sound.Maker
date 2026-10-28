/**
 * sdef-editor.js — Integrated SDEF editor
 * Visual UI mode + raw text editor mode
 */

import {
  getState, subscribe, setSdefContent, getSdefContent, navigate,
  setCurrentSdef, getAudioFile, updateUnsavedSdef, clearUnsavedSdef,
  saveSdefTemplate, deleteSdefTemplate, exportSdefTemplates, exportSingleSdefTemplate, importSdefTemplates,
  bulkSetSdefContent
} from '../state/store.js';
import { SDEF_PARAMS, generateSdef, parseSdef } from '../utils/sdef-generator.js';
import { lintSdef, attenuationRadii, gainAtDistance } from '../utils/sdef-lint.js';
import { escapeHtml } from '../utils/html.js';
import { renderWavePanel, attachWavePanel } from '../components/wave-panel.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { detectSoundType, getTypeDefaults, SOUND_TYPES, getTypeIconHtml } from '../utils/audio-analyzer.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations, getCurrentLanguage } from '../utils/i18n.js';

let currentMode = 'visual'; // 'visual' or 'raw'
let currentParams = {};
let currentAudioSource = null;

const AVAILABLE_ICONS = [
  'star', 'flame', 'key', 'headphones', 'toggle-left', 'megaphone', 'radio',
  'crosshair', 'cog', 'snowflake', 'circle-dot', 'shield', 'wind',
  'plane', 'radio-tower', 'bomb', 'hammer', 'user', 'globe',
  'mouse-pointer', 'volume-2', 'music', 'speaker', 'bell', 'zap',
  'sun', 'moon', 'cloud', 'droplet', 'thermometer', 'anchor',
  'compass', 'map', 'navigation', 'alert-triangle', 'alert-circle',
  'info', 'check-circle', 'x-circle', 'settings', 'user-plus', 'layers'
];

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
      <div class="flex-gap">
        <button class="btn btn-secondary" id="global-templates-btn">
          ${getIcon('copy', 'w-4 h-4')} <span>Templates</span>
        </button>
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

  // If we have unsaved raw content, use it for raw mode
  // Otherwise generate it from currentParams
  let rawContent = '';
  if (currentSdef) {
    const storedRaw = state.unsavedSdefs[currentSdef] || getSdefContent(currentSdef);
    if (storedRaw && (currentMode === 'raw')) {
      rawContent = storedRaw;
    } else {
      rawContent = generateSdef(currentParams);
    }
  } else if (currentParams) {
    rawContent = generateSdef(currentParams);
  }

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
        const waves = Array.isArray(currentParams.wave) ? currentParams.wave : currentParams.wave ? [currentParams.wave] : [];
        fieldsHtml += `
          <div class="sdef-param-row sdef-param-row--tall" data-param-row="wave">
            <div class="sdef-param-meta">
              <div class="sdef-param-name">${param.key}</div>
              <div class="sdef-param-desc">${param.desc}</div>
            </div>
            <div class="sdef-param-control" id="wave-panel-host">${renderWavePanel(currentSdef || '', waves)}</div>
          </div>
        `;
        continue;
      }

      const val = currentParams[param.key] ?? '';
      let inputHtml = '';

      if (param.type === 'boolean') {
        inputHtml = `
          <label class="toggle">
            <input type="checkbox" data-param="${param.key}" ${(val === '' ? param.default : val) === true ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        `;
      } else if (param.type === 'vec3') {
        const v = Array.isArray(val) ? val : [0, 0, 0];
        inputHtml = `
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <div class="sdef-stepper">
              <button class="sdef-stepper-btn" data-stepper-dec="${param.key}" data-idx="0">${getIcon('minus', 'w-3 h-3')}</button>
              <input class="sdef-stepper-input sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="0" value="${v[0]}" placeholder="fwd" />
              <button class="sdef-stepper-btn" data-stepper-inc="${param.key}" data-idx="0">${getIcon('plus', 'w-3 h-3')}</button>
            </div>
            <div class="sdef-stepper">
              <button class="sdef-stepper-btn" data-stepper-dec="${param.key}" data-idx="1">${getIcon('minus', 'w-3 h-3')}</button>
              <input class="sdef-stepper-input sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="1" value="${v[1]}" placeholder="up" />
              <button class="sdef-stepper-btn" data-stepper-inc="${param.key}" data-idx="1">${getIcon('plus', 'w-3 h-3')}</button>
            </div>
            <div class="sdef-stepper">
              <button class="sdef-stepper-btn" data-stepper-dec="${param.key}" data-idx="2">${getIcon('minus', 'w-3 h-3')}</button>
              <input class="sdef-stepper-input sdef-vec-input" type="number" step="any" data-param="${param.key}" data-idx="2" value="${v[2]}" placeholder="right" />
              <button class="sdef-stepper-btn" data-stepper-inc="${param.key}" data-idx="2">${getIcon('plus', 'w-3 h-3')}</button>
            </div>
          </div>
        `;
      } else if (param.type === 'tristate') {
        const cur = val === true ? 'true' : val === false ? 'false' : '';
        inputHtml = `
          <select class="input-field" data-param="${param.key}">
            <option value="" ${cur === '' ? 'selected' : ''}>${t('sdef.unset') || '— unset —'}</option>
            <option value="true" ${cur === 'true' ? 'selected' : ''}>true</option>
            <option value="false" ${cur === 'false' ? 'selected' : ''}>false</option>
          </select>
        `;
      } else if (param.type === 'enum') {
        inputHtml = `
          <select class="input-field" data-param="${param.key}">
            ${param.values.map(v => `<option value="${v}" ${val === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        `;
      } else if (param.type === 'number') {
        inputHtml = `
          <div class="sdef-stepper">
            <button class="sdef-stepper-btn" data-stepper-dec="${param.key}">${getIcon('minus', 'w-3 h-3')}</button>
            <input class="sdef-stepper-input sdef-num-input" type="number" step="${param.step || 'any'}" data-param="${param.key}" value="${escapeHtml(val)}" placeholder="${param.default}" />
            <button class="sdef-stepper-btn" data-stepper-inc="${param.key}">${getIcon('plus', 'w-3 h-3')}</button>
          </div>
        `;
      } else {
        inputHtml = `<input class="input-field" type="text" data-param="${param.key}" value="${escapeHtml(val)}" placeholder="${param.default}" />`;
      }

      fieldsHtml += `
        <div class="sdef-param-row" data-param-row="${param.key}">
          <div class="sdef-param-meta">
            <div class="sdef-param-name">${param.key}${param.undocumented ? ` <span class="sdef-badge" title="${escapeHtml(t('sdef.undocumentedHint') || "Not in ED's example.sdef, but used in official DCS files")}">ED</span>` : ''}</div>
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
           ${groupKey === 'radius' ? '<div class="sdef-curve" id="sdef-curve"></div>' : ''}
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
        ${folderPath ? `<span class="sdef-editor-folder">${escapeHtml(folderPath)} /</span>` : ''}
        <span class="sdef-editor-filename">${escapeHtml(nameOnly)}</span>
      </div>
      <div class="flex-gap">
        ${hasAudio ? `
        <button class="btn ${currentAudioSource ? 'btn-danger' : 'btn-secondary'} btn-sm" id="play-sdef-sound">
          ${currentAudioSource ? getIcon('square', 'w-4 h-4') : getIcon('play', 'w-4 h-4')} 
          <span data-i18n="${currentAudioSource ? 'project.stop' : 'project.play'}">${currentAudioSource ? 'Stop' : 'Play'}</span>
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
    <div id="sdef-lint" class="sdef-lint"></div>
    <div id="visual-editor" class="${currentMode !== 'visual' ? 'hidden' : ''}">
      ${visualHtml}
    </div>
    <div id="raw-editor-container" class="${currentMode !== 'raw' ? 'hidden' : ''}">
      <textarea class="raw-editor" id="raw-editor-textarea" spellcheck="false">${escapeHtml(rawContent)}</textarea>
    </div>
  `;
}

function attachEditorHandlers(container) {
  attachEditorContentHandlers();

  container.querySelector('#global-templates-btn')?.addEventListener('click', () => showTemplatesModal(container));
}

async function showTemplatesModal() {
  const { openTemplateManager } = await import('../components/template-manager.js');
  openTemplateManager(applyTemplate);
}

function applyTemplate(template, applyToAll = false) {
  const state = getState();

  if (applyToAll) {
    const assets = state.selectedAssets;
    const updates = {};
    // applyToAll: true = every SDEF, a string = every SDEF under that folder
    const paths = Object.keys(assets).filter(p => applyToAll === true || p.startsWith(applyToAll + '/'));
    for (const path of paths) {
      const existingContent = state.unsavedSdefs[path] || getSdefContent(path);
      const existingParams = parseSdef(existingContent);
      const newParams = { ...template.params };
      if (existingParams.wave) newParams.wave = existingParams.wave;
      updates[path] = generateSdef(newParams);
    }
    bulkSetSdefContent(updates);
    showToast(t('sdef.templates.appliedAll', { count: Object.keys(updates).length }), 'success');
  } else {
    const path = state.currentSdef;
    if (!path) return;
    const currentWave = currentParams.wave;
    currentParams = { ...template.params };
    if (currentWave) currentParams.wave = currentWave;
    updateUnsavedSdef(path, generateSdef(currentParams));
    showToast(t('sdef.templates.appliedCurrent'), 'success');
  }

  const mainEl = document.getElementById('editor-main');
  if (mainEl) {
    mainEl.innerHTML = renderEditorContent();
    renderIcons(mainEl);
    attachEditorContentHandlers();
  }
}

function attachEditorContentHandlers() {
  // Mode toggle
  // Mode toggle
  document.getElementById('mode-visual')?.addEventListener('click', () => {
    if (currentMode === 'raw') {
      const textarea = document.getElementById('raw-editor-textarea');
      if (textarea) {
        currentParams = parseSdef(textarea.value);
        // We need to update the visual UI fields because they are outdated
        const mainEl = document.getElementById('editor-main');
        if (mainEl) {
          currentMode = 'visual'; // set before re-render
          mainEl.innerHTML = renderEditorContent();
          renderIcons(mainEl);
          attachEditorContentHandlers();
        }
        return;
      }
    }

    currentMode = 'visual';
    document.getElementById('visual-editor')?.classList.remove('hidden');
    document.getElementById('raw-editor-container')?.classList.add('hidden');
    document.getElementById('mode-visual')?.classList.add('active');
    document.getElementById('mode-raw')?.classList.remove('active');
  });

  document.getElementById('mode-raw')?.addEventListener('click', () => {
    if (currentMode === 'visual') {
      collectVisualParams();
      const raw = generateSdef(currentParams);
      const textarea = document.getElementById('raw-editor-textarea');
      if (textarea) textarea.value = raw;

      // Also update the unsaved state so if we switch away and back, it's there
      const state = getState();
      if (state.currentSdef) updateUnsavedSdef(state.currentSdef, raw);
    }

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
      refreshInsights(parseSdef(e.target.value));
    });
  }

  document.querySelectorAll('#visual-editor input, #visual-editor select, #visual-editor textarea').forEach(el => {
    const handleUpdate = () => {
      const state = getState();
      if (state.currentSdef) {
        collectVisualParams();
        updateUnsavedSdef(state.currentSdef, generateSdef(currentParams));
      }
      refreshInsights(currentParams);
    };
    el.addEventListener('input', handleUpdate);
    el.addEventListener('change', handleUpdate);
  });

  // Stepper buttons
  document.querySelectorAll('[data-stepper-dec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.stepperDec;
      const input = btn.parentElement.querySelector('input');
      if (input) {
        const step = parseFloat(input.step) || 1;
        const val = parseFloat(input.value) || 0;
        input.value = Math.round((val - step) * 1000) / 1000;
        input.dispatchEvent(new Event('input'));
      }
    });
  });

  document.querySelectorAll('[data-stepper-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.stepperInc;
      const input = btn.parentElement.querySelector('input');
      if (input) {
        const step = parseFloat(input.step) || 1;
        const val = parseFloat(input.value) || 0;
        input.value = Math.round((val + step) * 1000) / 1000;
        input.dispatchEvent(new Event('input'));
      }
    });
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

  bindWavePanel();

  refreshInsights(currentMode === 'raw'
    ? parseSdef(document.getElementById('raw-editor-textarea')?.value || '')
    : currentParams);

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
    renderIcons(btn);
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
  btn.innerHTML = `${getIcon('square', 'w-4 h-4')} <span>${t('project.stop')}</span>`;
  renderIcons(btn);
  btn.dataset.playing = 'true';

  audio.play();
  audio.onended = () => {
    btn.innerHTML = `${getIcon('play', 'w-4 h-4')} <span>${t('project.play')}</span>`;
    renderIcons(btn);
    btn.dataset.playing = 'false';
    URL.revokeObjectURL(url);
    btn._objectUrl = null;
    currentAudioSource = null;
  };
}

function collectVisualParams() {
  const container = document.getElementById('visual-editor');
  if (!container) return;

  // Preserve existing currentParams to keep custom fields
  if (!currentParams) currentParams = {};

  const waveEl = container.querySelector('[data-param="wave"]');
  if (waveEl) {
    const lines = waveEl.value.trim().split('\n')
      .map(l => l.replace(/["'{},\t]/g, '').trim())
      .filter(Boolean);
    if (lines.length > 0) {
      currentParams.wave = lines;
    } else {
      delete currentParams.wave;
    }
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
      if (el.value !== '') {
        currentParams[key] = parseFloat(el.value);
      } else {
        delete currentParams[key];
      }
    } else if (paramDef.type === 'tristate') {
      if (el.value === '') delete currentParams[key];
      else currentParams[key] = el.value === 'true';
    } else if (paramDef.type === 'enum') {
      currentParams[key] = el.value;
    } else {
      if (el.value) {
        currentParams[key] = el.value;
      } else {
        delete currentParams[key];
      }
    }
  });
}

/* ── Insights: lint panel + attenuation curve ─────────────────────── */

const LINT_ICONS = { error: 'x-circle', warning: 'alert-triangle', info: 'info' };

function refreshInsights(params) {
  const findings = lintSdef(params || {});

  const panel = document.getElementById('sdef-lint');
  if (panel) {
    const counts = { error: 0, warning: 0, info: 0 };
    findings.forEach(f => counts[f.level]++);
    const summary = `${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} note(s)`;
    panel.innerHTML = findings.length === 0
      ? `<div class="sdef-lint-ok">${getIcon('check-circle', 'w-4 h-4')} ${t('sdef.lint.ok') || 'No problems found'}</div>`
      : `<details class="sdef-lint-box" ${counts.error ? 'open' : ''}>
          <summary>${getIcon(counts.error ? 'x-circle' : 'alert-triangle', 'w-4 h-4')} ${summary}</summary>
          <ul>${findings.map(f => `
            <li class="sdef-lint-item sdef-lint-${f.level}" ${f.key ? `data-lint-key="${escapeHtml(f.key)}"` : ''}>
              ${getIcon(LINT_ICONS[f.level], 'w-3.5 h-3.5')} <span>${escapeHtml(f.message)}</span>
            </li>`).join('')}</ul>
        </details>`;
    renderIcons(panel);
    panel.querySelectorAll('[data-lint-key]').forEach(li => li.addEventListener('click', () => {
      const row = document.querySelector(`[data-param-row="${CSS.escape(li.dataset.lintKey)}"]`);
      if (!row || currentMode !== 'visual') return;
      row.closest('.sdef-param-group')?.classList.remove('collapsed');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.querySelector('input, select, textarea')?.focus();
    }));
  }

  document.querySelectorAll('[data-param-row]').forEach(row => {
    const levels = findings.filter(f => f.key === row.dataset.paramRow).map(f => f.level);
    row.classList.toggle('sdef-row-error', levels.includes('error'));
    row.classList.toggle('sdef-row-warning', !levels.includes('error') && levels.includes('warning'));
  });

  const curve = document.getElementById('sdef-curve');
  if (curve) curve.innerHTML = renderAttenuationCurve(params || {});
}

/** SVG of relative gain vs distance on a log-scaled distance axis. */
function renderAttenuationCurve(params) {
  const r = attenuationRadii(params);
  const gain = typeof params.gain === 'number' ? params.gain : 1;
  const W = 520, H = 160, PAD_L = 34, PAD_B = 32, PAD_T = 10, PAD_R = 10;
  const maxD = Math.max(r.outer * 1.1, 1);
  const lx = (d) => Math.log10(1 + d);
  const x = (d) => PAD_L + (lx(d) / lx(maxD)) * (W - PAD_L - PAD_R);
  const y = (g) => PAD_T + (1 - g) * (H - PAD_T - PAD_B);

  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const d = Math.pow(10, (i / 200) * lx(maxD)) - 1;
    pts.push(`${x(d).toFixed(1)},${y(gainAtDistance(d, r)).toFixed(1)}`);
  }

  const marks = [['silent', r.silent], ['peak', r.peak], ['inner', r.inner], ['outer', r.outer]]
    .filter(([, d], i, arr) => d > 0 && arr.findIndex(([, d2]) => d2 === d) === i);
  const fmtD = (d) => d >= 1000 ? `${+(d / 1000).toFixed(1)} km` : `${+d.toFixed(1)} m`;

  return `
    <div class="sdef-curve-title">${t('sdef.curve.title') || 'Distance attenuation'}
      <span>${t('sdef.curve.hint') || 'Relative gain by distance (log scale), multiplied by gain'} = ${escapeHtml(gain)}</span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distance attenuation curve">
      <line class="axis" x1="${PAD_L}" y1="${y(0)}" x2="${W - PAD_R}" y2="${y(0)}" />
      <line class="axis" x1="${PAD_L}" y1="${y(0)}" x2="${PAD_L}" y2="${y(1)}" />
      <text class="lbl" x="${PAD_L - 6}" y="${y(1) + 4}" text-anchor="end">1</text>
      <text class="lbl" x="${PAD_L - 6}" y="${y(0.85) + 4}" text-anchor="end">.85</text>
      <text class="lbl" x="${PAD_L - 6}" y="${y(0) + 4}" text-anchor="end">0</text>
      ${marks.map(([name, d], i) => {
        // Alternate label rows when marks are close; keep edge labels inside the box
        const close = i > 0 && x(d) - x(marks[i - 1][1]) < 70;
        const row = close && i % 2 ? H - 4 : H - 16;
        const anchor = x(d) > W - 50 ? 'end' : x(d) < PAD_L + 30 ? 'start' : 'middle';
        return `
        <line class="mark" x1="${x(d)}" y1="${y(0)}" x2="${x(d)}" y2="${y(1)}" />
        <text class="lbl" x="${x(d)}" y="${row}" text-anchor="${anchor}">${name} ${fmtD(d)}</text>`;
      }).join('')}
      <polyline class="curve" points="${pts.join(' ')}" />
    </svg>`;
}

/* ── Sound samples panel ──────────────────────────────────────────── */

function bindWavePanel() {
  const host = document.getElementById('wave-panel-host');
  const sdef = getState().currentSdef;
  if (!host || !sdef) return;
  // Readable DCS originals are indexed once; redraw when the index arrives so A/B shows up
  import('../utils/dcs-originals.js').then(m => {
    if (m.originalsReady()) return;
    m.loadOriginals().then(idx => {
      if (!idx || getState().currentSdef !== sdef || !document.getElementById('wave-panel-host')) return;
      collectVisualParams();
      host.innerHTML = renderWavePanel(sdef, currentParams.wave || []);
      bindWavePanel();
    });
  });
  attachWavePanel(host, sdef, () => { collectVisualParams(); return currentParams; }, () => {
    collectVisualParams();
    updateUnsavedSdef(sdef, generateSdef(currentParams));
    refreshInsights(currentParams);
    host.innerHTML = renderWavePanel(sdef, currentParams.wave || []);
    bindWavePanel();
  });
}
