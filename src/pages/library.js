/**
 * library.js — Assets Library page
 * Full folder-tree navigation, notes, audio upload per asset
 */

import {
  getState, isAssetSelected, toggleAsset, selectAsset, deselectAsset,
  setLibraryData, setAudioFile, getAudioFile, removeAudioFile,
  setAssetNote, getAssetNote, loadLibraryFromStorage, saveLibraryToStorage
} from '../state/store.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';
import { parseSdefList } from '../data/sdef-parser.js';
import { showToast } from '../components/toast.js';
import { guessLoopType, detectSoundType, SOUND_TYPES } from '../utils/audio-analyzer.js';
import { pickTextFile } from '../utils/file-picker.js';

let allAssets = [];
// currentPath is an array of folder segments (e.g. ['Aircrafts', 'AH-64D'])
let currentPath = [];
let searchQuery = '';
// categoryTree usage removed
let folderTree = {};        // Deep folder tree built from full sdef paths
let filteredAssetsCache = [];

// Virtual scroll
const ROW_HEIGHT = 48;
const BUFFER_ROWS = 20;
let listContainer = null;

// Detail panel state
let selectedDetailAsset = null;

export async function renderLibrary(container) {
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:16px;">
      <h1 class="page-title" data-i18n="library.title">Assets Library</h1>
      <p class="page-description" data-i18n="library.description">Browse DCS sound assets. Navigate folders, upload audio replacements, and annotate SDEF/WAV files.</p>
    </div>
    <div id="library-stats" class="stats-bar"></div>
    <div class="flex-between" style="margin-bottom: 10px; gap: 12px;">
      <div class="search-container" style="flex: 1;">
        <span class="search-icon">${getIcon('search', '')}</span>
        <input type="text" class="search-input" id="library-search" data-i18n="library.searchPlaceholder" placeholder="Search SDEF path, wave path..." />
      </div>
      <div class="flex-gap">
        <button class="btn btn-secondary btn-sm" id="select-filtered-btn" data-i18n="library.selectAll">Select All Visible</button>
        <button class="btn btn-danger btn-sm" id="deselect-all-btn" data-i18n="library.clearSelection">Clear Selection</button>
        <button class="btn btn-secondary btn-sm" id="reload-library-btn">${getIcon('refresh-cw', 'icon-sm')} <span data-i18n="library.reload">Reload</span></button>
      </div>
    </div>
    <div id="library-breadcrumb" class="library-breadcrumb"></div>
    <div class="library-layout-3col">
      <!-- Left: Folder Tree -->
      <div class="folder-tree-panel" id="folder-tree"></div>
      <!-- Center: Asset list -->
      <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; min-width:0;">
        <div class="asset-row asset-row-header">
          <div>${getIcon('check')}</div>
          <div data-i18n="library.sdefFile">SDEF / File</div>
          <div data-i18n="library.waves">Wave(s)</div>
          <div data-i18n="library.type">Type</div>
          <div data-i18n="library.loop">Loop</div>
          <div data-i18n="library.note">Note</div>
        </div>
        <div id="asset-list" class="asset-list-container" style="flex:1; position:relative;"></div>
      </div>
      <!-- Right: Detail panel -->
      <div class="detail-panel" id="detail-panel">
        <div class="detail-empty">
          <div style="font-size:32px; margin-bottom:10px;">${getIcon('folder-open', 'icon-xl')}</div>
          <div style="color:var(--text-muted); font-size:13px;" data-i18n="library.emptyDetail">Click on an asset row to see details, add notes, and upload audio.</div>
        </div>
      </div>
    </div>
  `;

  // Load data
  const state = getState();
  if (!state.libraryData) {
    await loadLibraryData();
  } else {
    allAssets = state.libraryData.sections.flatMap(s => s.assets);
    // categoryTree = buildCategoryTree(allAssets);
    folderTree = buildFolderTree(allAssets);
  }

  renderStats();
  renderFolderTree();
  applyFilter();

  // Search
  document.getElementById('library-search').addEventListener('input', debounce(e => {
    searchQuery = e.target.value;
    applyFilter();
  }, 200));

  document.getElementById('select-filtered-btn').addEventListener('click', selectAllVisible);
  document.getElementById('deselect-all-btn').addEventListener('click', deselectAll);
  document.getElementById('reload-library-btn').addEventListener('click', reloadLibrary);

  listContainer = document.getElementById('asset-list');
  listContainer.addEventListener('scroll', () => renderVirtualList());

  updateTranslations();
}

// ───────────────────────────────────────────────
// DATA LOADING
// ───────────────────────────────────────────────

async function loadLibraryData() {
  try {
    // Try IDB first
    const cached = await loadLibraryFromStorage();
    if (cached) {
      allAssets = cached.sections.flatMap(s => s.assets);
      folderTree = buildFolderTree(allAssets);
      showToast(`Restored ${allAssets.length} assets from storage`, 'success');
      return;
    }

    // Fallback to fetch
    const resp = await fetch('./sdef_and_wave_list.txt');
    const text = await resp.text();
    const data = parseSdefList(text);

    setLibraryData(data);
    await saveLibraryToStorage(data);

    allAssets = data.sections.flatMap(s => s.assets);
    folderTree = buildFolderTree(allAssets);
    showToast(`Loaded ${allAssets.length} assets`, 'success');
  } catch (e) {
    showToast('Failed to load asset library: ' + e.message, 'error');
  } finally {
    renderIcons(document.getElementById('page-container'));
    updateTranslations();
  }
}

async function reloadLibrary() {
  try {
    const file = await pickTextFile();
    const text = await file.text();
    const data = parseSdefList(text);

    setLibraryData(data);
    await saveLibraryToStorage(data); // persist user file

    allAssets = data.sections.flatMap(s => s.assets);
    folderTree = buildFolderTree(allAssets);
    currentPath = [];
    renderFolderTree();
    applyFilter();
    renderStats();
    showToast(`Reloaded: ${allAssets.length} assets`, 'success');
    renderIcons(document.getElementById('page-container'));
    updateTranslations();
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to reload: ' + e.message, 'error');
    }
  }
}

// ───────────────────────────────────────────────
// FOLDER TREE (deep, recursive)
// ───────────────────────────────────────────────

/**
 * Build a deep folder tree from sdef paths.
 * Each node: { _files: [...assets], [subfolder]: node }
 */
function buildFolderTree(assets) {
  const root = {};
  for (const asset of assets) {
    // Use displaySection as a top-level if it's a mod asset, else parse the path
    let pathStr = asset.sdefPath;
    if (asset.displaySection) {
      // Prefix with the mod/section name so they appear under a module folder
      pathStr = asset.displaySection + '/' + pathStr;
    }
    const parts = pathStr.replace(/\.sdef$/i, '').split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!node[seg]) node[seg] = { _files: [] };
      node = node[seg];
    }
    if (!node._files) node._files = [];
    node._files.push(asset);
  }
  return root;
}

/** Get the node at `currentPath` */
function getNodeAtPath(path) {
  let node = folderTree;
  for (const seg of path) {
    if (node[seg]) node = node[seg];
    else return null;
  }
  return node;
}

/** Collect all assets recursively under a node */
function collectAssets(node) {
  if (!node) return [];
  const result = [...(node._files || [])];
  for (const key of Object.keys(node)) {
    if (key === '_files') continue;
    result.push(...collectAssets(node[key]));
  }
  return result;
}

/** Count all assets under a node */
function countAssets(node) {
  return collectAssets(node).length;
}

function renderFolderTree() {
  const treeEl = document.getElementById('folder-tree');
  if (!treeEl) return;

  // Always show the full tree (collapsed) with the current path open
  let html = '';

  // "All Assets" root entry
  const isRoot = currentPath.length === 0;
  html += `
    <div class="folder-item ${isRoot ? 'active' : ''}" data-path="">
      <span class="folder-icon">${getIcon('package')}</span>
      <span class="folder-label" data-i18n="library.allAssets">All Assets</span>
      <span class="folder-count">${allAssets.length}</span>
    </div>
  `;

  // Render tree recursively
  html += renderTreeNode(folderTree, [], 0);

  treeEl.innerHTML = html;
  renderIcons(treeEl);
  updateTranslations();

  // Click handlers
  treeEl.querySelectorAll('[data-path]').forEach(el => {
    el.addEventListener('click', () => {
      const pathStr = el.dataset.path;
      const pathArr = pathStr ? pathStr.split('/') : [];

      // Toggle logic: if clicking current folder, go up one level
      if (currentPath.join('/') === pathStr) {
        currentPath.pop();
      } else {
        currentPath = pathArr;
      }

      renderFolderTree();
      applyFilter();
      renderBreadcrumb();
    });
  });
}

function renderTreeNode(node, parentPath, depth) {
  let html = '';
  const keys = Object.keys(node).filter(k => k !== '_files').sort();

  for (const key of keys) {
    const child = node[key];
    const childPath = [...parentPath, key];
    const pathStr = childPath.join('/');
    const isActive = currentPath.join('/') === pathStr;
    const isOpen = currentPath.slice(0, childPath.length).join('/') === pathStr ||
      currentPath.join('/').startsWith(pathStr + '/');
    const count = countAssets(child);
    const hasSubfolders = Object.keys(child).some(k => k !== '_files');
    const indent = depth * 14;

    html += `
      <div class="folder-item ${isActive ? 'active' : ''}" data-path="${pathStr}" style="padding-left:${12 + indent}px;">
        <span class="folder-toggle ${isOpen && hasSubfolders ? 'open' : ''}">${hasSubfolders ? getIcon('chevron-right', 'w-4 h-4') : '<span style="width:10px;display:inline-block"></span>'}</span>
        <span class="folder-icon">${hasSubfolders ? (isOpen ? getIcon('folder-open') : getIcon('folder')) : getIcon('music')}</span>
        <span class="folder-label">${key}</span>
        <span class="folder-count">${count}</span>
      </div>
    `;

    // Render children if this path is in the current path ancestry
    if (isOpen && hasSubfolders) {
      html += renderTreeNode(child, childPath, depth + 1);
    }
  }
  return html;
}

// ───────────────────────────────────────────────
// BREADCRUMB
// ───────────────────────────────────────────────

function renderBreadcrumb() {
  const bcEl = document.getElementById('library-breadcrumb');
  if (!bcEl) return;

  if (currentPath.length === 0 && !searchQuery) {
    bcEl.innerHTML = '';
    return;
  }

  const crumbs = [{ label: getIcon('package') + ' ' + t('library.allAssets'), path: [] }];
  for (let i = 0; i < currentPath.length; i++) {
    crumbs.push({ label: currentPath[i], path: currentPath.slice(0, i + 1) });
  }

  const count = filteredAssetsCache.length;

  bcEl.innerHTML = `
    <nav class="breadcrumb-nav" aria-label="Folder navigation">
      <ol class="breadcrumb-list">
        ${crumbs.map((c, i) => {
    const isLast = i === crumbs.length - 1;
    return `
            <li class="breadcrumb-item">
              ${isLast
        ? `<span class="breadcrumb-current">${c.label}</span>`
        : `<button class="breadcrumb-link" data-bpath="${c.path.join('/')}">${c.label}</button>`
      }
              ${!isLast ? '<span class="breadcrumb-sep">›</span>' : ''}
            </li>`;
  }).join('')}
      </ol>
      <span class="breadcrumb-count">${count.toLocaleString()} asset${count !== 1 ? 's' : ''}</span>
    </nav>
  `;

  bcEl.querySelectorAll('.breadcrumb-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.bpath;
      currentPath = p ? p.split('/') : [];
      renderFolderTree();
      applyFilter();
      renderBreadcrumb();
    });
  });
}

// ───────────────────────────────────────────────
// STATS
// ───────────────────────────────────────────────

function renderStats() {
  const statsEl = document.getElementById('library-stats');
  if (!statsEl) return;

  const selected = Object.keys(getState().selectedAssets).length;
  const topFolders = Object.keys(folderTree).filter(k => k !== '_files').length;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${allAssets.length.toLocaleString()}</div>
      <div class="stat-label" data-i18n="library.totalAssets">Total Assets</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${topFolders}</div>
      <div class="stat-label" data-i18n="library.modules">Modules</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="filtered-count">${allAssets.length.toLocaleString()}</div>
      <div class="stat-label" data-i18n="library.showing">Showing</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: var(--accent-blue);" id="selected-count">${selected}</div>
      <div class="stat-label" data-i18n="library.selected">Selected</div>
    </div>
  `;
  updateTranslations();
}

// ───────────────────────────────────────────────
// FILTER + VIRTUAL LIST
// ───────────────────────────────────────────────

function applyFilter() {
  // Collect assets from current folder
  let base;
  if (currentPath.length === 0) {
    base = allAssets;
  } else {
    const node = getNodeAtPath(currentPath);
    base = node ? collectAssets(node) : [];
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    base = base.filter(a =>
      a.sdefPath.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.waves.some(w => w.toLowerCase().includes(q))
    );
  }

  filteredAssetsCache = base;

  const filteredEl = document.getElementById('filtered-count');
  if (filteredEl) filteredEl.textContent = filteredAssetsCache.length.toLocaleString();

  renderBreadcrumb();
  renderVirtualList(true);
}

function renderVirtualList(reset = false) {
  if (!listContainer) return;
  if (reset) listContainer.scrollTop = 0;

  const totalHeight = filteredAssetsCache.length * ROW_HEIGHT;
  const scrollTop = listContainer.scrollTop;
  const viewHeight = listContainer.clientHeight;

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIdx = Math.min(filteredAssetsCache.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER_ROWS);

  let html = `<div style="height:${totalHeight}px; position:relative;">`;

  for (let i = startIdx; i < endIdx; i++) {
    const asset = filteredAssetsCache[i];
    const selected = isAssetSelected(asset.sdefPath);
    const soundType = detectSoundType(asset.sdefPath);
    const typeInfo = SOUND_TYPES[soundType] || SOUND_TYPES.generic;
    const loopType = guessLoopType(asset.sdefPath);
    const loopTag = loopType === 'loop'
      ? '<span class="tag tag-blue">loop</span>'
      : loopType === 'one-shot'
        ? '<span class="tag tag-amber">one-shot</span>'
        : '';

    const note = getAssetNote(asset.sdefPath);
    const hasAudio = !!getAudioFile(asset.sdefPath);
    const isActive = selectedDetailAsset?.sdefPath === asset.sdefPath;

    const audioIndicator = hasAudio
      ? `<span class="asset-audio-dot" title="Audio uploaded">${getIcon('music', 'w-3 h-3')}</span>`
      : '';
    const noteSnippet = note
      ? `<span class="asset-note-snippet" title="${note.replace(/"/g, '&quot;')}">${note.slice(0, 30)}${note.length > 30 ? '…' : ''}</span>`
      : '<span style="color:var(--text-muted);font-size:11px;">—</span>';

    html += `
      <div class="asset-row ${selected ? 'selected' : ''} ${isActive ? 'detail-active' : ''}"
           data-idx="${i}"
           style="position:absolute; top:${i * ROW_HEIGHT}px; width:100%; height:${ROW_HEIGHT}px; cursor:pointer;">
        <div onclick="event.stopPropagation()">
          <label class="checkbox-wrapper">
            <input type="checkbox" ${selected ? 'checked' : ''} data-sdef="${asset.sdefPath}" />
          </label>
        </div>
        <div class="asset-sdef-path truncate" title="${asset.sdefPath}">
          ${audioIndicator}${asset.sdefPath}
        </div>
        <div class="asset-wave-paths truncate" title="${asset.waves.join(', ')}">
          ${asset.waves.join(', ') || '—'}
        </div>
        <div>
          <span class="tag" title="${typeInfo.description}" style="font-size:10px;">${typeInfo.icon} ${typeInfo.label}</span>
        </div>
        <div>${loopTag}</div>
        <div>${noteSnippet}</div>
      </div>
    `;
  }

  html += '</div>';
  listContainer.innerHTML = html;
  renderIcons(listContainer);

  // Checkbox handlers
  listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const sdefPath = e.target.dataset.sdef;
      const asset = filteredAssetsCache.find(a => a.sdefPath === sdefPath);
      if (asset) {
        // Toggle selection logic is handled by store helpers usually, but here we call toggleAsset
        toggleAsset(sdefPath, asset);
        updateSelectedCount();
        const row = e.target.closest('.asset-row');
        if (row) {
          row.classList.toggle('selected', isAssetSelected(sdefPath));
          // Also open details when checking
          openDetailPanel(asset);
        }
      }
    });
  });

  // Row click → Select AND open detail panel
  listContainer.querySelectorAll('.asset-row').forEach(row => {
    row.addEventListener('click', e => {
      // If clicked on checkbox/label, let the change event handle it
      if (e.target.closest('input[type="checkbox"]') || e.target.closest('label')) return;

      const idx = parseInt(row.dataset.idx);
      const asset = filteredAssetsCache[idx];
      if (asset) {
        // Toggle selection
        const wasSelected = isAssetSelected(asset.sdefPath);
        if (wasSelected) {
          deselectAsset(asset.sdefPath);
        } else {
          selectAsset(asset.sdefPath, asset);
        }
        updateSelectedCount();

        // Update UI
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = !wasSelected;
        row.classList.toggle('selected', !wasSelected);

        openDetailPanel(asset);
      }
    });
  });
}

// ───────────────────────────────────────────────
// DETAIL PANEL
// ───────────────────────────────────────────────

function openDetailPanel(asset) {
  selectedDetailAsset = asset;
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  // Mark active row
  document.querySelectorAll('.asset-row.detail-active').forEach(r => r.classList.remove('detail-active'));
  // Update virtual list highlight
  renderVirtualList();

  const state = getState();
  const assetState = state.selectedAssets[asset.sdefPath];
  const sdefNote = getAssetNote(asset.sdefPath);
  const hasAudio = !!getAudioFile(asset.sdefPath);
  const audioFileName = assetState?.audioFileName || null;
  const isSelected = isAssetSelected(asset.sdefPath);

  const waveRows = asset.waves.map((w, wi) => {
    const wNote = getAssetNote(`wave::${w}`);
    return `
      <div class="wave-entry" data-wi="${wi}">
        <div class="wave-path-label" title="${w}">
          <span class="wave-path-icon">${getIcon('volume-2')}</span>
          <code class="wave-path-text">${w}</code>
        </div>
        <div class="wave-note-row">
          <textarea
            class="wave-note-input input-field"
            data-wave="${w}"
            placeholder="${t('library.waveNotePlaceholder') || 'Note about this wave file…'}"
            rows="2"
          >${wNote}</textarea>
          <div class="wave-audio-upload">
            <label class="btn btn-secondary btn-sm wave-audio-label" title="${t('library.uploadWaveReplacement')}">
              ${getIcon('upload', 'w-3 h-3')} ${t('library.uploadWav')}
              <input type="file" accept=".wav,.ogg,.mp3" class="hidden" data-wave-upload="${w}" />
            </label>
            <span class="wave-audio-name" id="wave-audio-${wi}">
              ${getWaveAudioFileName(asset.sdefPath, w) || ''}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    <div class="detail-header">
      <div class="detail-sdef-name truncate" title="${asset.sdefPath}">${asset.name}</div>
      <div class="detail-sdef-path truncate" title="${asset.sdefPath}">${asset.sdefPath}</div>
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn btn-${isSelected ? 'danger' : 'primary'} btn-sm" id="detail-toggle-btn">
          ${isSelected ? getIcon('x', 'w-3 h-3') + ' ' + t('library.deselect') : getIcon('plus', 'w-3 h-3') + ' ' + t('library.select')}
        </button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer;" id="detail-audio-label-wrap">
          ${getIcon('music', 'w-4 h-4')} ${hasAudio ? t('library.replaceAudio') : t('library.uploadAudio')}
          <input type="file" accept=".wav,.ogg,.mp3" class="hidden" id="detail-audio-input" />
        </label>
        ${hasAudio ? `<button class="btn btn-danger btn-sm" id="detail-audio-remove">${getIcon('trash-2', 'w-3 h-3')} ${t('library.remove')}</button>` : ''}
      </div>
      ${audioFileName ? `<div class="detail-audio-info">${getIcon('paperclip', 'w-3 h-3')} ${audioFileName}</div>` : ''}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">${getIcon('file-text', 'w-4 h-4')} ${t('library.sdefNote')}</div>
      <textarea class="input-field" id="detail-sdef-note" rows="3" placeholder="${t('library.sdefNotePlaceholder')}">${sdefNote}</textarea>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">${getIcon('volume-2', 'w-4 h-4')} ${t('library.waveFiles')} (${asset.waves.length})</div>
      ${asset.waves.length === 0
      ? '<div class="detail-empty-sub">' + t('library.noWavePaths') + '</div>'
      : waveRows
    }
    </div>
  `;
  renderIcons(panel);
  updateTranslations();

  // Select/Deselect toggle
  panel.querySelector('#detail-toggle-btn').addEventListener('click', () => {
    if (isAssetSelected(asset.sdefPath)) {
      deselectAsset(asset.sdefPath);
    } else {
      selectAsset(asset.sdefPath, asset);
    }
    updateSelectedCount();
    openDetailPanel(asset); // Re-render
    renderVirtualList();
  });

  // Audio upload
  panel.querySelector('#detail-audio-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAssetSelected(asset.sdefPath)) {
      selectAsset(asset.sdefPath, asset); // Auto-select when uploading
    }
    setAudioFile(asset.sdefPath, file, { name: file.name, size: file.size });
    showToast(`Audio uploaded: ${file.name}`, 'success');
    openDetailPanel(asset);
    renderVirtualList();
  });

  // Audio remove
  panel.querySelector('#detail-audio-remove')?.addEventListener('click', () => {
    removeAudioFile(asset.sdefPath);
    showToast('Audio removed', 'info');
    openDetailPanel(asset);
    renderVirtualList();
  });

  // SDEF note save (debounced)
  const sdefNoteInput = panel.querySelector('#detail-sdef-note');
  sdefNoteInput.addEventListener('input', debounce(() => {
    setAssetNote(asset.sdefPath, sdefNoteInput.value);
    renderVirtualList(); // update note snippet in list
  }, 500));

  // Wave notes
  panel.querySelectorAll('textarea[data-wave]').forEach(ta => {
    ta.addEventListener('input', debounce(() => {
      setAssetNote(`wave::${ta.dataset.wave}`, ta.value);
    }, 500));
  });

  // Wave audio uploads
  panel.querySelectorAll('input[data-wave-upload]').forEach(inp => {
    inp.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const wavePath = inp.dataset.waveUpload;
      // Store wave-specific audio
      if (!isAssetSelected(asset.sdefPath)) selectAsset(asset.sdefPath, asset);
      setWaveAudioFile(asset.sdefPath, wavePath, file);
      const wi = inp.closest('[data-wi]')?.dataset.wi;
      const nameEl = panel.querySelector(`#wave-audio-${wi}`);
      if (nameEl) nameEl.textContent = file.name;
      showToast(`Wave audio uploaded: ${file.name}`, 'success');
    });
  });
}

// Wave-audio helpers (per wave path, stored as waveAudios map)
const waveAudioFiles = new Map(); // `sdef::wave` → File

function setWaveAudioFile(sdefPath, wavePath, file) {
  waveAudioFiles.set(`${sdefPath}::${wavePath}`, file);
}

function getWaveAudioFileName(sdefPath, wavePath) {
  const f = waveAudioFiles.get(`${sdefPath}::${wavePath}`);
  return f ? f.name : null;
}

// ───────────────────────────────────────────────
// SELECTION HELPERS
// ───────────────────────────────────────────────

function updateSelectedCount() {
  const el = document.getElementById('selected-count');
  if (el) el.textContent = Object.keys(getState().selectedAssets).length;
}

function selectAllVisible() {
  for (const asset of filteredAssetsCache) {
    if (!isAssetSelected(asset.sdefPath)) {
      selectAsset(asset.sdefPath, asset);
    }
  }
  renderVirtualList();
  updateSelectedCount();
  showToast(`Selected ${filteredAssetsCache.length} assets`, 'success');
}

function deselectAll() {
  const state = getState();
  for (const key of Object.keys(state.selectedAssets)) {
    deselectAsset(key);
  }
  renderVirtualList();
  updateSelectedCount();
  showToast('Selection cleared', 'info');
}

// ───────────────────────────────────────────────
// UTILS
// ───────────────────────────────────────────────

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
