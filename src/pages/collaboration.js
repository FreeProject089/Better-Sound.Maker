/**
 * collaboration.js — GitHub-backed collaboration page
 * Better Sound.Maker
 *
 * Features:
 *  - GitHub PAT + repo settings
 *  - Push / Pull project state
 *  - Commit history log with snapshot restore
 *  - Team notes system
 */

import {
  testConnection, pushProjectState, pullProjectState,
  pushNote, listNotes, getCommitLog, getStateAtCommit,
  putBinaryFile, getFile
} from '../utils/github-api.js';
import { getState, setState, updateProjectConfig, setAudioFile, getAudioFile } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { generateEntryLua } from '../utils/entry-generator.js';
import { generateSdef } from '../utils/sdef-generator.js';
import { detectSoundType, getTypeDefaults } from '../utils/audio-analyzer.js';
import { t, updateTranslations } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';

const COLLAB_KEY = 'bsm-collab';

function loadCollabConfig() {
  try {
    return JSON.parse(localStorage.getItem(COLLAB_KEY) || '{}');
  } catch { return {}; }
}

function saveCollabConfig(cfg) {
  localStorage.setItem(COLLAB_KEY, JSON.stringify(cfg));
}

export function renderCollaboration(container) {
  const cfg = loadCollabConfig();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title" data-i18n="collabPage.title">Collaboration</h1>
      <p class="page-description" data-i18n="collabPage.description">
        ${t('collabPage.description')}
      </p>
    </div>

    <div class="collab-grid">
      <div class="collab-left">

        <!-- GitHub Settings -->
        <div class="card collab-card" style="margin-bottom:20px;">
          <div class="collab-card-header">
            <div class="collab-card-icon" style="background:rgba(255,255,255,0.08);">
              ${getIcon('github')}
            </div>
            <div>
              <div class="collab-card-title">${t('collabPage.settings.title')}</div>
              <div class="collab-card-sub">${t('collabPage.settings.sub')}</div>
            </div>
          </div>
          <div class="flex-col" style="gap:14px;">
            <div class="input-group">
              <label class="input-label">${t('collabPage.settings.pat')}
                <span style="font-size:10px;color:var(--text-muted);margin-left:6px;">${t('collabPage.settings.patNote')}</span>
              </label>
              <input type="password" class="input-field" id="collab-pat"
                     placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                     value="${escHtml(cfg.pat || '')}" />
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                ${t('collabPage.settings.repoScope')}
                <a href="https://github.com/settings/tokens/new" target="_blank"
                   style="color:var(--accent-blue);">${t('collabPage.settings.createToken')} ↗</a>
              </div>
            </div>
            <div class="input-group">
              <label class="input-label">${t('collabPage.settings.repo')}</label>
              <input type="text" class="input-field" id="collab-repo"
                     placeholder="owner/my-sound-mod"
                     value="${escHtml(cfg.repo || '')}" />
            </div>
            <div class="input-group">
              <label class="input-label">${t('collabPage.settings.username')}</label>
              <input type="text" class="input-field" id="collab-username"
                     placeholder="YourName"
                     value="${escHtml(cfg.username || '')}" />
            </div>
            <div class="flex-gap" style="gap:10px;margin-top:4px;">
              <button class="btn btn-secondary" id="collab-save-btn" style="flex:1;">
                ${getIcon('save', 'w-3 h-3')}
                ${t('collabPage.buttons.save')}
              </button>
              <button class="btn btn-secondary" id="collab-test-btn" style="flex:1;">
                ${getIcon('zap', 'w-3 h-3')}
                ${t('collabPage.buttons.test')}
              </button>
            </div>
            <div id="collab-status" class="collab-status-bar" style="display:none;"></div>
          </div>
        </div>

        <!-- Sync -->
        <div class="card collab-card" style="margin-bottom:20px;">
          <div class="collab-card-header">
            <div class="collab-card-icon" style="background:rgba(16,185,129,0.12);color:var(--accent-green);">
              ${getIcon('refresh-cw')}
            </div>
            <div>
              <div class="collab-card-title">${t('collabPage.sync.title')}</div>
              <div class="collab-card-sub">${t('collabPage.sync.sub')}</div>
            </div>
          </div>
          <div class="collab-sync-btns">
            <button class="btn btn-success collab-sync-btn" id="collab-push-btn">
              ${getIcon('upload', 'w-4 h-4')}
              ${t('collabPage.buttons.push')}
            </button>
            <button class="btn btn-secondary collab-sync-btn" id="collab-pull-btn">
              ${getIcon('download', 'w-4 h-4')}
              ${t('collabPage.buttons.pull')}
            </button>
          </div>
          <div id="collab-sync-status" class="collab-status-bar" style="display:none;margin-top:10px;"></div>
        </div>

        <!-- Notes -->
        <div class="card collab-card">
          <div class="collab-card-header">
            <div class="collab-card-icon" style="background:rgba(139,92,246,0.12);color:var(--accent-purple);">
              ${getIcon('message-square')}
            </div>
            <div>
              <div class="collab-card-title">${t('collabPage.notes.title')}</div>
              <div class="collab-card-sub">${t('collabPage.notes.sub')}</div>
            </div>
          </div>
          <textarea class="input-field" id="collab-note-text" rows="3" placeholder="${t('collabPage.notes.placeholder')}"></textarea>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-primary" id="collab-note-send" style="flex:1;">
              ${getIcon('send', 'w-3 h-3')}
              ${t('collabPage.buttons.post')}
            </button>
            <button class="btn btn-secondary" id="collab-notes-load">
              ${getIcon('refresh-cw', 'w-3 h-3')}
              ${t('collabPage.buttons.refresh')}
            </button>
          </div>
          <div id="collab-notes-list" style="margin-top:16px;"></div>
        </div>

      </div>

      <!-- History -->
      <div class="collab-right">
        <div class="card collab-card" style="height:100%;">
          <div class="collab-card-header" style="margin-bottom:16px;">
            <div class="collab-card-icon" style="background:rgba(59,130,246,0.12);color:var(--accent-blue);">
              ${getIcon('git-commit')}
            </div>
            <div style="flex:1;">
              <div class="collab-card-title">${t('collabPage.history.title')}</div>
              <div class="collab-card-sub">${t('collabPage.history.sub')}</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="collab-history-load">
              ${getIcon('refresh-cw', 'w-3 h-3')}
              ${t('collabPage.buttons.refresh')}
            </button>
          </div>
          <div id="collab-history-list">
            <div class="collab-history-empty">
              <div style="color:var(--text-muted);margin-bottom:10px;">${getIcon('git-commit', 'w-8 h-8')}</div>
              <div>${t('collabPage.history.empty')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  addCollabStyles();
  bindCollabEvents();
  updateTranslations();
  renderIcons(container);
}

/* ── Event binding ────────────────────────────────────────────────── */

function bindCollabEvents() {
  // Save settings
  document.getElementById('collab-save-btn')?.addEventListener('click', () => {
    const cfg = {
      pat: document.getElementById('collab-pat')?.value.trim() || '',
      repo: document.getElementById('collab-repo')?.value.trim() || '',
      username: document.getElementById('collab-username')?.value.trim() || '',
    };
    saveCollabConfig(cfg);
    showToast(t('collabPage.toast.settingsSaved'), 'success');
  });

  // Test connection
  document.getElementById('collab-test-btn')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.enterPat'), 'warning'); return; }

    const statusEl = document.getElementById('collab-status');
    statusEl.style.display = 'block';
    statusEl.textContent = t('collabPage.status.testing');

    const result = await testConnection(pat, repo);
    if (result.ok) {
      statusEl.innerHTML = `${t('collabPage.status.connected')} <strong>${result.user}</strong> → <strong>${result.repoName}</strong>`;
      statusEl.style.color = 'var(--accent-green)';
    } else {
      statusEl.textContent = `❌ ${result.error}`;
      statusEl.style.color = 'var(--accent-red, #f85149)';
    }
  });

  // Push (Re-implemented as "Push Build")
  document.getElementById('collab-push-btn')?.addEventListener('click', async () => {
    const { pat, repo, username } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.configureFirst'), 'warning'); return; }

    const syncEl = document.getElementById('collab-sync-status');
    syncEl.style.display = 'block';
    syncEl.textContent = t('collabPage.status.pushing');

    const state = getState();
    const config = state.projectConfig;
    const selected = state.selectedAssets;

    // 1. Upload project.json (meta-data & notes)
    const toSync = {
      projectConfig: state.projectConfig,
      selectedAssets: state.selectedAssets,
      presets: state.presets,
      themeImages: state.themeImages,
    };

    try {
      // Helper to upload file efficiently
      const upload = async (path, content, isBinary = false) => {
        // Check existence to get sha for update, or null for create
        // We catch 404s in getFile so returning null is fine
        const existing = await getFile(pat, repo, path).catch(() => null);
        if (isBinary) {
          await putBinaryFile(pat, repo, path, content, `sync: ${path} (bin)`, existing?.sha);
        } else {
          // Serialize for text
          const b64 = btoa(unescape(encodeURIComponent(content)));
          // We use putFile logic but inline here or use putBinaryFile with string conversion?
          // putBinaryFile expects ArrayBuffer usually, let's use a small helper or just use putBinaryContent equivalent
          // Actually, our putBinaryFile handles ArrayBuffer. Text -> ArrayBuffer:
          const enc = new TextEncoder();
          await putBinaryFile(pat, repo, path, enc.encode(content), `sync: ${path}`, existing?.sha);
        }
      };

      // A. Push project.json
      syncEl.innerHTML = '⬆️ pushing project.json...';
      const projectJsonStr = JSON.stringify(toSync, null, 2);
      await upload('project.json', projectJsonStr);

      // B. Push entry.lua
      syncEl.innerHTML = '⬆️ pushing entry.lua...';
      const entryLua = generateEntryLua(config);
      await upload('entry.lua', entryLua);

      // C. Push Assets (SDEF + Waves)
      const assetKeys = Object.keys(selected);
      let count = 0;
      const total = assetKeys.length;

      for (const key of assetKeys) {
        // Asset Key is like "Aircrafts/FA-18/..."
        const assetData = selected[key];
        count++;
        syncEl.innerHTML = `⬆️ Processing asset ${count}/${total}: ${key}`;

        // 1. Generate & Upload SDEF
        let sdefContent = assetData.sdefContent;
        if (!sdefContent && assetData.customWaves?.length) {
          const soundType = detectSoundType(key);
          const typeDefaults = getTypeDefaults(soundType);
          sdefContent = generateSdef({
            wave: assetData.customWaves,
            ...typeDefaults,
          });
        }

        if (sdefContent) {
          // Standard mod structure: Sounds/sdef/<path>
          await upload(`Sounds/sdef/${key}`, sdefContent);
        }

        // 2. Upload Waves (Sounds/Effects/...)
        const waves = assetData.customWaves || assetData.originalAsset?.waves || [];
        // We only upload if we have a Custom Audio File in memory (for new/replaced sounds)
        // OR if the user expects us to upload original sounds (unlikely for "originalAsset" unless we extracted them).
        // BUT `getAudioFile` only returns what the user *added* or *replaced*.
        const audioFile = getAudioFile(key);

        if (audioFile && waves.length > 0) {
          let buffer = null;

          // Try reading from disk first (Electron)
          if (assetData.audioPath && window.electronAPI) {
            try {
              buffer = await window.electronAPI.readFile(assetData.audioPath);
            } catch (e) { console.warn('Electron read failed, falling back to memory', e); }
          }

          // If not read from disk (or failed), try converting the in-memory File/Blob to buffer
          if (!buffer && audioFile.arrayBuffer) {
            buffer = await audioFile.arrayBuffer();
          }

          if (buffer) {
            // Determine extension
            const ext = audioFile.name.split('.').pop() || 'wav';

            // Upload for EACH wave path defined in the SDEF
            // (Mirroring mod-builder logic)
            for (const wavePath of waves) {
              // wavePath: "Effects/Aircrafts/..."
              const parts = wavePath.split('/');
              if (parts[0] === 'Effects') parts.shift();
              const relPath = parts.join('/'); // "Aircrafts/FA-18/Engine.wav" (maybe)
              // Strip ext from path provided in SDEF, append real ext
              const finalPathTarget = relPath.replace(/\.[^.]+$/, '') + '.' + ext;

              await upload(`Sounds/Effects/${finalPathTarget}`, buffer, true);
            }
          }
        }
      }

      syncEl.innerHTML = `${t('collabPage.status.pushSuccess')} ${count} assets synced.`;
      syncEl.style.color = 'var(--accent-green)';
      showToast(t('collabPage.status.pushSuccess'), 'success');

    } catch (err) {
      console.error(err);
      syncEl.textContent = `${t('collabPage.status.failed')}: ${err.message}`;
      syncEl.style.color = 'var(--accent-red, #f85149)';
    }
  });

  // Pull
  document.getElementById('collab-pull-btn')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.configureFirst'), 'warning'); return; }

    const syncEl = document.getElementById('collab-sync-status');
    syncEl.style.display = 'block';
    syncEl.textContent = t('collabPage.status.pulling');

    const result = await pullProjectState(pat, repo);
    if (result.ok) {
      applyPulledState(result.state);

      // --- AUDIO PULL START ---
      syncEl.innerHTML += '<br>🎵 Downloading audio files...';
      try {
        let downloaded = 0;
        const assets = result.state.selectedAssets || {};
        for (const key of Object.keys(assets)) {
          const asset = assets[key];
          if (asset.audioFileName) {
            const safeName = asset.audioFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const repoPath = `sounds/${safeName}`;

            // Try to download from repo
            try {
              const fileData = await getFile(pat, repo, repoPath);
              if (fileData && fileData.contentBase64) {
                // Convert base64 to Blob
                const byteCharacters = atob(fileData.contentBase64.replace(/\n/g, ''));
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: asset.audioFileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/wav' });

                // Re-attach to store (in-memory)
                // We cannot write to disk easily in the exact same path as the original user,
                // so we keep it in memory (Blob). 
                // The user will need to re-save/export to write it to their disk eventually.
                setAudioFile(key, new File([blob], asset.audioFileName), { name: asset.audioFileName, size: blob.size });
                downloaded++;
              }
            } catch (e) {
              console.warn(`Could not download audio ${safeName}`, e);
            }
          }
        }
        syncEl.innerHTML = `${t('collabPage.status.pullSuccess')} + ${downloaded} audio files loaded!`;
      } catch (err) {
        console.error('Audio pull error', err);
        syncEl.innerHTML += `<br>⚠ Audio dl warning: ${err.message}`;
      }
      // --- AUDIO PULL END ---

      syncEl.style.color = 'var(--accent-green)';
      showToast(t('collabPage.status.pullSuccess'), 'success');
    } else {
      syncEl.textContent = `${t('collabPage.status.failed')}: ${result.error}`;
      syncEl.style.color = 'var(--accent-red, #f85149)';
      showToast(t('collabPage.status.failed') + ': ' + result.error, 'error');
    }
  });

  // Post note
  document.getElementById('collab-note-send')?.addEventListener('click', async () => {
    const { pat, repo, username } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.configureFirst'), 'warning'); return; }
    const text = document.getElementById('collab-note-text')?.value.trim();
    if (!text) { showToast(t('collabPage.toast.noteEmpty'), 'warning'); return; }

    const result = await pushNote(pat, repo, username || 'user', text);
    if (result.ok) {
      showToast(t('collabPage.toast.notePosted'), 'success');
      if (document.getElementById('collab-note-text')) {
        document.getElementById('collab-note-text').value = '';
      }
    } else {
      showToast('Failed to post note: ' + result.error, 'error');
    }
  });

  // Load notes
  document.getElementById('collab-notes-load')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.configureFirst'), 'warning'); return; }

    const listEl = document.getElementById('collab-notes-list');
    listEl.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">${t('collabPage.notes.loading')}</div>`;

    const notes = await listNotes(pat, repo);
    if (notes.length === 0) {
      listEl.innerHTML = `<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0;">${t('collabPage.notes.empty')}</div>`;
      return;
    }

    listEl.innerHTML = notes.map(n => `
          <div class="collab-note-card">
            <div class="collab-note-header">
              <strong>${escHtml(n.author)}</strong>
              <span style="color:var(--text-muted);font-size:10px;">${new Date(n.date).toLocaleString()}</span>
            </div>
            <div class="collab-note-body">${escHtml(n.text)}</div>
          </div>
        `).join('');
  });

  // Load history
  document.getElementById('collab-history-load')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast(t('collabPage.toast.configureFirst'), 'warning'); return; }
    await loadHistory(pat, repo);
  });
}


async function loadHistory(pat, repo) {
  const listEl = document.getElementById('collab-history-list');
  listEl.innerHTML = `<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0;">${t('collabPage.history.loading')}</div>`;

  const commits = await getCommitLog(pat, repo);
  if (commits.length === 0) {
    listEl.innerHTML = `<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:30px 0;">${t('collabPage.history.empty')}</div>`;
    return;
  }

  listEl.innerHTML = commits.map((c, i) => `
      <div class="collab-commit-card">
        <div class="collab-commit-header">
          <span class="collab-commit-sha">${c.sha.slice(0, 7)}</span>
          <span style="color:var(--text-muted);font-size:10px;">${new Date(c.date).toLocaleString()}</span>
        </div>
        <div style="font-size:12px;margin:4px 0;">${escHtml(c.message)}</div>
        <div style="font-size:11px;color:var(--text-muted);">by ${escHtml(c.author)}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;"
                data-sha="${c.sha}" data-pat="${pat}" data-repo="${encodeURIComponent(repo)}"
                id="restore-btn-${i}">
          ↩️ ${t('collabPage.buttons.restore')}
        </button>
      </div>
    `).join('');

  // Bind restore buttons
  commits.forEach((c, i) => {
    document.getElementById(`restore-btn-${i}`)?.addEventListener('click', async () => {
      const btn = document.getElementById(`restore-btn-${i}`);
      btn.disabled = true;
      btn.textContent = t('collabPage.status.restoring');
      const state = await getStateAtCommit(pat, repo, c.sha);
      if (state) {
        applyPulledState(state);
        showToast(`${t('collabPage.toast.restoreSuccess')} ${c.sha.slice(0, 7)}`, 'success');
        btn.textContent = t('collabPage.status.restored');
      } else {
        showToast('Failed to restore snapshot', 'error');
        btn.textContent = t('collabPage.status.failed');
        btn.disabled = false;
      }
    });
  });
}


/* ── Helpers ─────────────────────────────────────────────────────── */

function getCollabInputs() {
  return {
    pat: document.getElementById('collab-pat')?.value.trim() || loadCollabConfig().pat || '',
    repo: document.getElementById('collab-repo')?.value.trim() || loadCollabConfig().repo || '',
    username: document.getElementById('collab-username')?.value.trim() || loadCollabConfig().username || 'user',
  };
}

function applyPulledState(remoteState) {
  if (remoteState.projectConfig) updateProjectConfig(remoteState.projectConfig);
  if (remoteState.selectedAssets) setState('selectedAssets', remoteState.selectedAssets);
  if (remoteState.presets) setState('presets', remoteState.presets);
  if (remoteState.themeImages) setState('themeImages', remoteState.themeImages);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addCollabStyles() {
  if (document.getElementById('collab-styles')) return;
  const style = document.createElement('style');
  style.id = 'collab-styles';
  style.textContent = `
      .collab-grid {
        display: grid;
        grid-template-columns: 420px 1fr;
        gap: 20px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .collab-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 480px) {
        .collab-grid { gap: 12px; }
      }
      .collab-right { min-height: 400px; }

      .collab-card {
        border-top: 2px solid var(--border-subtle);
        transition: border-color 0.2s;
      }
      .collab-card:hover { border-top-color: rgba(59,130,246,0.4); }

      .collab-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .collab-card-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--text-primary);
      }
      .collab-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .collab-card-sub {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .collab-sync-btns {
        display: flex;
        gap: 10px;
      }
      .collab-sync-btn { flex: 1; justify-content: center; }
      .collab-status-bar {
        font-size: 12px;
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-subtle);
      }
      .collab-history-empty {
        color: var(--text-muted);
        font-size: 12px;
        text-align: center;
        padding: 40px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .collab-note-card {
        background: rgba(139,92,246,0.06);
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
        position: relative;
      }
      .collab-note-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .collab-note-body {
        font-size: 13px;
        color: var(--text-secondary);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .collab-commit-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-left: 3px solid var(--accent-blue);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        transition: border-left-color 0.2s;
      }
      .collab-commit-card:hover { border-left-color: var(--accent-cyan); }
      .collab-commit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .collab-commit-sha {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--accent-blue);
        background: var(--bg-tertiary);
        padding: 2px 6px;
        border-radius: 4px;
      }
    `;
  document.head.appendChild(style);
}

