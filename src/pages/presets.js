/**
 * presets.js — Presets / Templates system
 * Save, load, share, and apply asset selection presets
 */

import { getState, savePreset, deletePreset, updatePreset, importPreset, selectAsset, isAssetSelected, subscribe, setLibraryData, loadLibraryFromStorage, saveLibraryToStorage } from '../state/store.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { pickJsonFile } from '../utils/file-picker.js';
import { parseSdefList } from '../data/sdef-parser.js';
import { APP_VERSION } from '../utils/version.js';

import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

const PRESET_COLORS = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];

let autoPresetsScanned = false;

export async function renderPresets(container) {
  const state = getState();
  const presets = state.presets || [];
  const selectedCount = Object.keys(state.selectedAssets).length;
  const isLibraryLoaded = !!state.libraryData;

  // Auto-load library from storage if not loaded
  if (!isLibraryLoaded) {
    const cached = await loadLibraryFromStorage();
    if (cached) {
      // Re-render to update the isLibraryLoaded status
      renderPresets(container);
      return;
    }
  }

  // Removed silent auto-scan
  // (Left intentionally blank for Community Presets button handler below)

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('presetsPage.title')}</h1>
      <p class="page-description">${t('presetsPage.desc')}</p>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">${t('presetsPage.createTitle')}</div>
      </div>
      <div style="display: flex; gap: 12px; align-items: end;">
        <div class="input-group" style="flex: 1;">
          <label class="input-label">${t('presetsPage.presetName')}</label>
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <div style="display: flex; gap: 8px;">
              <input type="text" class="input-field" id="preset-name" placeholder="${t('presetsPage.namePlaceholder')}" style="flex: 1;" />
              <div style="display: flex; gap: 4px; align-items: center; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding-right: 4px;">
                <input type="text" id="preset-color" value="#3b82f6" style="width: 75px; background: transparent; border: none; font-family: monospace; font-size: 13px; text-transform: uppercase; padding: 0 8px; color: var(--text-primary); outline: none;" maxlength="7" />
                 <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <div id="preset-color-picker"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary" id="save-preset-btn">
          ${getIcon('save', 'w-4 h-4')} ${t('presetsPage.saveBtn', { count: selectedCount })}
        </button>
      </div>
      ${selectedCount === 0 ? `<div style="font-size: 12px; color: var(--accent-amber); margin-top: 8px;">${getIcon('alert-circle', 'w-3 h-3')} ${t('presetsPage.noSelectionWarning')}</div>` : ''}
    </div>

    <div class="flex-between" style="margin-bottom: 16px;">
      <h2 style="font-size: 18px; font-weight: 600;">${t('presetsPage.savedPresets', { count: presets.length })}</h2>
      <div class="flex-gap">
        ${!isLibraryLoaded ? `<button class="btn btn-warning btn-sm" id="load-library-presets-btn">${getIcon('refresh-cw', 'w-4 h-4')} ${t('presetsPage.loadLibraryBtn')}</button>` : ''}
        <button class="btn btn-secondary btn-sm" id="community-presets-btn">${getIcon('users', 'w-4 h-4')} ${t('presetsPage.communityBtn')}</button>
        <button class="btn btn-secondary btn-sm" id="import-preset-btn">${getIcon('download', 'w-4 h-4')} ${t('presetsPage.importBtn')}</button>
      </div>
    </div>

    ${!isLibraryLoaded ? `
      <div class="tip-box" style="margin-bottom: 20px; border-left-color: var(--accent-amber);">
        ${getIcon('alert-triangle', 'w-4 h-4')} ${t('presetsPage.libraryRequired')}
      </div>
    ` : ''}

    ${presets.length === 0 ? `
      <div class="empty-state" style="padding: 40px;">
        <div class="empty-state-icon">${getIcon('save', 'icon-xl')}</div>
        <div class="empty-state-title">${t('presetsPage.emptyTitle')}</div>
        <div class="empty-state-text">${t('presetsPage.emptyDesc')}</div>
      </div>
    ` : `
      <div class="grid-2">
        ${presets.map((preset, idx) => `
          <div class="card">
            <div class="flex-between" style="margin-bottom: 12px;">
              <div style="display: flex; gap: 12px; align-items: flex-start;">
                <div style="font-size: 20px; color: ${preset.color || 'var(--accent-blue)'}; padding-top: 2px;">
                  ${getIcon('layers', 'w-5 h-5')}
                </div>
                <div>
                  <div class="card-title">${preset.name}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    ${new Date(preset.date).toLocaleDateString()} — ${t('presetsPage.assetsLabel', { count: preset.assetPaths.length })}
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                ${preset.version ? `<span class="tag" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border-subtle);">v${preset.version}</span>` : ''}
                <span class="tag tag-blue">${preset.assetPaths.length}</span>
              </div>
            </div>
            <div style="max-height: 120px; overflow-y: auto; margin-bottom: 12px;">
              ${preset.assetPaths.slice(0, 8).map(p =>
    `<div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); padding: 1px 0;">${p}</div>`
  ).join('')}
              ${preset.assetPaths.length > 8 ? `<div style="font-size: 11px; color: var(--text-muted);">... and ${preset.assetPaths.length - 8} more</div>` : ''}
            </div>
            <div class="flex-gap">
              <button class="btn btn-primary btn-sm" data-apply-preset="${idx}">${t('presetsPage.applyBtn')}</button>
              <button class="btn btn-secondary btn-sm" data-edit-preset="${idx}">${getIcon('edit-2', 'w-4 h-4')}</button>
              <button class="btn btn-secondary btn-sm" data-export-preset="${idx}">${getIcon('upload', 'w-4 h-4')} ${t('presetsPage.exportBtn')}</button>
              <button class="btn btn-danger btn-sm" data-delete-preset="${idx}">${getIcon('trash-2', 'w-4 h-4')}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  // Event handlers
  // Swatch logic for create
  const createColorInput = container.querySelector('#preset-color');

  const pickr = Pickr.create({
    el: container.querySelector('#preset-color-picker'),
    theme: 'nano',
    default: '#3b82f6',
    components: {
      preview: true,
      hue: true,
      interaction: { hex: true, input: true, save: true }
    }
  });

  createColorInput?.addEventListener('input', (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      pickr.setColor(val);
    }
  });

  pickr.on('change', (color) => {
    createColorInput.value = color.toHEXA().toString().toUpperCase();
  }).on('save', (color) => {
    createColorInput.value = color.toHEXA().toString().toUpperCase();
    pickr.hide();
  });

  document.getElementById('save-preset-btn')?.addEventListener('click', () => {
    const nameInput = document.getElementById('preset-name');
    const name = nameInput?.value.trim();
    if (!name) {
      showToast('Please enter a preset name', 'warning');
      return;
    }
    if (selectedCount === 0) {
      showToast(t('presetsPage.noSelectionWarning'), 'warning');
      return;
    }
    const colorInput = document.getElementById('preset-color');
    const color = colorInput ? colorInput.value : '#3b82f6';
    savePreset(name, color);
    showToast(`Preset "${name}" saved`, 'success');
    renderPresets(container);
  });

  document.getElementById('load-library-presets-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('load-library-presets-btn');
    btn.disabled = true;
    btn.innerHTML = `${getIcon('refresh-cw', 'w-4 h-4 spin')} Loading...`;

    try {
      const resp = await fetch('./sdef_and_wave_list.txt');
      const text = await resp.text();
      const data = parseSdefList(text);
      setLibraryData(data);
      await saveLibraryToStorage(data);
      showToast('Library loaded successfully', 'success');
      renderPresets(container);
    } catch (e) {
      showToast('Failed to load library: ' + e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `${getIcon('refresh-cw', 'w-4 h-4')} ${t('presetsPage.loadLibraryBtn')}`;
    }
  });

  document.getElementById('community-presets-btn')?.addEventListener('click', () => showCommunityPresets(container));

  document.getElementById('import-preset-btn')?.addEventListener('click', () => importPresetFromFile(container));

  container.querySelectorAll('[data-apply-preset]').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(parseInt(btn.dataset.applyPreset), container));
  });

  container.querySelectorAll('[data-export-preset]').forEach(btn => {
    btn.addEventListener('click', () => exportPreset(parseInt(btn.dataset.exportPreset)));
  });

  container.querySelectorAll('[data-delete-preset]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.deletePreset);
      const resultPromise = showModal({
        title: t('presetsPage.deleteConfirm.title'),
        content: `<p>${t('presetsPage.deleteConfirm.content')}</p>`,
        actions: [
          { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
          { id: 'delete', label: t('common.delete'), class: 'btn-danger' }
        ]
      });
      const result = await resultPromise;
      if (result === 'delete') {
        deletePreset(idx);
        renderPresets(container);
        showToast('Preset deleted', 'info');
      }
    });
  });

  container.querySelectorAll('[data-edit-preset]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.editPreset);
      const preset = state.presets[idx];
      if (!preset) return;

      const resultPromise = showModal({
        title: 'Edit Preset',
        content: `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="input-group">
              <label class="input-label">Name</label>
              <input type="text" class="input-field" id="edit-preset-name" value="${preset.name.replace(/"/g, '&quot;')}" />
            </div>
            <div class="input-group">
              <label class="input-label">Color</label>
              <div style="display: flex; gap: 4px; align-items: center; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding-right: 4px; width: fit-content; margin-bottom: 8px;">
                <input type="text" id="edit-preset-color" value="${preset.color || '#3b82f6'}" style="width: 75px; background: transparent; border: none; font-family: monospace; font-size: 13px; text-transform: uppercase; padding: 0 8px; color: var(--text-primary); outline: none;" maxlength="7" />
                 <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <div id="edit-preset-picker"></div>
                 </div>
              </div>
            </div>

            <div class="input-group" style="padding-top: 12px; border-top: 1px solid var(--border);">
              <label class="input-label" style="display: flex; justify-content: space-between;">
                <span>Asset Contents</span>
                <span class="tag tag-blue">${preset.assetPaths?.length || 0} Assets</span>
              </label>
              
              <label style="display: flex; align-items: flex-start; gap: 8px; margin-top: 8px; background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: var(--radius-sm); cursor: pointer; border: 1px solid rgba(16, 185, 129, 0.2);">
                <input type="checkbox" id="edit-preset-update-assets" style="margin-top: 2px;" ${Object.keys(state.selectedAssets).length === 0 ? 'disabled' : ''} />
                <div style="font-size: 13px; color: var(--text-primary);">
                  <div style="font-weight: 600; margin-bottom: 2px;">Replace with current selection</div>
                  <div style="color: var(--text-muted); font-size: 11px;">Update this preset to contain your currently selected <b>${Object.keys(state.selectedAssets).length}</b> project assets.</div>
                </div>
              </label>
            </div>
          </div>
        `,
        actions: [
          { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
          { id: 'save', label: t('common.save') || 'Save', class: 'btn-primary' }
        ]
      });

      let newName = preset.name;
      let newColor = preset.color || '#3b82f6';
      let doUpdateAssets = false;

      setTimeout(() => {
        const nameInp = document.getElementById('edit-preset-name');
        const updateInp = document.getElementById('edit-preset-update-assets');
        if (nameInp) nameInp.addEventListener('input', e => newName = e.target.value);
        if (updateInp) updateInp.addEventListener('change', e => doUpdateAssets = e.target.checked);
      }, 50);

      const editColorInput = document.getElementById('edit-preset-color');

      const editPickr = Pickr.create({
        el: '#edit-preset-picker',
        theme: 'nano',
        default: preset.color || '#3b82f6',
        components: {
          preview: true,
          hue: true,
          interaction: { hex: true, input: true, save: true }
        }
      });

      editColorInput?.addEventListener('input', (e) => {
        let val = e.target.value;
        newColor = val;
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          editPickr.setColor(val);
        }
      });

      editPickr.on('change', (color) => {
        newColor = color.toHEXA().toString().toUpperCase();
        editColorInput.value = newColor;
      }).on('save', (color) => {
        newColor = color.toHEXA().toString().toUpperCase();
        editColorInput.value = newColor;
        editPickr.hide();
      });

      const result = await resultPromise;

      if (result === 'save') {
        const finalName = newName.trim();
        if (finalName) {
          const updates = { name: finalName, color: newColor };
          if (doUpdateAssets) {
            updates.assetPaths = Object.keys(getState().selectedAssets);
            updates.UpdateNumber = (preset.UpdateNumber || 1) + 1;
            updates.date = new Date().toISOString();
          }
          updatePreset(idx, updates);
          renderPresets(container);
          showToast('Preset updated', 'success');
        }
      }
    });
  });

  // Render icons (Lucide)
  renderIcons(container);
}

async function applyPreset(idx, container) {
  const state = getState();
  const preset = state.presets[idx];
  if (!preset) return;

  const libraryData = state.libraryData;
  if (!libraryData) {
    showToast('Library not loaded — load it first from the Library page', 'warning');
    return;
  }

  // Check if user has current work
  const currentCount = Object.keys(state.selectedAssets).length;
  if (currentCount > 0) {
    const result = await showModal({
      title: t('presetsPage.applyConfirm.title'),
      content: `
        <p>${t('presetsPage.applyConfirm.content1', { count: currentCount })}</p>
        <p>${t('presetsPage.applyConfirm.content2', { count: preset.assetPaths.length })}</p>
        <p style="margin-top: 12px; color: var(--text-muted); font-size: 13px;">
          ${t('presetsPage.applyConfirm.tip')}
        </p>
      `,
      actions: [
        { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
        { id: 'save-first', label: t('presetsPage.applyConfirm.saveAndApply'), class: 'btn-primary' },
        { id: 'apply', label: t('presetsPage.applyConfirm.applyOnly'), class: 'btn-warning' }
      ]
    });

    if (result === 'cancel') return;

    if (result === 'save-first') {
      // Auto-save current selection as a preset
      const autoName = `Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
      savePreset(autoName);
      showToast(`Current selection saved as "${autoName}"`, 'success');
    }
  }

  const allAssets = libraryData.sections.flatMap(s => s.assets);
  let applied = 0;

  for (const path of preset.assetPaths) {
    if (!isAssetSelected(path)) {
      const asset = allAssets.find(a => a.sdefPath === path);
      if (asset) {
        selectAsset(path, asset);
        applied++;
      }
    }
  }

  showToast(`Applied preset: ${applied} new assets selected`, 'success');
  renderPresets(container);
}

async function exportPreset(idx) {
  const state = getState();
  const preset = state.presets[idx];
  if (!preset) return;

  let versionVal = preset.version || '1.0.0';
  let updateNumVal = preset.UpdateNumber || 1;

  setTimeout(() => {
    const vInput = document.getElementById('export-version');
    const uInput = document.getElementById('export-updatenum');
    if (vInput) vInput.addEventListener('input', e => versionVal = e.target.value);
    if (uInput) uInput.addEventListener('input', e => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) updateNumVal = val;
    });
  }, 50);

  const action = await showModal({
    title: t('presetsPage.exportConfirmTitle') || `Export Preset: ${preset.name}`,
    content: `
      <p style="margin-bottom: 12px; color: var(--text-muted); font-size: 13px;">
        ${t('presetsPage.exportConfirmDesc') || 'Confirm the version and update number before exporting.'}
      </p>
      <div class="input-group">
        <label class="input-label">${t('project.version') || 'Version'} (e.g. 1.0.2)</label>
        <input type="text" id="export-version" class="input-field" value="${versionVal}" />
      </div>
      <div class="input-group" style="margin-top: 12px;">
        <label class="input-label">${t('presetsPage.updateNumberLabel') || 'Update Number'} (increment for updates)</label>
        <input type="number" id="export-updatenum" class="input-field" value="${updateNumVal}" min="1" />
      </div>
    `,
    actions: [
      { id: 'cancel', label: t('common.cancel') || 'Cancel', class: 'btn-secondary' },
      { id: 'export', label: `${getIcon('download', 'w-4 h-4')} Export`, class: 'btn-primary' }
    ]
  });

  if (action !== 'export') return;

  preset.version = versionVal;
  preset.UpdateNumber = updateNumVal;

  import('../state/store.js').then(({ updatePreset }) => {
    updatePreset(idx, { version: versionVal, UpdateNumber: updateNumVal });
  });

  const json = JSON.stringify(preset, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `preset_${preset.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Preset exported', 'success');
}

async function importPresetFromFile(container) {
  try {
    const file = await pickJsonFile();
    const text = await file.text();
    const preset = JSON.parse(text);

    if (!preset.name || !Array.isArray(preset.assetPaths)) {
      showToast('Invalid preset file format', 'error');
      return;
    }

    importPreset(preset);
    renderPresets(container);
    showToast(`Imported preset: "${preset.name}" (${preset.assetPaths.length} assets)`, 'success');
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to import: ' + e.message, 'error');
    }
  }
}

async function showCommunityPresets(container) {
  const state = getState();
  const presets = state.presets || [];
  let availablePresets = [];

  // 1. Try Github Fetch first
  try {
    const gResp = await fetch(`https://api.github.com/repos/BetterDCS/Better-Sound.Maker-Community-Presets/contents/?t=${Date.now()}`);
    if (gResp.ok) {
      const ghFiles = await gResp.json();
      for (const meta of ghFiles) {
        if (meta.name.startsWith('preset_') && meta.download_url) {
          const txtResp = await fetch(`${meta.download_url}?t=${Date.now()}`);
          const text = await txtResp.text();
          try {
            const data = JSON.parse(text);
            if (data.name !== undefined && data.color !== undefined && data.version !== undefined && data.date !== undefined && Array.isArray(data.assetPaths)) {
              const localPreset = presets.find(p => p.name === data.name);
              const isImported = !!localPreset;
              let isUpdateAvailable = false;

              if (isImported) {
                const localUpdateNum = localPreset.UpdateNumber || 0;
                const remoteUpdateNum = data.UpdateNumber || 0;

                if (remoteUpdateNum > localUpdateNum) {
                  isUpdateAvailable = true;
                } else if (localPreset.version !== undefined && !data.UpdateNumber) {
                  // Fallback to basic semantic version check if no UpdateNumber is used
                  const localV = localPreset.version.split('.').map(Number);
                  const remoteV = (data.version || '0.0.0').split('.').map(Number);
                  for (let i = 0; i < Math.max(localV.length, remoteV.length); i++) {
                    const l = localV[i] || 0;
                    const r = remoteV[i] || 0;
                    if (r > l) { isUpdateAvailable = true; break; }
                    if (r < l) break;
                  }
                }
              }

              availablePresets.push({ file: meta.name, data, isImported, isUpdateAvailable });
            }
          } catch (e) { }
        }
      }
    }
  } catch (err) {
    console.warn('Web fetch presets failed, falling back to local:', err);
  }

  // 2. Fallback to Local Directory if no presets loaded yet AND we're in Electron
  if (availablePresets.length === 0 && window.electronAPI) {
    try {
      const appPath = await window.electronAPI.getAppPath();
      const presetsDir = appPath.endsWith('app.asar')
        ? appPath.replace('app.asar', 'app.asar.unpacked/public/presets')
        : appPath + '/public/presets';
      const files = await window.electronAPI.readDir(presetsDir);

      if (files && files.length) {
        for (const f of files) {
          if (f.startsWith('preset_')) {
            const text = await window.electronAPI.readTextFile(presetsDir + '/' + f);
            if (text) {
              try {
                const data = JSON.parse(text);
                if (data.name !== undefined && data.color !== undefined && data.version !== undefined && data.date !== undefined && Array.isArray(data.assetPaths)) {
                  // Only push if not already loaded by GitHub
                  if (!availablePresets.some(ap => ap.data.name === data.name)) {
                    const localPreset = presets.find(p => p.name === data.name);
                    const isImported = !!localPreset;
                    availablePresets.push({ file: f, data, isImported, isUpdateAvailable: false }); // Local doesn't have "updates" generally
                  }
                }
              } catch (e) { }
            }
          }
        }
      }
    } catch (e) {
      showToast('Failed to load community presets.', 'error');
      console.warn(e);
      return;
    }
  }

  if (availablePresets.length === 0) {
    const emptyAction = await showModal({
      title: t('presetsPage.communityModalTitle') || 'Community Presets',
      content: '<p>No community presets found.</p>',
      actions: [
        { id: 'refresh', label: getIcon('refresh-cw', 'w-4 h-4') + ' Refresh', class: 'btn-primary' },
        { id: 'close', label: t('common.close') || 'Close', class: 'btn-secondary' }
      ]
    });
    if (emptyAction === 'refresh') {
      showToast('Refreshing...', 'info');
      showCommunityPresets(container);
    }
    return;
  }

  const contentHtml = `
    <div style="max-height: 500px; overflow-y: auto; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); padding: 8px;">
      ${availablePresets.map(p => {
    const pColor = p.data.color || 'var(--accent-blue)';
    return `
        <div class="card hover-fx" style="padding: 0; margin: 0; display: flex; flex-direction: column; border: 1px solid var(--border); background: var(--bg-surface); border-radius: var(--radius-md); overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="height: 6px; width: 100%; background: ${pColor};"></div>
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <div style="color: ${pColor}; background: ${pColor}15; padding: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; flex-shrink: 0; border: 1px solid ${pColor}30;">
                ${getIcon('package', 'w-6 h-6')}
              </div>
              <div style="padding-top: 4px;">
                <div style="font-weight: 800; font-size: 17px; color: ${pColor}; margin-bottom: 4px; line-height: 1.2;">
                  ${p.data.name}
                </div>
                <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  ${getIcon('file-audio', 'w-3.5 h-3.5')} <span>${p.data.assetPaths.length} Sounds</span>
                </div>
                ${p.data.version ? `<div style="font-size: 11px; color: var(--text-muted); opacity: 0.7; margin-top: 4px; display: flex; align-items: center; gap: 4px;">${getIcon('tag', 'w-3 h-3')} v${p.data.version}</div>` : ''}
              </div>
            </div>
            
            <div style="margin-top: 8px;">
              ${p.isImported
        ? (p.isUpdateAvailable
          ? `<button class="btn btn-warning community-import-btn" style="width: 100%; border-radius: var(--radius-sm); height: 36px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; gap: 6px;" data-preset-name="${p.data.name.replace(/"/g, '&quot;')}">
                  ${getIcon('refresh-cw', 'w-4 h-4')} Update Available
                </button>`
          : `<div style="width: 100%; border: 1px solid var(--border); text-align: center; background: rgba(16, 185, 129, 0.1); color: var(--accent-green); padding: 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; gap: 6px;">
                  ${getIcon('check', 'w-4 h-4')} Imported
                </div>`
        )
        : `<button class="btn btn-primary community-import-btn" style="width: 100%; border-radius: var(--radius-sm); height: 36px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; gap: 6px; background: ${pColor}; border: none; color: #fff;" data-preset-name="${p.data.name.replace(/"/g, '&quot;')}">
                     ${getIcon('download-cloud', 'w-4 h-4')} Install Preset
                   </button>`
      }
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;

  const actionPromise = showModal({
    title: t('presetsPage.communityModalTitle') || 'Community Presets',
    content: contentHtml,
    actions: [
      { id: 'refresh', label: getIcon('refresh-cw', 'w-4 h-4') + ' Refresh', class: 'btn-secondary' },
      { id: 'close', label: t('common.close') || 'Close', class: 'btn-primary' }
    ]
  });

  // Attach import listeners
  document.querySelectorAll('.community-import-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const name = btnEl.dataset.presetName;
      const presetData = availablePresets.find(p => p.data.name === name)?.data;
      if (presetData) {
        // If updating an existing preset, we might want to override.
        // importPreset automatically pushes or overwrites depending on name
        const existingIdx = presets.findIndex(p => p.name === presetData.name);
        if (existingIdx >= 0) {
          presets[existingIdx] = presetData;
          getState().presets = presets;
          // Explicitly force save for manual replacement
          saveLibraryToStorage(getState().libraryData).catch(() => { });
        } else {
          importPreset(presetData);
        }

        btnEl.parentElement.innerHTML = `
          <div style="width: 100%; border: 1px solid var(--border); text-align: center; background: rgba(16, 185, 129, 0.1); color: var(--accent-green); padding: 8px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; gap: 6px;">
            ${getIcon('check', 'w-4 h-4')} Imported
          </div>
        `;
        renderPresets(container); // Re-render background page silently
        showToast(`Preset "${name}" imported / updated`, 'success');
      }
    });
  });

  const finalAction = await actionPromise;
  if (finalAction === 'refresh') {
    showToast('Refreshing network data...', 'info');
    showCommunityPresets(container);
  }
}
