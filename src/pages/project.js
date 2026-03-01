/**
 * project.js — Project page
 * Manage selected assets, upload audio, view metadata
 */

import { getState, subscribe, setAudioFile, removeAudioFile, getAudioFile, deselectAsset, navigate, setCurrentSdef, setSdefContent, getWaveAudioFile, removeWaveAudioFile, setWaveAudioFile } from '../state/store.js';
import { SDEF_PARAMS, generateSdef, parseSdef } from '../utils/sdef-generator.js';
import { analyzeAudioFile, guessLoopType, detectSoundType, getTypeDefaults, SOUND_TYPES } from '../utils/audio-analyzer.js';
import { showToast } from '../components/toast.js';
import { pickAudioFile as pickAudioFileFn } from '../utils/file-picker.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';

let audioContext = null;
let currentAudioSource = null;

// Tree state for Project page
let projectOpenFolders = new Set();

export function renderProject(container) {
  const state = getState();
  const selected = state.selectedAssets;
  const entries = Object.entries(selected);

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="page-header flex-between">
        <div>
          <h1 class="page-title" data-i18n="project.title">Project</h1>
          <p class="page-description" data-i18n="project.description">Manage your selected sound assets and upload custom audio files.</p>
        </div>
        <div class="flex-gap">
          <button class="btn btn-secondary" id="load-mod-btn">
            ${getIcon('upload-cloud', 'w-4 h-4')} <span>Load Existing Mod</span>
          </button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('folder', 'icon-xl')}</div>
        <div class="empty-state-title" data-i18n="project.noAssetsTitle">No Assets Selected</div>
        <div class="empty-state-text" data-i18n="project.noAssetsText">Go to the Assets Library to select the sounds you want to modify.</div>
        <button class="btn btn-primary" style="margin-top: 16px;" id="go-library-btn" data-i18n="project.goToLibrary">Go to Library</button>
      </div>
    `;
    document.getElementById('go-library-btn')?.addEventListener('click', () => navigate('library'));
    attachProjectHandlers(container);
    renderIcons(container);
    return;
  }

  // Build tree from sdef paths
  const root = {};
  for (const [sdefPath, data] of entries) {
    const tPath = data.originalAsset?.treePath || sdefPath;
    const parts = tPath.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!node[seg]) node[seg] = { _files: [] };
      node = node[seg];
    }
    if (!node._files) node._files = [];
    node._files.push({ sdefPath, ...data });
  }

  const projectTreeHtml = renderProjectTreeNode(root);

  container.innerHTML = `
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">Project</h1>
        <p class="page-description">${t('project.manageSubtitle', { count: entries.length })}</p>
      </div>
      <div class="flex-gap">
        <button class="btn btn-secondary" id="load-mod-btn">
          ${getIcon('upload-cloud', 'w-4 h-4')} <span>Load Existing Mod</span>
        </button>
      </div>
    </div>
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-value">${entries.length}</div>
        <div class="stat-label" data-i18n="library.selected">Selected Assets</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-green);">${entries.filter(([, d]) => d.audioFileName).length}</div>
        <div class="stat-label" data-i18n="project.audioAssigned">Audio Assigned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-amber);">${entries.filter(([, d]) => !d.audioFileName).length}</div>
        <div class="stat-label" data-i18n="project.missingAudio">Missing Audio</div>
      </div>
    </div>
    <div class="card" style="overflow-x: auto; padding: 0;">
      <table class="data-table" style="table-layout: fixed; width: 100%; min-width: 800px;">
        <thead>
          <tr>
            <th style="width: 300px;">Asset / Path</th>
            <th>${t('project.audioFile')}</th>
            <th style="width: 100px; text-align: center;">${t('common.actions')}</th>
            <th style="width: 60px; text-align: center;">${t('common.edit')}</th>
            <th style="width: 60px;"></th>
          </tr>
        </thead>
        <tbody>${projectTreeHtml}</tbody>
      </table>
    </div>
  `;
  renderIcons(container);
  updateTranslations();

  // Event handlers
  attachProjectHandlers(container);
  attachFolderHandlers(container);
}

function renderProjectTreeNode(node, parentPath = [], depth = 0) {
  let html = '';
  const keys = Object.keys(node).filter(k => k !== '_files').sort();

  for (const key of keys) {
    let child = node[key];
    let compressedPath = [key];

    while (true) {
      const childKeys = Object.keys(child).filter(k => k !== '_files');
      const hasFiles = child._files && child._files.length > 0;
      if (childKeys.length === 1 && !hasFiles) {
        compressedPath.push(childKeys[0]);
        child = child[childKeys[0]];
      } else {
        break;
      }
    }

    const currentPathArr = [...parentPath, ...compressedPath];
    const pathStr = currentPathArr.join('/');
    const isOpen = projectOpenFolders.has(pathStr);
    const count = countProjectFiles(child);
    const indent = depth * 20;

    html += `
            <tr class="folder-row" data-folder-path="${pathStr}">
                <td colspan="5" style="padding-left: ${16 + indent}px; background: var(--bg-card); cursor: pointer;" class="project-folder-toggle">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 600;">
                        <span class="folder-arrow ${isOpen ? 'open' : ''}" style="transition: transform 0.2s;">
                            ${getIcon('chevron-right', 'w-3 h-3')}
                        </span>
                        ${getIcon('folder', 'fill text-blue-500')} 
                        <span style="${(child._files && child._files.length > 0) ? 'color: var(--accent-blue); text-shadow: 0 0 8px rgba(59,130,246,0.3);' : ''}">${compressedPath.join('/')}</span>
                        <span style="font-size: 11px; font-weight: 500; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); padding: 1px 8px; border-radius: 99px; border: 1px solid rgba(59, 130, 246, 0.2);">${count}</span>
                    </div>
                </td>
            </tr>
        `;

    if (isOpen) {
      html += renderProjectTreeNode(child, currentPathArr, depth + 1);
    }
  }

  if (node._files && node._files.length > 0) {
    node._files.sort((a, b) => a.sdefPath.localeCompare(b.sdefPath)).forEach(asset => {
      html += renderAssetRow(asset, depth + 1);
    });
  }

  return html;
}

function countProjectFiles(node) {
  let c = (node._files || []).length;
  for (const key of Object.keys(node)) {
    if (key !== '_files') c += countProjectFiles(node[key]);
  }
  return c;
}

function renderAssetRow(asset, depth) {
  const hasAudio = !!asset.audioFileName;
  const hasFile = !!getAudioFile(asset.sdefPath);  // actual File in memory
  const meta = asset.audioMeta;
  const parts = asset.sdefPath.split('/');
  const name = parts.pop();
  const indent = depth * 20;

  let audioInfo = '';
  // Multiple Waves View
  if (asset.customWaves && asset.customWaves.length > 1) {
    const waveRows = asset.customWaves.map((wavePath, i) => {
      const waveFile = asset.waveAudioFiles ? asset.waveAudioFiles[wavePath] : null;
      const waveShort = wavePath.split('/').pop();
      if (waveFile && waveFile.fileName) {
        return `
            <div class="audio-player" style="margin-bottom:4px; margin-top:4px; display:flex; align-items:center; gap:6px;">
              <button class="audio-play-btn" data-play-wave="${asset.sdefPath}" data-wave-path="${wavePath}" title="${t('project.play')}">${getIcon('play')}</button>
              <div class="audio-info" style="flex:1; min-width:0;">
                <div class="audio-filename" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${waveFile.fileName}</div>
                <div class="audio-meta" style="display:flex; gap:4px; flex-wrap:wrap;">
                  <span class="tag tag-blue" style="font-size:10px;">${waveShort}</span>
                  <span class="tag ${waveFile.audioMeta?.channelType === 'Mono' ? 'tag-green' : 'tag-amber'}">${waveFile.audioMeta?.channelType || '?'}</span>
                </div>
              </div>
              <button class="btn-icon danger" style="flex-shrink:0; width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center;" data-remove-wave="${asset.sdefPath}" data-wave-path="${wavePath}" title="${t('project.removeAudio')}">${getIcon('trash-2', 'w-4 h-4')}</button>
            </div>
        `;
      } else {
        return `
            <div class="drop-zone" data-drop-wave="${asset.sdefPath}" data-wave-path="${wavePath}" style="margin-bottom:4px; margin-top:4px; padding:6px 8px; display:flex; align-items:center; gap:6px;">
              ${getIcon('upload', 'w-3 h-3')} ${t('project.clickDragUpload')} <span style="font-family:monospace; font-size:10px; opacity:0.7;">(${waveShort})</span>
            </div>
        `;
      }
    }).join('');

    audioInfo = `<div style="display:flex; flex-direction:column; gap:2px;">${waveRows}</div>`;
  } else {
    // Single Wave View
    if (hasAudio && meta && hasFile) {
      // Normal player
      audioInfo = `
              <div class="audio-player">
                <button class="audio-play-btn" data-play="${asset.sdefPath}" title="${t('project.play')}">${getIcon('play')}</button>
                <div class="audio-info">
                  <div class="audio-filename">${asset.audioFileName}</div>
                  <div class="audio-meta">
                    <span class="tag ${meta.channelType === 'Mono' ? 'tag-green' : 'tag-amber'}">${meta.channelType}</span>
                    <span>${meta.sampleRate}Hz</span>
                    <span>${meta.durationFormatted}</span>
                  </div>
                </div>
              </div>
            `;
      if (meta.recommendations?.length > 0) {
        audioInfo += `<div class="tag tag-amber" style="margin-top:4px; font-size:10px;">${meta.recommendations.length} issue${meta.recommendations.length > 1 ? 's' : ''}</div>`;
      }
    } else if (hasAudio && !hasFile) {
      audioInfo = `
              <div class="drop-zone warning" data-drop="${asset.sdefPath}">
                ${getIcon('refresh-cw', 'w-3 h-3')} ${t('project.reupload')} ${asset.audioFileName}
              </div>
            `;
    } else {
      audioInfo = `
              <div class="drop-zone" data-drop="${asset.sdefPath}">
                ${getIcon('upload', 'w-3 h-3')} ${t('project.clickDragUpload')}
              </div>
            `;
    }
  }

  return `
        <tr>
          <td style="padding-left: ${16 + indent}px;">
            <div class="project-asset-name" style="font-weight: 600; font-size: 13px; color: var(--text-color);">${name}</div>
            <div class="project-asset-path truncate" style="font-size: 10px; color: var(--text-muted); margin-top: 2px;" title="${asset.sdefPath}">${asset.sdefPath}</div>
          </td>
          <td>${audioInfo}</td>
          <td style="text-align:center; vertical-align:middle;">
            <div class="flex-gap" style="justify-content:center;">
                ${hasAudio && (!asset.customWaves || asset.customWaves.length <= 1) ? `<button class="btn btn-secondary btn-sm" style="width:32px; height:32px; padding:0; display:inline-flex; align-items:center; justify-content:center;" data-change="${asset.sdefPath}" title="${t('project.replace')}">${getIcon('refresh-cw', 'w-4 h-4')}</button>` : ''}
                ${hasAudio && (!asset.customWaves || asset.customWaves.length <= 1) ? `<button class="btn btn-danger btn-sm" style="width:32px; height:32px; padding:0; display:inline-flex; align-items:center; justify-content:center;" data-remove-audio="${asset.sdefPath}" title="${t('project.removeAudio')}">${getIcon('trash-2', 'w-4 h-4')}</button>` : ''}
            </div>
          </td>
          <td style="text-align:center; vertical-align:middle;">
            <button class="btn btn-secondary btn-sm" style="width:32px; height:32px; padding:0; display:inline-flex; align-items:center; justify-content:center;" data-edit-sdef="${asset.sdefPath}" title="${t('project.editSdef')}">${getIcon('sliders', 'w-4 h-4')}</button>
          </td>
          <td style="text-align:center; vertical-align:middle;">
            <button class="btn btn-danger btn-sm" style="width:32px; height:32px; padding:0; display:inline-flex; align-items:center; justify-content:center;" data-deselect="${asset.sdefPath}" title="${t('project.remove')}">${getIcon('x', 'w-4 h-4')}</button>
          </td>
        </tr>
      `;
}

function attachFolderHandlers(container) {
  container.querySelectorAll('.project-folder-toggle').forEach(el => {
    el.addEventListener('click', () => {
      const row = el.closest('tr');
      const path = row.dataset.folderPath;
      if (projectOpenFolders.has(path)) {
        projectOpenFolders.delete(path);
      } else {
        projectOpenFolders.add(path);
      }
      renderProject(container);
    });
  });
}

function attachProjectHandlers(container) {
  // Upload zones (click) single
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

  // Upload zones per wave
  container.querySelectorAll('[data-drop-wave]').forEach(zone => {
    zone.addEventListener('click', () => pickWaveAudioFile(zone.dataset.dropWave, zone.dataset.wavePath));
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleWaveAudioUpload(zone.dataset.dropWave, zone.dataset.wavePath, file);
    });
  });

  // Change buttons
  container.querySelectorAll('[data-change]').forEach(btn => {
    btn.addEventListener('click', () => pickAudioFile(btn.dataset.change));
  });

  // Remove audio (single)
  container.querySelectorAll('[data-remove-audio]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeAudioFile(btn.dataset.removeAudio);
      // Re-render whole project to update
      renderProject(document.getElementById('page-container'));
      showToast('Audio removed', 'info');
    });
  });

  // Remove wave audio
  container.querySelectorAll('[data-remove-wave]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await removeWaveAudioFile(btn.dataset.removeWave, btn.dataset.wavePath);
      renderProject(document.getElementById('page-container'));
      showToast('Wave audio removed', 'info');
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
      // Re-render
      renderProject(document.getElementById('page-container'));
      showToast('Asset removed from project', 'info');
    });
  });

  // Load Mod
  document.getElementById('load-mod-btn')?.addEventListener('click', async () => {
    const state = getState();
    const hasAssets = Object.keys(state.selectedAssets).length > 0;

    if (hasAssets) {
      const { showModal } = await import('../components/modal.js');
      const { saveAllUnsavedSdefs } = await import('../state/store.js');

      const choice = await showModal({
        title: 'Load Existing Mod?',
        content: '<p>Loading a new mod will clear your current project. Do you want to save your current SDEF changes first?</p>',
        actions: [
          { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
          { id: 'load-only', label: 'Load & Close', class: 'btn-danger' },
          { id: 'save-load', label: 'Save & Load', class: 'btn-success' }
        ]
      });

      if (choice === 'cancel' || !choice) return;
      if (choice === 'save-load') {
        const { saveAllUnsavedSdefs } = await import('../state/store.js');
        saveAllUnsavedSdefs();
      }
    }

    // Ask user: .zip or folder?
    const { showModal } = await import('../components/modal.js');
    const fmt = await showModal({
      title: 'Load Format',
      content: `<p>How is your mod packaged?</p>`,
      actions: [
        { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
        { id: 'zip', label: '&#x1F4E6; ZIP Archive (.zip)', class: 'btn-primary' },
        { id: 'folder', label: '&#x1F4C1; Unzipped Folder', class: 'btn-secondary' }
      ]
    });
    if (!fmt || fmt === 'cancel') return;

    try {
      if (fmt === 'zip') {
        const { pickFiles } = await import('../utils/file-picker.js');
        const files = await pickFiles({ accept: '.zip' });
        if (!files.length) return;
        showToast('Loading mod from ZIP…', 'info');
        const { loadModFromZip } = await import('../utils/mod-loader.js');
        const modData = await loadModFromZip(files[0]);
        const { importModData } = await import('../state/store.js');
        await importModData(modData);
        showToast('Mod loaded successfully', 'success');
      } else {
        // Folder — use Electron API to pick a directory
        if (!window.electronAPI?.pickFolder) {
          showToast('Folder pick not available in browser mode', 'warning');
          return;
        }
        const folderPath = await window.electronAPI.pickFolder();
        if (!folderPath) return;
        showToast('Loading mod from folder…', 'info');
        const { loadModFromFolder } = await import('../utils/mod-loader.js');
        const modData = await loadModFromFolder(folderPath);
        const { importModData } = await import('../state/store.js');
        await importModData(modData);
        showToast('Mod loaded from folder successfully', 'success');
      }
      renderProject(document.getElementById('page-container'));
    } catch (e) {
      if (e.name !== 'AbortError') {
        showToast('Failed to load mod: ' + e.message, 'error');
      }
    }
  });

  // Play buttons (single)
  container.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => playAudio(btn.dataset.play, null, btn));
  });

  // Play buttons (wave)
  container.querySelectorAll('[data-play-wave]').forEach(btn => {
    btn.addEventListener('click', () => playAudio(btn.dataset.playWave, btn.dataset.wavePath, btn));
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

async function pickWaveAudioFile(sdefPath, wavePath) {
  try {
    const file = await pickAudioFileFn();
    await handleWaveAudioUpload(sdefPath, wavePath, file);
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to open file: ' + e.message, 'error');
    }
  }
}

async function handleWaveAudioUpload(sdefPath, wavePath, file) {
  try {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['wav', 'ogg'].includes(ext)) {
      showToast('Only .wav and .ogg files are supported', 'warning');
      return;
    }
    const meta = await analyzeAudioFile(file);
    await setWaveAudioFile(sdefPath, wavePath, file, meta);
    showToast(`Wave audio assigned: ${file.name}`, 'success');
    renderProject(document.getElementById('page-container'));
  } catch (e) {
    showToast('Failed to analyze wave audio: ' + e.message, 'error');
  }
}

function playAudio(sdefPath, wavePath, btn) {
  // If currently playing this sound, stop it
  if (currentAudioSource) {
    if (currentAudioSource.stop) currentAudioSource.stop(); // If AudioBufferSourceNode
    if (currentAudioSource.pause) currentAudioSource.pause(); // If HTMLAudioElement

    const oldBtn = document.querySelector('[data-playing="true"]');
    if (oldBtn) {
      oldBtn.innerHTML = getIcon('play');
      oldBtn.dataset.playing = 'false';
      if (oldBtn._objectUrl) {
        URL.revokeObjectURL(oldBtn._objectUrl);
        oldBtn._objectUrl = null;
      }
      renderIcons(oldBtn);

      // If clicking same button, we just want to stop/pause, not replay
      if (btn === oldBtn) {
        currentAudioSource = null;
        return;
      }
    }
    currentAudioSource = null;
  }

  let file = null;
  if (wavePath) {
    file = getWaveAudioFile(sdefPath, wavePath);
    startPlayback(file);
  } else {
    file = getAudioFile(sdefPath);
    startPlayback(file);
  }

  function startPlayback(f) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const audio = new Audio(url);
    currentAudioSource = audio;
    btn._objectUrl = url;
    btn.innerHTML = getIcon('pause');
    btn.dataset.playing = 'true';
    renderIcons(btn);

    // Always apply SDEF parameters so user hears sound as DCS would play it
    const state = getState();
    const asset = state.selectedAssets[sdefPath];
    let params = {};
    if (asset && asset.sdefContent) {
      params = parseSdef(asset.sdefContent);
    } else {
      const soundType = detectSoundType(sdefPath);
      params = getTypeDefaults(soundType);
    }
    let finalVolume = params.gain !== undefined ? Math.max(params.gain, 0) : 1;
    if (params.pitch !== undefined) audio.playbackRate = Math.max(0.1, params.pitch);
    if (params.detached === false || params.listmode === 'LOOP') audio.loop = true;

    // Apply stereo panning & distance attenuation based on SDEF position
    if (params.position && Array.isArray(params.position) && params.position.length >= 3) {
      const [fwd, up, right] = params.position;
      const distance = Math.sqrt(fwd * fwd + up * up + right * right);

      // Distance Volume Attenuation
      if (distance > 0) {
        const innerRadius = params.inner_radius || 50;
        if (distance > innerRadius) {
          finalVolume *= (innerRadius / distance);
        }
      }

      audio.volume = Math.min(finalVolume, 1);

      try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();

        const source = audioContext.createMediaElementSource(audio);

        if (audioContext.createStereoPanner) {
          const panner = audioContext.createStereoPanner();
          // Calculate natural pan value (-1 to 1) based on angle
          const panValue = distance > 0 ? (right / distance) : 0;
          panner.pan.value = Math.max(-1, Math.min(1, panValue));
          source.connect(panner);
          panner.connect(audioContext.destination);
        } else {
          source.connect(audioContext.destination);
        }
      } catch (e) {
        console.warn('AudioContext setup failed', e);
      }
    } else {
      audio.volume = Math.min(finalVolume, 1);
    }

    audio.play();
    audio.onended = () => {
      btn.innerHTML = getIcon('play');
      btn.dataset.playing = 'false';
      URL.revokeObjectURL(url);
      btn._objectUrl = null;
      currentAudioSource = null;
      renderIcons(btn);
    };
  }
}
