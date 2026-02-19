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
      <h1 class="page-title">🤝 Collaboration</h1>
      <p class="page-description">
        Sync your mod project with a GitHub repository. Multiple users can work on the same mod,
        share notes, and restore any previous version.
      </p>
    </div>

    <!-- ── Settings ─────────────────────────────────────── -->
    <div class="collab-grid">
      <div class="collab-left">

        <div class="card" style="margin-bottom:20px;">
          <div class="card-title" style="margin-bottom:16px;">⚙️ GitHub Settings</div>
          <div class="flex-col" style="gap:14px;">

            <div class="input-group">
              <label class="input-label">GitHub PAT
                <span style="font-size:10px;color:var(--text-muted);margin-left:6px;">(stored locally only)</span>
              </label>
              <input type="password" class="input-field" id="collab-pat"
                     placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                     value="${escHtml(cfg.pat || '')}" />
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                Needs <strong>repo</strong> scope.
                <a href="https://github.com/settings/tokens/new" target="_blank"
                   style="color:var(--accent-blue);">Create token ↗</a>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Repository</label>
              <input type="text" class="input-field" id="collab-repo"
                     placeholder="owner/my-sound-mod"
                     value="${escHtml(cfg.repo || '')}" />
            </div>

            <div class="input-group">
              <label class="input-label">Your Name / Username</label>
              <input type="text" class="input-field" id="collab-username"
                     placeholder="YourName"
                     value="${escHtml(cfg.username || '')}" />
            </div>

            <div class="flex-gap" style="gap:10px;margin-top:4px;">
              <button class="btn btn-secondary" id="collab-save-btn" style="flex:1;">💾 Save Settings</button>
              <button class="btn btn-secondary" id="collab-test-btn" style="flex:1;">🔌 Test Connection</button>
            </div>
            <div id="collab-status" style="font-size:12px;display:none;"></div>
          </div>
        </div>

        <!-- ── Sync ─────────────────────────────────────── -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-title" style="margin-bottom:16px;">☁️ Sync Project</div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">
            Push your current project state to the repo, or pull the latest from teammates.
          </p>
          <div class="flex-gap" style="gap:10px;">
            <button class="btn btn-success" id="collab-push-btn" style="flex:1;">⬆️ Push</button>
            <button class="btn btn-secondary" id="collab-pull-btn" style="flex:1;">⬇️ Pull</button>
          </div>
          <div id="collab-sync-status" style="font-size:12px;margin-top:10px;display:none;"></div>
        </div>

        <!-- ── Notes ────────────────────────────────────── -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px;">📝 Team Notes</div>
          <textarea class="input-field" id="collab-note-text"
                    rows="4"
                    placeholder="Write a note for the team..."></textarea>
          <button class="btn btn-secondary" id="collab-note-send" style="width:100%;margin-top:10px;">
            📨 Post Note
          </button>
          <button class="btn btn-secondary" id="collab-notes-load" style="width:100%;margin-top:8px;font-size:12px;">
            🔄 Load Team Notes
          </button>
          <div id="collab-notes-list" style="margin-top:14px;"></div>
        </div>

      </div>

      <!-- ── History ──────────────────────────────────────── -->
      <div class="collab-right">
        <div class="card" style="height:100%;">
          <div class="flex-between" style="margin-bottom:16px;">
            <div class="card-title">📜 Commit History</div>
            <button class="btn btn-secondary btn-sm" id="collab-history-load">🔄 Refresh</button>
          </div>
          <div id="collab-history-list">
            <div style="color:var(--text-muted);font-size:12px;text-align:center;padding:30px 0;">
              Click Refresh to load commit history
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  addCollabStyles();
  bindCollabEvents();
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
    showToast('Settings saved', 'success');
  });

  // Test connection
  document.getElementById('collab-test-btn')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast('Enter PAT and repo first', 'warning'); return; }

    const statusEl = document.getElementById('collab-status');
    statusEl.style.display = 'block';
    statusEl.textContent = '⏳ Testing connection…';

    const result = await testConnection(pat, repo);
    if (result.ok) {
      statusEl.innerHTML = `✅ Connected as <strong>${result.user}</strong> → <strong>${result.repoName}</strong>`;
      statusEl.style.color = 'var(--accent-green)';
    } else {
      statusEl.textContent = `❌ ${result.error}`;
      statusEl.style.color = 'var(--accent-red, #f85149)';
    }
  });

  // Push (Re-implemented as "Push Build")
  document.getElementById('collab-push-btn')?.addEventListener('click', async () => {
    const { pat, repo, username } = getCollabInputs();
    if (!pat || !repo) { showToast('Configure GitHub settings first', 'warning'); return; }

    const syncEl = document.getElementById('collab-sync-status');
    syncEl.style.display = 'block';
    syncEl.textContent = '📦 Preparing full mod build for push...';

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

      syncEl.innerHTML = `✅ Build Pushed! ${count} assets synced.`;
      syncEl.style.color = 'var(--accent-green)';
      showToast('Full project build pushed to GitHub!', 'success');

    } catch (err) {
      console.error(err);
      syncEl.textContent = `❌ Push failed: ${err.message}`;
      syncEl.style.color = 'var(--accent-red, #f85149)';
    }
  });

  // Pull
  document.getElementById('collab-pull-btn')?.addEventListener('click', async () => {
    const { pat, repo } = getCollabInputs();
    if (!pat || !repo) { showToast('Configure GitHub settings first', 'warning'); return; }

    const syncEl = document.getElementById('collab-sync-status');
    syncEl.style.display = 'block';
    syncEl.textContent = '⬇️ Pulling from repo…';

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
        syncEl.innerHTML = `✅ Project pulled + ${downloaded} audio files loaded!`;
      } catch (err) {
        console.error('Audio pull error', err);
        syncEl.innerHTML += `<br>⚠ Audio dl warning: ${err.message}`;
      }
      // --- AUDIO PULL END ---

      syncEl.style.color = 'var(--accent-green)';
      showToast('Project pulled from GitHub', 'success');
    } else {
      syncEl.textContent = `❌ Pull failed: ${result.error}`;
      syncEl.style.color = 'var(--accent-red, #f85149)';
      showToast('Pull failed: ' + result.error, 'error');
    }
  });

  // Post note
  document.getElementById('collab-note-send')?.addEventListener('click', async () => {
    const { pat, repo, username } = getCollabInputs();
    if (!pat || !repo) { showToast('Configure GitHub settings first', 'warning'); return; }
    const text = document.getElementById('collab-note-text')?.value.trim();
    if (!text) { showToast('Note is empty', 'warning'); return; }

    const result = await pushNote(pat, repo, username || 'user', text);
    if (result.ok) {
      showToast('Note posted!', 'success');
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
    if (!pat || !repo) { showToast('Configure GitHub settings first', 'warning'); return; }

    const listEl = document.getElementById('collab-notes-list');
    listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;">⏳ Loading notes…</div>';

    const notes = await listNotes(pat, repo);
    if (notes.length === 0) {
      listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0;">No notes yet.</div>';
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
    if (!pat || !repo) { showToast('Configure GitHub settings first', 'warning'); return; }
    await loadHistory(pat, repo);
  });
}

async function loadHistory(pat, repo) {
  const listEl = document.getElementById('collab-history-list');
  listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0;">⏳ Loading…</div>';

  const commits = await getCommitLog(pat, repo);
  if (commits.length === 0) {
    listEl.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:30px 0;">No commits yet — push your project first!</div>';
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
          ↩️ Restore this version
        </button>
      </div>
    `).join('');

  // Bind restore buttons
  commits.forEach((c, i) => {
    document.getElementById(`restore-btn-${i}`)?.addEventListener('click', async () => {
      const btn = document.getElementById(`restore-btn-${i}`);
      btn.disabled = true;
      btn.textContent = '⏳ Restoring…';
      const state = await getStateAtCommit(pat, repo, c.sha);
      if (state) {
        applyPulledState(state);
        showToast(`Restored to ${c.sha.slice(0, 7)}`, 'success');
        btn.textContent = '✅ Restored!';
      } else {
        showToast('Failed to restore snapshot', 'error');
        btn.textContent = '❌ Failed';
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
      .collab-right { min-height: 400px; }
      .collab-note-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
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
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
      }
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
