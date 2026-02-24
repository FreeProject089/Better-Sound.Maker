/**
 * project.js — Project page
 * Manage selected assets, upload audio, view metadata
 */

import { getState, subscribe, setAudioFile, removeAudioFile, getAudioFile, deselectAsset, navigate, setCurrentSdef } from '../state/store.js';
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
      <div class="page-header">
        <h1 class="page-title" data-i18n="project.title">Project</h1>
        <p class="page-description" data-i18n="project.description">Manage your selected sound assets and upload custom audio files.</p>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('folder', 'icon-xl')}</div>
        <div class="empty-state-title" data-i18n="project.noAssetsTitle">No Assets Selected</div>
        <div class="empty-state-text" data-i18n="project.noAssetsText">Go to the Assets Library to select the sounds you want to modify.</div>
        <button class="btn btn-primary" style="margin-top: 16px;" id="go-library-btn" data-i18n="project.goToLibrary">Go to Library</button>
      </div>
    `;
    document.getElementById('go-library-btn')?.addEventListener('click', () => navigate('library'));
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
      <table class="data-table">
        <thead>
          <tr>
            <th data-i18n="library.assets" style="width: 300px;">Asset / Path</th>
            <th style="width: 140px;">${t('library.type')}</th>
            <th>${t('project.audioFile')}</th>
            <th style="width: 100px;">${t('common.actions')}</th>
            <th style="width: 60px;">${t('common.edit')}</th>
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
    const child = node[key];
    const currentPathArr = [...parentPath, key];
    const pathStr = currentPathArr.join('/');
    const isOpen = projectOpenFolders.has(pathStr);
    const count = countProjectFiles(child);
    const indent = depth * 20;

    html += `
            <tr class="folder-row" data-folder-path="${pathStr}">
                <td colspan="6" style="padding-left: ${16 + indent}px; background: var(--bg-card); cursor: pointer;" class="project-folder-toggle">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 600;">
                        <span class="folder-arrow ${isOpen ? 'open' : ''}" style="transition: transform 0.2s;">
                            ${getIcon('chevron-right', 'w-3 h-3')}
                        </span>
                        ${getIcon('folder', 'fill text-blue-500')} 
                        <span>${key}</span>
                        <span style="font-size: 11px; font-weight: 400; color: var(--text-muted); background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 99px;">${count}</span>
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

  // Determine current loop type from SDEF content or defaults
  let params = {};
  if (asset.sdefContent) {
    params = parseSdef(asset.sdefContent);
  } else {
    const soundType = detectSoundType(asset.sdefPath);
    params = getTypeDefaults(soundType);
  }

  // Detached = true usually means One-Shot (explosion, click)
  // Detached = false usually means attached to source (loop, engine)
  const isOneShot = params.detached === true;
  const currentLoopType = isOneShot ? 'one-shot' : 'loop';

  let audioInfo = '';
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
      // Shorten recommendations for table view
      const count = meta.recommendations.length;
      audioInfo += `<div class="tag tag-amber" style="margin-top:4px; font-size:10px;">${count} issue${count > 1 ? 's' : ''}</div>`;
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

  return `
        <tr>
          <td style="padding-left: ${16 + indent}px;">
            <div class="project-asset-name">${name}</div>
            <div class="project-asset-path">${asset.sdefPath}</div>
          </td>
          <td>
             <div class="custom-select-wrapper" style="width: 110px;">
                <select class="input-field" style="padding: 4px 8px; font-size: 11px; height: auto;" data-loop-type="${asset.sdefPath}">
                    <option value="one-shot" ${currentLoopType === 'one-shot' ? 'selected' : ''}>One-Shot</option>
                    <option value="loop" ${currentLoopType === 'loop' ? 'selected' : ''}>Loop</option>
                </select>
             </div>
          </td>
          <td>${audioInfo}</td>
          <td>
            <div class="flex-gap">
                ${hasAudio ? `<button class="btn-icon" data-change="${asset.sdefPath}" title="${t('project.replace')}">${getIcon('refresh-cw')}</button>` : ''}
                ${hasAudio ? `<button class="btn-icon danger" data-remove-audio="${asset.sdefPath}" title="${t('project.removeAudio')}">${getIcon('trash-2')}</button>` : ''}
            </div>
          </td>
          <td>
            <button class="btn-icon" data-edit-sdef="${asset.sdefPath}" title="${t('project.editSdef')}">${getIcon('sliders')}</button>
          </td>
          <td>
            <button class="btn-icon danger" data-deselect="${asset.sdefPath}" title="${t('project.remove')}">${getIcon('x')}</button>
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
  // Loop type change
  container.querySelectorAll('[data-loop-type]').forEach(select => {
    select.addEventListener('change', (e) => {
      const sdefPath = e.target.dataset.loopType;
      const newType = e.target.value;
      updateAssetLoopType(sdefPath, newType);
    });
  });

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
      // Re-render whole project to update
      renderProject(document.getElementById('page-container'));
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
        saveAllUnsavedSdefs();
      }
    }

    try {
      const { pickFiles } = await import('../utils/file-picker.js');
      const files = await pickFiles({ accept: '.zip' });
      if (files.length === 0) return;

      showToast('Loading mod...', 'info');
      const { loadModFromZip } = await import('../utils/mod-loader.js');
      const modData = await loadModFromZip(files[0]);

      const { importModData } = await import('../state/store.js');
      await importModData(modData);

      showToast('Mod loaded successfully', 'success');
      renderProject(document.getElementById('page-container'));
    } catch (e) {
      if (e.name !== 'AbortError') {
        showToast('Failed to load mod: ' + e.message, 'error');
      }
    }
  });

  // Play buttons
  container.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => playAudio(btn.dataset.play, btn));
  });
}

function updateAssetLoopType(sdefPath, type) {
  const state = getState();
  const asset = state.selectedAssets[sdefPath];
  if (!asset) return;

  let params = {};
  if (asset.sdefContent) {
    params = parseSdef(asset.sdefContent);
  } else {
    const soundType = detectSoundType(sdefPath);
    params = getTypeDefaults(soundType);
  }

  // Update params based on type
  if (type === 'one-shot') {
    params.detached = true;
    // Optionally ensure listmode is RANDOM?
    // params.listmode = 'RANDOM'; 
  } else {
    params.detached = false;
    // params.listmode = 'ASR'; // Optional?
  }

  const newContent = generateSdef(params);
  setCurrentSdef(sdefPath); // Just to ensure state knows what we touched? Not needed really.
  // We need to set content
  setSdefContent(sdefPath, newContent);

  showToast(`Updated ${sdefPath} to ${type}`, 'success');
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
    }
    currentAudioSource = null;

    // If clicking same button, we are done
    if (btn.dataset.playing === 'true') return;
  }

  const file = getAudioFile(sdefPath);
  if (!file) return;

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  currentAudioSource = audio;
  btn._objectUrl = url;
  btn.innerHTML = getIcon('pause');
  btn.dataset.playing = 'true';

  audio.play();
  audio.onended = () => {
    btn.innerHTML = getIcon('play');
    btn.dataset.playing = 'false';
    URL.revokeObjectURL(url);
    btn._objectUrl = null;
    currentAudioSource = null;
    renderIcons(btn);
  };
  renderIcons(btn);
}
