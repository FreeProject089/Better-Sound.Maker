/**
 * build.js — Build / Export page
 * Configure entry.lua and export complete mod folder
 */

import { getState, updateProjectConfig, subscribe } from '../state/store.js';
import { generateEntryLua } from '../utils/entry-generator.js';
import { buildMod } from '../utils/mod-builder.js';
import { showToast } from '../components/toast.js';

export function renderBuild(container) {
  const state = getState();
  const config = state.projectConfig;
  const selected = state.selectedAssets;
  const selectedCount = Object.keys(selected).length;
  const audioCount = Object.values(selected).filter(d => d.audioFileName).length;
  const sdefCount = Object.values(selected).filter(d => d.sdefContent).length;

  const entryPreview = generateEntryLua(config);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Build Mod</h1>
      <p class="page-description">Configure your mod details and export a complete DCS-ready mod folder.</p>
    </div>

    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-value">${selectedCount}</div>
        <div class="stat-label">Assets</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-green);">${audioCount}</div>
        <div class="stat-label">Audio Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-cyan);">${sdefCount}</div>
        <div class="stat-label">SDEF Edited</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: ${config.themeEnabled ? 'var(--accent-green)' : 'var(--text-muted)'};">
          ${config.themeEnabled ? 'ON' : 'OFF'}
        </div>
        <div class="stat-label">Theme</div>
      </div>
    </div>

    <div class="build-form">
      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title" style="margin-bottom: 16px;">📋 Mod Configuration</div>
          <div class="flex-col" style="gap: 14px;">
            <div class="input-group">
              <label class="input-label">Mod Name *</label>
              <input type="text" class="input-field" id="cfg-modName" value="${config.modName}" placeholder="e.g., BetterHornet" />
            </div>
            <div class="input-group">
              <label class="input-label">Display Name</label>
              <input type="text" class="input-field" id="cfg-displayName" value="${config.displayName}" placeholder="e.g., Better Hornet Sound" />
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label class="input-label">Author / Team *</label>
                <input type="text" class="input-field" id="cfg-author" value="${config.author}" placeholder="Your name" />
              </div>
              <div class="input-group">
                <label class="input-label">Short Name</label>
                <input type="text" class="input-field" id="cfg-shortName" value="${config.shortName}" placeholder="BH" maxlength="6" />
              </div>
            </div>
            <div class="input-group">
              <label class="input-label">Version</label>
              <input type="text" class="input-field" id="cfg-version" value="${config.version}" placeholder="1.0.0" />
            </div>
            <div class="input-group">
              <label class="input-label">Description</label>
              <textarea class="input-field" id="cfg-description" rows="3" placeholder="Description of your sound mod...">${config.description}</textarea>
            </div>
            <div class="input-group">
              <label class="input-label">URL (optional)</label>
              <input type="text" class="input-field" id="cfg-url" value="${config.url}" placeholder="https://..." />
            </div>
            <div class="input-group">
              <label class="input-label">Credits</label>
              <input type="text" class="input-field" id="cfg-credits" value="${config.credits}" placeholder="Acknowledgments..." />
            </div>
            <div class="flex-between" style="padding: 10px 0;">
              <div>
                <div style="font-weight: 600; font-size: 13px;">Enable Theme</div>
                <div style="font-size: 12px; color: var(--text-muted);">Include Theme/ folder in the mod</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="cfg-themeEnabled" ${config.themeEnabled ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <button class="btn btn-secondary" id="save-config-btn" style="margin-top: 16px; width: 100%;">💾 Save Configuration</button>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title" style="margin-bottom: 16px;">🎵 Audio Format</div>
          <div class="input-group">
            <label class="input-label">Output Format</label>
            <select class="input-field" id="cfg-audioFormat">
              <option value="original" selected>Original (keep as-is)</option>
              <option value="wav">Convert all to WAV (PCM 16-bit)</option>
              <option value="ogg">Convert all to OGG (smaller files)</option>
            </select>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
              💡 DCS supports both .wav and .ogg formats. WAV is higher quality, OGG is smaller.
              <br>⚠ Browser OGG encoding is limited — WAV conversion is recommended.
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title" style="margin-bottom: 12px;">📄 entry.lua Preview</div>
          <div class="build-preview" id="entry-preview">${escapeHtml(entryPreview)}</div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <div class="card-title" style="margin-bottom: 12px;">📂 Output Structure Preview</div>
          <div class="build-preview" style="color: var(--text-secondary); font-size: 12px;">
SoundMod${config.modName || '{Name}'}/
├── entry.lua
${config.themeEnabled ? `├── Theme/
│   ├── icon.png
│   └── ME/
│       ├── MainMenulogo.png
│       ├── loading-window.png
│       ├── briefing-map-default.png
│       └── base-menu-window.png
` : ''}└── Sounds/
    ├── Effects/
    │   └── (${audioCount} audio files)
    └── sdef/
        └── (${selectedCount} sdef files)
          </div>
        </div>

        <button class="btn btn-success btn-lg" id="build-mod-btn" style="width: 100%; font-size: 16px; padding: 16px;">
          🚀 Build & Export Mod
        </button>

        <div id="build-progress" class="hidden" style="margin-top: 16px;">
          <div class="progress-bar" style="margin-bottom: 8px;">
            <div class="progress-fill" id="build-progress-fill" style="width: 0%;"></div>
          </div>
          <div id="build-progress-text" style="font-size: 12px; color: var(--text-muted);"></div>
        </div>

        ${selectedCount === 0 ? `
          <div style="margin-top: 12px; text-align: center;">
            <div class="tag tag-amber">⚠ No assets selected — go to the Library to select sounds</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Save config on input change
  const saveConfig = () => {
    const updates = {
      modName: document.getElementById('cfg-modName')?.value || '',
      displayName: document.getElementById('cfg-displayName')?.value || '',
      author: document.getElementById('cfg-author')?.value || '',
      shortName: document.getElementById('cfg-shortName')?.value || '',
      version: document.getElementById('cfg-version')?.value || '1.0.0',
      description: document.getElementById('cfg-description')?.value || '',
      url: document.getElementById('cfg-url')?.value || '',
      credits: document.getElementById('cfg-credits')?.value || '',
      themeEnabled: document.getElementById('cfg-themeEnabled')?.checked || false
    };
    updateProjectConfig(updates);

    // Update preview
    const preview = document.getElementById('entry-preview');
    if (preview) preview.textContent = generateEntryLua(updates);
  };

  document.getElementById('save-config-btn')?.addEventListener('click', () => {
    saveConfig();
    showToast('Configuration saved', 'success');
  });

  // Live preview updates
  container.querySelectorAll('.input-field, .toggle input').forEach(el => {
    el.addEventListener('input', saveConfig);
    el.addEventListener('change', saveConfig);
  });

  // Build button
  document.getElementById('build-mod-btn')?.addEventListener('click', async () => {
    saveConfig();
    const config = getState().projectConfig;

    if (!config.modName) {
      showToast('Please enter a mod name', 'warning');
      return;
    }
    if (!config.author) {
      showToast('Please enter an author name', 'warning');
      return;
    }

    const progressEl = document.getElementById('build-progress');
    const fillEl = document.getElementById('build-progress-fill');
    const textEl = document.getElementById('build-progress-text');

    progressEl?.classList.remove('hidden');

    const audioFormat = document.getElementById('cfg-audioFormat')?.value || 'original';

    const result = await buildMod((progress, message) => {
      if (fillEl) fillEl.style.width = `${Math.round(progress * 100)}%`;
      if (textEl) textEl.textContent = message;
    }, { audioFormat });

    if (result.success) {
      showToast(`Mod exported successfully: ${result.folderName}`, 'success', 5000);
      if (textEl) textEl.textContent = `✅ Export complete: ${result.folderName}`;
    } else {
      showToast(`Build failed: ${result.error}`, 'error', 5000);
      if (textEl) textEl.textContent = `❌ ${result.error}`;
    }
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
