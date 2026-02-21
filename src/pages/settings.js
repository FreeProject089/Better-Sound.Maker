import { getState, setGlobalSettings } from '../state/store.js';
import { t } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { showToast } from '../components/toast.js';

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
        <input type="text" id="settings-dcs-path" class="input-field" value="${settings.dcsPath || ''}" placeholder="C:\\Program Files\\Eagle Dynamics\\DCS World" style="flex: 1;" />
        
        ${window.electronAPI ? `
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
        ${getIcon('refresh-cw', 'w-4 h-4 mr-2')}
        ${t('settingsPage.autoScan')}
      </h2>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
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

    <div class="flex-gap">
      <button class="btn btn-primary" id="save-settings-btn">
        ${getIcon('save', 'w-4 h-4')} ${t('common.save')}
      </button>
    </div>
  `;

  // Native File Picker (Electron only)
  document.getElementById('settings-browse-btn')?.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      const paths = await window.electronAPI.selectDirectory();
      if (paths && paths.length > 0) {
        const input = document.getElementById('settings-dcs-path');
        if (input) {
          input.value = paths[0];
          // Trigger input event to ensure any listeners are notified
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  });

  document.getElementById('settings-open-btn')?.addEventListener('click', () => {
    const p = document.getElementById('settings-dcs-path')?.value.trim();
    if (p && window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(p);
    }
  });

  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const dcsPath = document.getElementById('settings-dcs-path').value.trim();
    const autoScan = document.getElementById('settings-auto-scan').checked;
    const autoScanKeepMods = document.getElementById('settings-auto-scan-keep-mods').checked;

    setGlobalSettings({ dcsPath, autoScan, autoScanKeepMods });
    showToast('Settings saved successfully', 'success');
  });

  renderIcons(container);
}
