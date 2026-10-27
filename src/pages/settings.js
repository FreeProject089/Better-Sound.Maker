import { getState, setGlobalSettings } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/html.js';
import { DEFAULT_CATALOG_URL, loadCommunityCatalog } from '../catalog/catalog.js';

export function renderSettings(container) {
  const state = getState();
  const settings = state.globalSettings || { dcsPath: '', autoScan: false, autoScanKeepMods: false };

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('settingsPage.title')}</h1>
      <p class="page-description">${t('settingsPage.desc')}</p>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 8px;">
        ${getIcon('folder', 'w-4 h-4 mr-2')}
        ${t('settingsPage.dcsPath')}
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">${t('settingsPage.dcsPathDesc')}</p>
      
      <div style="display: flex; gap: 8px; width: 100%;">
        <input type="text" id="settings-dcs-path" class="input-field" value="${escapeHtml(settings.dcsPath)}" placeholder="C:\\Program Files\\Eagle Dynamics\\DCS World" style="flex: 1;" />
        
        ${window.nativeAPI ? `
          <button class="btn btn-secondary" id="settings-open-btn" style="flex-shrink: 0;" title="Open in Explorer">
            ${getIcon('external-link', 'w-4 h-4')}
          </button>
          <button class="btn btn-secondary" id="settings-browse-btn" style="flex-shrink: 0;">
            ${getIcon('folder', 'w-4 h-4')} ${t('settingsPage.selectPath')}
          </button>
        ` : ''}
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 8px;">
        ${getIcon('globe', 'w-4 h-4 mr-2')}
        ${t('settingsPage.catalogUrl') || 'Community catalog'}
      </h2>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">${t('settingsPage.catalogUrlDesc') || 'URL of the catalog.json listing community presets and sound-type packs. Leave empty to use the official catalog.'}</p>
      <div style="display: flex; gap: 8px; width: 100%;">
        <input type="url" id="settings-catalog-url" class="input-field" value="${escapeHtml(settings.catalogUrl)}" placeholder="${escapeHtml(DEFAULT_CATALOG_URL)}" style="flex: 1;" />
        <button class="btn btn-secondary" id="settings-catalog-test" style="flex-shrink: 0;">
          ${getIcon('refresh-cw', 'w-4 h-4')} ${t('settingsPage.catalogTest') || 'Test'}
        </button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 8px;">
        ${getIcon('cog', 'w-4 h-4 mr-2')}
        ${t('settingsPage.behavior') || 'Behavior & Scanning'}
      </h2>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
        
        <div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${t('settingsPage.playWithSdefConfigDesc')}</p>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="settings-play-sdef" ${settings.playWithSdefConfig ? 'checked' : ''} />
            <span style="font-size: 14px; color: var(--text-primary);">${t('settingsPage.playWithSdefConfig')}</span>
          </label>
        </div>
        <div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${t('settingsPage.autoScanDesc')}</p>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="settings-auto-scan" ${settings.autoScan ? 'checked' : ''} />
            <span style="font-size: 14px; color: var(--text-primary);">${t('settingsPage.autoScan')}</span>
          </label>
        </div>

        <div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${t('settingsPage.autoScanKeepModsDesc')}</p>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
            <input type="checkbox" id="settings-auto-scan-keep-mods" ${settings.autoScanKeepMods ? 'checked' : ''} />
            <span style="font-size: 14px; color: var(--text-primary);">${t('settingsPage.autoScanKeepMods')}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="flex-gap" style="margin-top: 20px;">
      <button class="btn btn-primary" id="save-settings-btn" style="display: flex; align-items: center; gap: 8px;">
        ${getIcon('save', 'w-4 h-4')} <span>${t('common.save') || 'Save'}</span>
      </button>
    </div>
  `;

  // Native File Picker (desktop only)
  document.getElementById('settings-browse-btn')?.addEventListener('click', async () => {
    if (window.nativeAPI && window.nativeAPI.selectDirectory) {
      const picked = await window.nativeAPI.selectDirectory();
      if (picked) {
        const input = document.getElementById('settings-dcs-path');
        if (input) {
          input.value = picked;
          // Trigger input event to ensure any listeners are notified
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  });

  document.getElementById('settings-open-btn')?.addEventListener('click', () => {
    const p = document.getElementById('settings-dcs-path')?.value.trim();
    if (p && window.nativeAPI && window.nativeAPI.openExternal) {
      window.nativeAPI.openExternal(p);
    }
  });

  document.getElementById('settings-catalog-test').addEventListener('click', async () => {
    const catalogUrl = readCatalogUrl();
    if (catalogUrl === null) return;
    setGlobalSettings({ catalogUrl });
    const res = await loadCommunityCatalog({ force: true });
    if (res.source === 'remote') {
      showToast(`Catalog OK: ${res.presets.length} presets, ${res.soundTypes.length} sound-type packs`, 'success');
    } else {
      showToast(`Catalog unreachable (using ${res.source} copy): ${res.errors[0] || ''}`, 'error');
    }
  });

  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const catalogUrl = readCatalogUrl();
    if (catalogUrl === null) return;
    const dcsPath = document.getElementById('settings-dcs-path').value.trim();
    const autoScan = document.getElementById('settings-auto-scan').checked;
    const autoScanKeepMods = document.getElementById('settings-auto-scan-keep-mods').checked;
    const playWithSdefConfig = document.getElementById('settings-play-sdef').checked;

    setGlobalSettings({ dcsPath, autoScan, autoScanKeepMods, playWithSdefConfig, catalogUrl });
    showToast('Settings saved successfully', 'success');
  });

  renderIcons(container);
}

/** Returns the trimmed catalog URL ('' = default), or null after warning when invalid. */
function readCatalogUrl() {
  const value = document.getElementById('settings-catalog-url').value.trim();
  if (value && !/^https?:\/\/\S+$/i.test(value)) {
    showToast('Catalog URL must start with http:// or https://', 'error');
    return null;
  }
  return value;
}
