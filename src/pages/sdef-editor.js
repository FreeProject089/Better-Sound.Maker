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
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { detectSoundType, getTypeDefaults, SOUND_TYPES, getTypeIconHtml } from '../utils/audio-analyzer.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';

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
            <input class="sdef-stepper-input sdef-num-input" type="number" step="any" data-param="${param.key}" value="${val}" placeholder="${param.default}" />
            <button class="sdef-stepper-btn" data-stepper-inc="${param.key}">${getIcon('plus', 'w-3 h-3')}</button>
          </div>
        `;
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

  container.querySelector('#global-templates-btn')?.addEventListener('click', () => showTemplatesModal(container));
}

async function showTemplatesModal(container) {
  const state = getState();
  const templates = state.sdefTemplates || [];
  const entriesCount = Object.keys(state.selectedAssets).length;
  const currentSdef = state.currentSdef;

  const renderTemplateList = (listEl) => {
    if (templates.length === 0) {
      listEl.innerHTML = `
        <div class="tpl-empty">
          <div class="tpl-empty-icon">${getIcon('copy', 'w-12 h-12')}</div>
          <h4>Aucun Preset Trouvé</h4>
          <p>Créez votre premier preset avec le formulaire à droite.</p>
        </div>
      `;
      return;
    }
    listEl.innerHTML = templates.map(t => `
      <div class="tpl-item" data-id="${t.id}">
        <div class="tpl-item-main">
          <div class="tpl-item-icon">${getIcon(t.lucideIcon || 'star', 'w-4 h-4')}</div>
          <div class="tpl-item-info">
            <span class="tpl-item-name">${t.name}</span>
          </div>
          <div class="tpl-item-actions">
            <button class="tpl-btn-icon" data-export="${t.id}" title="Exporter">${getIcon('upload', 'w-3 h-3')}</button>
            <button class="tpl-btn-icon tpl-btn-danger" data-delete="${t.id}" title="Supprimer">${getIcon('trash-2', 'w-3 h-3')}</button>
          </div>
        </div>
        <div class="tpl-item-apply">
          <button class="tpl-btn-apply" data-apply-current="${t.id}" style="${!currentSdef ? 'display:none' : ''}">Actuel</button>
          <button class="tpl-btn-apply primary" data-apply-all="${t.id}" style="${entriesCount <= 1 ? 'display:none' : ''}">Tous (${entriesCount})</button>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-apply-current]').forEach(btn => {
      btn.addEventListener('click', () => applyTemplate(templates.find(x => x.id === btn.dataset.applyCurrent), false));
    });
    listEl.querySelectorAll('[data-apply-all]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`Appliquer à l'ensemble des ${entriesCount} fichiers ?`)) {
          applyTemplate(templates.find(x => x.id === btn.dataset.applyAll), true);
        }
      });
    });
    listEl.querySelectorAll('.tpl-btn-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.export) exportSingleSdefTemplate(btn.dataset.export);
        else if (btn.dataset.delete) {
          deleteSdefTemplate(btn.dataset.delete);
          showTemplatesModal(container);
        }
      });
    });
    renderIcons(listEl);
  };

  await showModal({
    title: `${getIcon('copy', 'w-5 h-5')} Gestionnaire de Templates`,
    content: `
      <style>
        /* Targeted Override to enlarge the system modal while keeping its look */
        #modal-overlay:has(.tpl-root) .modal {
          max-width: 880px;
          padding: 0;
          overflow: hidden;
        }

        /* Hide the default modal footer/actions bar for this view */
        #modal-overlay:has(.tpl-root) .modal-actions,
        #modal-overlay:has(.tpl-root) .modal-footer {
          display: none !important;
        }

        .tpl-root { display: flex; gap: 0; width: 820px; height: 580px; background: transparent; overflow: hidden; }
        
        .tpl-left { width: 340px; display: flex; flex-direction: column; border-right: 1px solid var(--border); background: rgba(0,0,0,0.1); }
        .tpl-l-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .tpl-l-header h3 { margin: 0; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
        .tpl-l-content { flex: 1; overflow-y: auto; padding: 15px; }
        .tpl-l-footer { padding: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.05); }

        .tpl-right { flex: 1; padding: 30px; display: flex; flex-direction: column; gap: 25px; background: linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 100%); }
        .tpl-r-header h2 { margin: 0; font-size: 22px; font-weight: 800; color: var(--accent-blue); }
        .tpl-r-header p { margin: 5px 0 0 0; font-size: 12px; color: var(--text-muted); }

        .tpl-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 12px; transition: all 0.2s; }
        .tpl-item:hover { border-color: var(--accent-blue); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .tpl-item-main { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .tpl-item-icon { width: 32px; height: 32px; background: rgba(59,130,246,0.1); color: var(--accent-blue); display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgba(59,130,246,0.2); }
        .tpl-item-info { flex: 1; }
        .tpl-item-name { font-weight: 700; font-size: 13px; color: var(--text-primary); }
        .tpl-item-actions { display: flex; gap: 5px; }
        
        .tpl-item-apply { display: flex; gap: 8px; }
        .tpl-btn-apply { flex: 1; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-primary); font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .tpl-btn-apply:hover { background: rgba(255,255,255,0.1); border-color: var(--text-muted); }
        .tpl-btn-apply.primary { background: var(--accent-blue); border-color: var(--accent-blue); color: white; }
        .tpl-btn-apply.primary:hover { filter: brightness(1.1); }

        .tpl-btn-icon { width: 28px; height: 28px; border-radius: 6px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .tpl-btn-icon:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .tpl-btn-danger:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        .tpl-empty { text-align: center; padding: 40px 20px; color: var(--text-muted); }
        .tpl-empty-icon { margin-bottom: 15px; opacity: 0.2; display: flex; justify-content: center; }
        .tpl-empty h4 { margin: 0 0 5px 0; font-size: 14px; color: var(--text-primary); }
        .tpl-empty p { margin: 0; font-size: 12px; }

        .tpl-icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; border: 1px solid var(--border); max-height: 140px; overflow-y: auto; }
        .tpl-icon-dot { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
        .tpl-icon-dot:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .tpl-icon-dot.selected { background: var(--accent-blue); color: white; }

        .tpl-footer-btn { height: 32px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 11px; font-weight: 700; }
        .tpl-footer-row { display: flex; gap: 8px; }
      </style>
      <div class="tpl-root">
        <div class="tpl-left">
          <div class="tpl-l-header">
            <h3>Bibliothèque</h3>
            <div style="font-size: 10px; background: var(--accent-blue); color: white; padding: 2px 6px; border-radius: 10px; font-weight: 800;">${templates.length}</div>
          </div>
          <div class="tpl-l-content" id="tpl-list"></div>
          <div class="tpl-l-footer">
            <div class="tpl-footer-row">
              <button class="btn btn-secondary tpl-footer-btn flex-1" id="import-tpl">${getIcon('download', 'w-3 h-3')} Importer</button>
              <button class="btn btn-secondary tpl-footer-btn flex-1" id="export-tpl">${getIcon('share-2', 'w-3 h-3')} Exporter</button>
            </div>
            <button class="btn btn-danger tpl-footer-btn w-full" id="close-tpl-manager">${getIcon('x-circle', 'w-3.5 h-3.5')} Fermer le Gestionnaire</button>
          </div>
        </div>
        
        <div class="tpl-right">
          <div class="tpl-r-header">
            <h2>Nouveau Template</h2>
            <p>Enregistrez les paramètres actuels comme preset réutilisable.</p>
          </div>

          <div class="tpl-r-form" style="display: flex; flex-direction: column; gap: 20px;">
            <div class="input-group">
              <label class="input-label">NOM DU TEMPLATE</label>
              <input type="text" id="tpl-name" class="input-field" placeholder="ex: Cinema Engine" style="height: 42px; background: var(--bg-surface);" />
            </div>

            <div class="input-group">
              <label class="input-label">SOURCE (ASSET)</label>
              <select id="tpl-source" class="input-field" style="height: 42px; background: var(--bg-surface);">
                ${Object.keys(state.selectedAssets).map(p => `<option value="${p}" ${p === currentSdef ? 'selected' : ''}>${p.split('/').pop()}</option>`).join('')}
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">ICÔNE VISUELLE</label>
              <div class="tpl-icon-grid" id="tpl-icons">
                ${AVAILABLE_ICONS.map(icon => `<div class="tpl-icon-dot" data-icon="${icon}">${getIcon(icon, 'w-4 h-4')}</div>`).join('')}
              </div>
            </div>

            <button class="btn btn-primary w-full" id="tpl-save" style="height: 48px; font-weight: 800; font-size: 15px; margin-top: 10px;">
              ${getIcon('plus-circle', 'w-5 h-5')} Créer le Preset
            </button>
          </div>
        </div>
      </div>
    `,
    actions: [],
    onRender: (modalEl) => {
      const listEl = modalEl.querySelector('#tpl-list');
      renderTemplateList(listEl);

      let selectedIcon = 'star';
      const iconDots = modalEl.querySelectorAll('.tpl-icon-dot');
      iconDots[0].classList.add('selected');
      iconDots.forEach(dot => {
        dot.addEventListener('click', () => {
          iconDots.forEach(d => d.classList.remove('selected'));
          dot.classList.add('selected');
          selectedIcon = dot.dataset.icon;
        });
      });

      modalEl.querySelector('#tpl-save').addEventListener('click', () => {
        const name = modalEl.querySelector('#tpl-name').value;
        const source = modalEl.querySelector('#tpl-source').value;
        if (!name) { showToast('Name required', 'warning'); return; }

        const content = state.unsavedSdefs[source] || getSdefContent(source);
        const params = parseSdef(content);
        delete params.wave;

        saveSdefTemplate({ id: 'tpl_' + Date.now(), name, lucideIcon: selectedIcon, params });
        showToast('Template Saved', 'success');
        showTemplatesModal(container);
      });

      modalEl.querySelector('#import-tpl').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
          try {
            const file = e.target.files[0]; if (!file) return;
            const json = JSON.parse(await file.text());
            importSdefTemplates(Array.isArray(json) ? json : [json]);
            showTemplatesModal(container);
          } catch { showToast('Import failed', 'error'); }
        };
        input.click();
      });

      modalEl.querySelector('#export-tpl').addEventListener('click', exportSdefTemplates);

      modalEl.querySelector('#close-tpl-manager').addEventListener('click', () => {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
          overlay.classList.add('hidden');
          overlay.innerHTML = '';
        }
      });
    }
  });
}


function applyTemplate(template, applyToAll = false) {
  const state = getState();

  if (applyToAll) {
    const assets = state.selectedAssets;
    const updates = {};
    for (const path of Object.keys(assets)) {
      const existingContent = state.unsavedSdefs[path] || getSdefContent(path);
      const existingParams = parseSdef(existingContent);
      const newParams = { ...template.params };
      if (existingParams.wave) newParams.wave = existingParams.wave;
      updates[path] = generateSdef(newParams);
    }
    bulkSetSdefContent(updates);
    showToast(`Applied to ${Object.keys(updates).length} assets`, 'success');
  } else {
    const path = state.currentSdef;
    if (!path) return;
    const currentWave = currentParams.wave;
    currentParams = { ...template.params };
    if (currentWave) currentParams.wave = currentWave;
    updateUnsavedSdef(path, generateSdef(currentParams));
    showToast(`Applied to current SDEF`, 'success');
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
