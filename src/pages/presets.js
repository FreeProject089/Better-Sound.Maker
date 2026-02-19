/**
 * presets.js — Presets / Templates system
 * Save, load, share, and apply asset selection presets
 */

import { getState, savePreset, deletePreset, importPreset, selectAsset, isAssetSelected, subscribe, setLibraryData } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { pickJsonFile } from '../utils/file-picker.js';

export function renderPresets(container) {
  const state = getState();
  const presets = state.presets || [];
  const selectedCount = Object.keys(state.selectedAssets).length;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Presets & Templates</h1>
      <p class="page-description">Save your asset selections as presets. Share them or quickly switch between configurations.</p>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="card-header">
        <div class="card-title">Create New Preset</div>
      </div>
      <div style="display: flex; gap: 12px; align-items: end;">
        <div class="input-group" style="flex: 1;">
          <label class="input-label">Preset Name</label>
          <input type="text" class="input-field" id="preset-name" placeholder="e.g., F/A-18C Complete, Weapons Only..." />
        </div>
        <button class="btn btn-primary" id="save-preset-btn">
          💾 Save Current Selection (${selectedCount} assets)
        </button>
      </div>
      ${selectedCount === 0 ? '<div style="font-size: 12px; color: var(--accent-amber); margin-top: 8px;">⚠ No assets selected — select some in the Library first</div>' : ''}
    </div>

    <div class="flex-between" style="margin-bottom: 16px;">
      <h2 style="font-size: 18px; font-weight: 600;">Saved Presets (${presets.length})</h2>
      <div class="flex-gap">
        <button class="btn btn-secondary btn-sm" id="import-preset-btn">📥 Import Preset</button>
      </div>
    </div>

    ${presets.length === 0 ? `
      <div class="empty-state" style="padding: 40px;">
        <div class="empty-state-icon">💾</div>
        <div class="empty-state-title">No Presets Saved</div>
        <div class="empty-state-text">Create your first preset by selecting assets in the Library, then saving them here.</div>
      </div>
    ` : `
      <div class="grid-2">
        ${presets.map((preset, idx) => `
          <div class="card">
            <div class="flex-between" style="margin-bottom: 12px;">
              <div>
                <div class="card-title">${preset.name}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                  ${new Date(preset.date).toLocaleDateString()} — ${preset.assetPaths.length} assets
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
              <button class="btn btn-primary btn-sm" data-apply-preset="${idx}">Apply</button>
              <button class="btn btn-secondary btn-sm" data-export-preset="${idx}">📤 Export</button>
              <button class="btn btn-danger btn-sm" data-delete-preset="${idx}">🗑️</button>
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
      showToast('No assets selected', 'warning');
      return;
    }
    savePreset(name);
    showToast(`Preset "${name}" saved with ${selectedCount} assets`, 'success');
    renderPresets(container);
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
        title: 'Delete Preset',
        content: `<p>Are you sure you want to delete this preset?</p>`,
        actions: [
          { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
          { id: 'delete', label: 'Delete', class: 'btn-danger' }
        ]
      });
      if (result === 'delete') {
        deletePreset(idx);
        renderPresets(container);
        showToast('Preset deleted', 'info');
      }
    });
  });
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
      title: '⚠ Apply Preset?',
      content: `
        <p>You currently have <strong>${currentCount} assets</strong> selected.</p>
        <p>Applying this preset will <strong>add ${preset.assetPaths.length} assets</strong> to your selection.</p>
        <p style="margin-top: 12px; color: var(--text-muted); font-size: 13px;">
          💡 You can save your current selection as a preset first to avoid losing it.
        </p>
      `,
      actions: [
        { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
        { id: 'save-first', label: '💾 Save Current & Apply', class: 'btn-primary' },
        { id: 'apply', label: 'Apply Without Saving', class: 'btn-warning' }
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
