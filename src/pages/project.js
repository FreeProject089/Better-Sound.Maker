/**
 * project.js — Project page
 * Manage selected assets, upload audio, view metadata
 */

import { getState, subscribe, setAudioFile, removeAudioFile, getAudioFile, deselectAsset, navigate, setCurrentSdef } from '../state/store.js';
import { analyzeAudioFile, guessLoopType, detectSoundType, SOUND_TYPES } from '../utils/audio-analyzer.js';
import { showToast } from '../components/toast.js';
import { pickAudioFile as pickAudioFileFn } from '../utils/file-picker.js';

let audioContext = null;
let currentAudioSource = null;

export function renderProject(container) {
  const state = getState();
  const selected = state.selectedAssets;
  const entries = Object.entries(selected);

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Project</h1>
        <p class="page-description">Manage your selected sound assets and upload custom audio files.</p>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">No Assets Selected</div>
        <div class="empty-state-text">Go to the Assets Library to select the sounds you want to modify.</div>
        <button class="btn btn-primary" style="margin-top: 16px;" id="go-library-btn">Go to Library</button>
      </div>
    `;
    document.getElementById('go-library-btn')?.addEventListener('click', () => navigate('library'));
    return;
  }

  // Group by category
  const grouped = {};
  for (const [sdefPath, data] of entries) {
    const cat = data.originalAsset?.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ sdefPath, ...data });
  }

  let tableHtml = '';
  for (const [cat, assets] of Object.entries(grouped).sort()) {
    tableHtml += `
      <tr class="category-header-row">
        <td colspan="6" style="padding: 14px; font-weight: 700; color: var(--accent-blue); font-size: 13px; background: rgba(59,130,246,0.05); border-bottom: 2px solid var(--border-accent);">
          📁 ${cat} <span style="font-weight: 400; color: var(--text-muted); font-size: 12px;">(${assets.length} assets)</span>
        </td>
      </tr>
    `;

    for (const asset of assets) {
      const hasAudio = !!asset.audioFileName;
      const hasFile = !!getAudioFile(asset.sdefPath);  // actual File in memory
      const meta = asset.audioMeta;
      const loopType = guessLoopType(asset.sdefPath);

      let audioInfo = '';
      if (hasAudio && meta && hasFile) {
        // Normal player — file is in memory
        audioInfo = `
          <div class="audio-player" style="min-width: 200px;">
            <button class="audio-play-btn" data-play="${asset.sdefPath}" title="Play">▶</button>
            <div class="audio-info">
              <div class="audio-filename">${asset.audioFileName}</div>
              <div class="audio-meta">
                <span class="tag ${meta.channelType === 'Mono' ? 'tag-green' : 'tag-amber'}">${meta.channelType}</span>
                <span>${meta.sampleRate}Hz</span>
                <span>${meta.durationFormatted}</span>
                <span>${meta.fileSizeFormatted}</span>
              </div>
            </div>
          </div>
        `;

        // Show recommendations if any
        if (meta.recommendations && meta.recommendations.length > 0) {
          audioInfo += '<div style="margin-top: 4px;">';
          for (const rec of meta.recommendations) {
            const cls = rec.type === 'error' ? 'tag-red' : rec.type === 'warning' ? 'tag-amber' : 'tag-blue';
            audioInfo += `<div class="tag ${cls}" style="margin-top: 2px; font-size: 10px;">⚠ ${rec.message}</div>`;
          }
          audioInfo += '</div>';
        }
      } else if (hasAudio && !hasFile) {
        // File was uploaded before but lost after refresh
        audioInfo = `
          <div class="drop-zone" data-drop="${asset.sdefPath}" style="padding: 10px; cursor: pointer; border-color: var(--accent-amber);">
            <div style="font-size: 12px; color: var(--accent-amber);">🔄 ${asset.audioFileName} — Re-upload needed (lost after refresh)</div>
          </div>
        `;
      } else {
        audioInfo = `
          <div class="drop-zone" data-drop="${asset.sdefPath}" style="padding: 10px; cursor: pointer;">
            <div style="font-size: 12px; color: var(--text-muted);">📎 Click or drag to upload .wav/.ogg</div>
          </div>
        `;
      }

      const typeTag = loopType === 'loop'
        ? '<span class="tag tag-blue">loop</span>'
        : loopType === 'one-shot'
          ? '<span class="tag tag-amber">one-shot</span>'
          : '';

      tableHtml += `
        <tr>
          <td>
            <div class="mono" style="font-size: 12px;">${asset.sdefPath}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              ${(asset.customWaves || []).join(', ') || '—'}
            </div>
          </td>
          <td>${typeTag}</td>
          <td>${audioInfo}</td>
          <td>
            ${hasAudio ? `<button class="btn btn-secondary btn-sm" data-change="${asset.sdefPath}">Change</button>` : ''}
            ${hasAudio ? `<button class="btn btn-danger btn-sm" data-remove-audio="${asset.sdefPath}" style="margin-left: 4px;">✕</button>` : ''}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" data-edit-sdef="${asset.sdefPath}" title="Edit SDEF">🎛️</button>
          </td>
          <td>
            <button class="btn btn-danger btn-sm btn-icon" data-deselect="${asset.sdefPath}" title="Remove">🗑️</button>
          </td>
        </tr>
      `;
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Project</h1>
      <p class="page-description">Manage ${entries.length} selected sound assets. Upload custom audio and configure each asset.</p>
    </div>
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-value">${entries.length}</div>
        <div class="stat-label">Selected Assets</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-green);">${entries.filter(([, d]) => d.audioFileName).length}</div>
        <div class="stat-label">Audio Assigned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-amber);">${entries.filter(([, d]) => !d.audioFileName).length}</div>
        <div class="stat-label">Missing Audio</div>
      </div>
    </div>
    <div class="card" style="overflow-x: auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Type</th>
            <th>Audio File</th>
            <th>Actions</th>
            <th>SDEF</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${tableHtml}</tbody>
      </table>
    </div>
  `;

  // Event handlers
  attachProjectHandlers(container);
}

function attachProjectHandlers(container) {
  // Upload zones (click)
  container.querySelectorAll('[data-drop]').forEach(zone => {
    zone.addEventListener('click', () => pickAudioFile(zone.dataset.drop));
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleAudioUpload(zone.dataset.drop, file);
    });
  });

  // Change buttons
  container.querySelectorAll('[data-change]').forEach(btn => {
    btn.addEventListener('click', () => pickAudioFile(btn.dataset.change));
  });

  // Remove audio
  container.querySelectorAll('[data-remove-audio]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeAudioFile(btn.dataset.removeAudio);
      renderProject(container);
      showToast('Audio removed', 'info');
    });
  });

  // Edit SDEF
  container.querySelectorAll('[data-edit-sdef]').forEach(btn => {
    btn.addEventListener('click', () => {
      setCurrentSdef(btn.dataset.editSdef);
      navigate('sdef-editor');
    });
  });

  // Deselect
  container.querySelectorAll('[data-deselect]').forEach(btn => {
    btn.addEventListener('click', () => {
      deselectAsset(btn.dataset.deselect);
      renderProject(container);
      showToast('Asset removed from project', 'info');
    });
  });

  // Play buttons
  container.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => playAudio(btn.dataset.play, btn));
  });
}

async function pickAudioFile(sdefPath) {
  try {
    const file = await pickAudioFileFn();
    await handleAudioUpload(sdefPath, file);
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to open file: ' + e.message, 'error');
    }
  }
}

async function handleAudioUpload(sdefPath, file) {
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['wav', 'ogg'].includes(ext)) {
      showToast('Only .wav and .ogg files are supported', 'warning');
      return;
    }

    const meta = await analyzeAudioFile(file);
    setAudioFile(sdefPath, file, meta);
    showToast(`Audio assigned: ${file.name}`, 'success');

    // Re-render
    const container = document.getElementById('page-container');
    renderProject(container);
  } catch (e) {
    showToast('Failed to analyze audio: ' + e.message, 'error');
  }
}

function playAudio(sdefPath, btn) {
  // If currently playing this sound, stop it
  if (currentAudioSource) {
    currentAudioSource.pause();
    currentAudioSource.currentTime = 0;

    // If clicking the same play button while playing, just stop
    if (btn.dataset.playing === 'true') {
      btn.textContent = '▶';
      btn.dataset.playing = 'false';
      if (btn._objectUrl) {
        URL.revokeObjectURL(btn._objectUrl);
        btn._objectUrl = null;
      }
      currentAudioSource = null;
      return;
    }

    // Different button — stop old, reset old button
    const oldBtn = document.querySelector('[data-playing="true"]');
    if (oldBtn) {
      oldBtn.textContent = '▶';
      oldBtn.dataset.playing = 'false';
      if (oldBtn._objectUrl) {
        URL.revokeObjectURL(oldBtn._objectUrl);
        oldBtn._objectUrl = null;
      }
    }
    currentAudioSource = null;
  }

  const file = getAudioFile(sdefPath);
  if (!file) return;

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  currentAudioSource = audio;
  btn._objectUrl = url;
  btn.textContent = '⏸';
  btn.dataset.playing = 'true';

  audio.play();
  audio.onended = () => {
    btn.textContent = '▶';
    btn.dataset.playing = 'false';
    URL.revokeObjectURL(url);
    btn._objectUrl = null;
    currentAudioSource = null;
  };
}
