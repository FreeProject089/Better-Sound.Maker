/**
 * sdef-editor.js — Integrated SDEF editor
 * Visual UI mode + raw text editor mode
 */

import { getState, subscribe, setSdefContent, getSdefContent, navigate, setCurrentSdef } from '../state/store.js';
import { SDEF_PARAMS, generateSdef, parseSdef } from '../utils/sdef-generator.js';
import { showToast } from '../components/toast.js';
import { detectSoundType, getTypeDefaults, SOUND_TYPES } from '../utils/audio-analyzer.js';

let currentMode = 'visual'; // 'visual' or 'raw'
let currentParams = {};

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
        <div class="empty-state-icon">🎛️</div>
        <div class="empty-state-title">No Assets Selected</div>
        <div class="empty-state-text">Select assets in the Library first, then edit their SDEF files here.</div>
      </div>
    `;
    return;
  }

  // Load current params
  if (currentSdef && selected[currentSdef]) {
    const content = getSdefContent(currentSdef);
    currentParams = content ? parseSdef(content) : {};
    // Set default waves from asset
    if (!currentParams.wave && selected[currentSdef].customWaves?.length) {
      currentParams.wave = selected[currentSdef].customWaves;
    }
    // Pre-fill sensible defaults for new SDEFs using detected sound type
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
        <h1 class="page-title">SDEF Editor</h1>
        <p class="page-description">Edit .sdef parameters — switch between visual UI and raw text modes.</p>
      </div>
    </div>
    <div class="editor-layout">
      <div class="editor-sidebar">
        <div style="padding: 8px 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.8px;">
          SDEF Files (${entries.length})
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
}

function renderSdefFileList() {
  const listEl = document.getElementById('sdef-file-list');
  if (!listEl) return;

  const state = getState();
  const entries = Object.entries(state.selectedAssets);
  const currentSdef = state.currentSdef;

  listEl.innerHTML = entries.map(([path, data]) => {
    const isActive = path === currentSdef;
    const hasContent = !!data.sdefContent;
    const name = path.split('/').pop();

    return `
      <div class="category-item ${isActive ? 'active' : ''}" data-sdef-path="${path}">
        <span style="font-size: 14px;">${hasContent ? '📝' : '📄'}</span>
        <span class="truncate" title="${path}" style="font-size: 12px;">${name}</span>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', () => {
      setCurrentSdef(el.dataset.sdefPath);
      const state = getState();
      const selected = state.selectedAssets;
      const content = getSdefContent(el.dataset.sdefPath);
      currentParams = content ? parseSdef(content) : {};
      if (!currentParams.wave && selected[el.dataset.sdefPath]?.customWaves?.length) {
        currentParams.wave = selected[el.dataset.sdefPath].customWaves;
      }
      // Pre-fill sensible defaults for new SDEFs
      if (!content) {
        const soundType = detectSoundType(el.dataset.sdefPath);
        const typeDefaults = getTypeDefaults(soundType);
        Object.entries(typeDefaults).forEach(([key, val]) => {
          if (currentParams[key] === undefined) currentParams[key] = val;
        });
      }
      const mainEl = document.getElementById('editor-main');
      if (mainEl) {
        mainEl.innerHTML = renderEditorContent();
        attachEditorContentHandlers();
      }
      renderSdefFileList();
    });
  });
}

function renderNoSelection() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">📄</div>
      <div class="empty-state-title">Select a SDEF file</div>
      <div class="empty-state-text">Choose a file from the sidebar to start editing.</div>
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

  const groupLabels = {
    include: '🔗 Include/Inherit',
    sample: '🎵 Sound Sample',
    volume: '🔊 Volume',
    frequency: '🎼 Frequency',
    filtering: '🎚️ Filtering',
    position: '📍 Position',
    radius: '📡 Radius',
    cone: '📐 Cone',
    playmode: '▶️ Play Mode',
    envelope: '📈 Envelope',
    stereo: '🎧 Stereo',
    doppler: '🌊 Doppler'
  };

  let visualHtml = '';
  for (const [groupKey, params] of Object.entries(groups)) {
    const label = groupLabels[groupKey] || groupKey;
    let fieldsHtml = '';

    for (const param of params) {
      if (param.key === 'wave') {
        // Special wave editor
        const waves = currentParams.wave || [];
        const waveStr = Array.isArray(waves) ? waves.join('\n') : waves;

        fieldsHtml += `
          <div class="sdef-param-row" style="align-items: start;">
            <div>
              <div class="sdef-param-name">${param.key}</div>
              <div class="sdef-param-desc">${param.desc}</div>
            </div>
            <div>
              <textarea class="input-field" data-param="wave" rows="3"
                placeholder="Effects/path/to/sound (one per line for multiple)"
                style="font-size: 12px; min-height: 60px;">${waveStr}</textarea>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">
                One path per line for random sample selection
              </div>
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
          <div style="display: flex; gap: 8px;">
            <input class="input-field" type="number" step="any" data-param="${param.key}" data-idx="0" value="${v[0]}" placeholder="fwd" style="width: 80px;" />
            <input class="input-field" type="number" step="any" data-param="${param.key}" data-idx="1" value="${v[1]}" placeholder="up" style="width: 80px;" />
            <input class="input-field" type="number" step="any" data-param="${param.key}" data-idx="2" value="${v[2]}" placeholder="right" style="width: 80px;" />
          </div>
        `;
      } else if (param.type === 'enum') {
        inputHtml = `
          <select class="input-field" data-param="${param.key}">
            ${param.values.map(v => `<option value="${v}" ${val === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        `;
      } else if (param.type === 'number') {
        inputHtml = `<input class="input-field" type="number" step="any" data-param="${param.key}" value="${val}" placeholder="${param.default}" style="width: 140px;" />`;
      } else {
        inputHtml = `<input class="input-field" type="text" data-param="${param.key}" value="${val}" placeholder="${param.default}" />`;
      }

      fieldsHtml += `
        <div class="sdef-param-row">
          <div>
            <div class="sdef-param-name">${param.key}</div>
            <div class="sdef-param-desc">${param.desc}</div>
          </div>
          <div>${inputHtml}</div>
        </div>
      `;
    }

    visualHtml += `
      <div class="sdef-param-group">
        <div class="sdef-param-group-title">${label}</div>
        ${fieldsHtml}
      </div>
    `;
  }

  return `
    <div class="flex-between" style="margin-bottom: 12px;">
      <div class="mono" style="font-size: 13px; color: var(--accent-cyan);">${currentSdef}</div>
      <div class="flex-gap">
        <button class="btn btn-sm ${currentMode === 'visual' ? 'btn-primary' : 'btn-secondary'}" id="mode-visual">Visual</button>
        <button class="btn btn-sm ${currentMode === 'raw' ? 'btn-primary' : 'btn-secondary'}" id="mode-raw">Raw</button>
        <button class="btn btn-sm btn-success" id="save-sdef">💾 Save</button>
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
    document.getElementById('mode-visual')?.classList.replace('btn-secondary', 'btn-primary');
    document.getElementById('mode-raw')?.classList.replace('btn-primary', 'btn-secondary');
  });

  document.getElementById('mode-raw')?.addEventListener('click', () => {
    // Sync visual → raw
    collectVisualParams();
    const raw = generateSdef(currentParams);
    const textarea = document.getElementById('raw-editor-textarea');
    if (textarea) textarea.value = raw;

    currentMode = 'raw';
    document.getElementById('visual-editor')?.classList.add('hidden');
    document.getElementById('raw-editor-container')?.classList.remove('hidden');
    document.getElementById('mode-raw')?.classList.replace('btn-secondary', 'btn-primary');
    document.getElementById('mode-visual')?.classList.replace('btn-primary', 'btn-secondary');
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
    renderSdefFileList();
    showToast('SDEF saved', 'success');
  });
}

function collectVisualParams() {
  // Collect values from visual form
  const container = document.getElementById('visual-editor');
  if (!container) return;

  currentParams = {};

  // Wave textarea
  const waveEl = container.querySelector('[data-param="wave"]');
  if (waveEl && waveEl.value.trim()) {
    const lines = waveEl.value.trim().split('\n').map(l => l.trim()).filter(Boolean);
    currentParams.wave = lines;
  }

  // Other params
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
