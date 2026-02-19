/**
 * presets.js — Presets / Templates system
 * Save, load, share, and apply asset selection presets
 */

import { getState, savePreset, deletePreset, importPreset, selectAsset, isAssetSelected, subscribe, setLibraryData, loadLibraryFromStorage, saveLibraryToStorage } from '../state/store.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t } from '../utils/i18n.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { pickJsonFile } from '../utils/file-picker.js';
import { parseSdefList } from '../data/sdef-parser.js';

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
          <input type="text" class="input-field" id="preset-name" placeholder="${t('presetsPage.namePlaceholder')}" />
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
                <div style="font-size: 20px; color: var(--accent-blue); padding-top: 2px;">
                  ${getIcon('layers', 'w-5 h-5')}
                </div>
                <div>
                  <div class="card-title">${preset.name}</div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    ${new Date(preset.date).toLocaleDateString()} — ${t('presetsPage.assetsLabel', { count: preset.assetPaths.length })}
                  </div>
                </div>
              </div>
              <span class="tag tag-blue">${preset.assetPaths.length}</span>
            </div>
            <div style="max-height: 120px; overflow-y: auto; margin-bottom: 12px;">
              ${preset.assetPaths.slice(0, 8).map(p =>
    `<div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); padding: 1px 0;">${p}</div>`
  ).join('')}
              ${preset.assetPaths.length > 8 ? `<div style="font-size: 11px; color: var(--text-muted);">... and ${preset.assetPaths.length - 8} more</div>` : ''}
            </div>
            <div class="flex-gap">
              <button class="btn btn-primary btn-sm" data-apply-preset="${idx}">${t('presetsPage.applyBtn')}</button>
              <button class="btn btn-secondary btn-sm" data-export-preset="${idx}">${getIcon('upload', 'w-4 h-4')} ${t('presetsPage.exportBtn')}</button>
              <button class="btn btn-danger btn-sm" data-delete-preset="${idx}">${getIcon('trash-2', 'w-4 h-4')}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  // Event handlers
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
    savePreset(name);
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
      const result = await showModal({
        title: t('presetsPage.deleteConfirm.title'),
        content: `<p>${t('presetsPage.deleteConfirm.content')}</p>`,
        actions: [
          { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
          { id: 'delete', label: t('common.delete'), class: 'btn-danger' }
        ]
      });
      if (result === 'delete') {
        deletePreset(idx);
        renderPresets(container);
        showToast('Preset deleted', 'info');
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

function exportPreset(idx) {
  const state = getState();
  const preset = state.presets[idx];
  if (!preset) return;

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
