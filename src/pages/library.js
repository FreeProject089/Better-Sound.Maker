/**
 * library.js — Assets Library page
 * Full folder-tree navigation, notes, audio upload per asset
 */

import {
  getState, isAssetSelected, toggleAsset, selectAsset, deselectAsset,
  setLibraryData, setAudioFile, getAudioFile, removeAudioFile,
  setAssetNote, getAssetNote, loadLibraryFromStorage, saveLibraryToStorage,
  setWaveAudioFile, getWaveAudioFile, setGlobalSettings
} from '../state/store.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';
import { parseSdefList } from '../data/sdef-parser.js';
import { showToast } from '../components/toast.js';
import { guessLoopType, detectSoundType, SOUND_TYPES, analyzeAudioFile, ensureRulesLoaded, getTypeIconHtml } from '../utils/audio-analyzer.js';
import { pickTextFile, pickJsonFile } from '../utils/file-picker.js';
import { showModal } from '../components/modal.js';

let allAssets = [];
// currentPath is an array of folder segments (e.g. ['Aircrafts', 'AH-64D'])
let currentPath = [];
let searchQuery = '';
// categoryTree usage removed
let folderTree = {};        // Deep folder tree built from full sdef paths
let filteredAssetsCache = [];
let showFilters = false;
let activeFilters = {
  hasNotes: false,
  hasAudio: false,
  soundTypes: new Set() // Set of sound type IDs
};

// Virtual scroll
const ROW_HEIGHT = 48;
const BUFFER_ROWS = 20;
let listContainer = null;

// Detail panel state
let selectedDetailAsset = null;

export async function renderLibrary(container) {
  await ensureRulesLoaded();
  container.innerHTML = `
    <div class="page-header" style="margin-bottom:16px;">
      <h1 class="page-title" data-i18n="library.title">Assets Library</h1>
      <p class="page-description" data-i18n="library.description">Browse DCS sound assets. Navigate folders, upload audio replacements, and annotate SDEF/WAV files.</p>
    </div>
    <div id="library-stats" class="stats-bar"></div>
    <div class="flex-between" style="margin-bottom: 10px; gap: 12px; align-items: stretch;">
      <div class="search-container" style="max-width: 600px; flex: 1; position: relative; margin-bottom: 0;">
        <span class="search-icon">${getIcon('search', '')}</span>
        <input type="text" class="search-input" id="library-search" data-i18n="library.searchPlaceholder" placeholder="${t('library.searchPlaceholder')}" />
      </div>
      
      <div style="position: relative; display: flex;">
        <button class="btn btn-secondary btn-sm" id="toggle-filters-btn" style="height: 42px; border-radius: 8px; gap: 8px; padding: 0 16px;">
          ${getIcon('filter', 'w-4 h-4')}
          <span data-i18n="library.filters">${t('library.filters')}</span>
          ${activeFilters.soundTypes.size + (activeFilters.hasNotes ? 1 : 0) + (activeFilters.hasAudio ? 1 : 0) > 0 ? `<span class="badge" style="background: var(--accent-blue); color: white; border-radius: 99px; padding: 1px 6px; font-size: 10px;">${activeFilters.soundTypes.size + (activeFilters.hasNotes ? 1 : 0) + (activeFilters.hasAudio ? 1 : 0)}</span>` : ''}
          ${getIcon(showFilters ? 'chevron-up' : 'chevron-down', 'w-3 h-3')}
        </button>

        ${showFilters ? `
        <div class="filter-dropdown" style="position: absolute; top: calc(100% + 8px); right: 0; width: 320px; background: var(--bg-secondary); border: 1px solid var(--accent-blue); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); z-index: 1000; padding: 0; animation: fadeIn 0.2s ease; overflow: hidden;">
          <div style="padding: 16px; background: rgba(59, 130, 246, 0.05); border-bottom: 1px solid var(--border-subtle);">
            <div style="font-size: 11px; font-weight: 700; color: var(--accent-blue); text-transform: uppercase; letter-spacing: 1px;" data-i18n="library.advancedFilters">${t('library.advancedFilters')}</div>
            <p style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Filtrez par statut ou par type de son pour trouver rapidement vos assets.</p>
          </div>
          
          <div style="padding: 16px; max-height: 400px; overflow-y: auto;">
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 10px; color: var(--text-primary);" data-i18n="library.assetStatus">${t('library.assetStatus')}</div>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
              <label class="filter-checkbox-row" style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px 0;">
                <input type="checkbox" id="filter-has-notes" ${activeFilters.hasNotes ? 'checked' : ''} />
                <span style="font-size: 13px;" data-i18n="library.hasNotes">${t('library.hasNotes')}</span>
              </label>
              <label class="filter-checkbox-row" style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px 0;">
                <input type="checkbox" id="filter-has-audio" ${activeFilters.hasAudio ? 'checked' : ''} />
                <span style="font-size: 13px;" data-i18n="library.hasAudio">${t('library.hasAudio')}</span>
              </label>
            </div>
            
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 10px; color: var(--text-primary); border-top: 1px solid var(--border-subtle); padding-top: 16px;" data-i18n="library.filterByType">${t('library.filterByType')}</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${Object.entries(SOUND_TYPES).map(([id, meta]) => `
              <label class="filter-checkbox-row" style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.2s;">
                <input type="checkbox" class="filter-sound-type-check" data-type-id="${id}" ${activeFilters.soundTypes.has(id) ? 'checked' : ''} />
                <span style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                  <span style="color: ${meta.color || 'var(--text-muted)'}; display: flex;">${getTypeIconHtml(meta, 'w-4 h-4')}</span>
                  ${meta.label}
                </span>
              </label>
              `).join('')}
            </div>
          </div>
          
          <div style="padding: 12px 16px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
             <button class="btn btn-secondary btn-xs" id="reset-filters-btn" data-i18n="library.clear">${t('library.clear')}</button>
             <span style="font-size: 11px; color: var(--text-muted);">${filteredAssetsCache.length} trouvé(s)</span>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="flex-gap" style="margin-left: auto;">
        <button class="btn btn-secondary btn-sm" id="select-filtered-btn" data-i18n="library.selectAll" style="height: 42px;">Select All Visible</button>
        <button class="btn btn-danger btn-sm" id="deselect-all-btn" data-i18n="library.clearSelection" style="height: 42px;">Clear Selection</button>
        <button class="btn btn-secondary btn-sm" id="import-btn" title="Import Data" style="height: 42px;">${getIcon('download', 'icon-sm')} Import</button>
        <button class="btn btn-secondary btn-sm" id="reload-library-btn" style="height: 42px;">${getIcon('refresh-cw', 'icon-sm')} <span data-i18n="library.reload">Reload</span></button>
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
          <div>Note</div>
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

  listContainer = document.getElementById('asset-list');
  if (listContainer) {
    listContainer.addEventListener('scroll', () => renderVirtualList());
  }

  // Restore search query if one was persisted
  const searchInput = document.getElementById('library-search');
  if (searchInput) {
    searchInput.value = searchQuery || '';

    // Search listener
    searchInput.addEventListener('input', debounce(e => {
      searchQuery = e.target.value;
      applyFilter();
    }, 200));
  }

  applyFilter();

  document.getElementById('select-filtered-btn').addEventListener('click', selectAllVisible);
  document.getElementById('deselect-all-btn').addEventListener('click', deselectAll);
  document.getElementById('import-btn')?.addEventListener('click', handleImportClick);
  document.getElementById('export-library-btn')?.addEventListener('click', exportLibrary);
  document.getElementById('reload-library-btn').addEventListener('click', () => openScannerModal(false));

  renderIcons(container);
  updateTranslations();

  // Filter handlers
  container.querySelector('#toggle-filters-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showFilters = !showFilters;
    renderLibrary(container);
  });

  if (showFilters) {
    const handleOutsideClick = (e) => {
      const dropdown = container.querySelector('.filter-dropdown');
      const toggleBtn = container.querySelector('#toggle-filters-btn');
      if (dropdown && !dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        showFilters = false;
        renderLibrary(container);
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    document.addEventListener('click', handleOutsideClick);
  }

  container.querySelector('#filter-has-notes')?.addEventListener('change', (e) => {
    activeFilters.hasNotes = e.target.checked;
    applyFilter();
  });

  container.querySelector('#filter-has-audio')?.addEventListener('change', (e) => {
    activeFilters.hasAudio = e.target.checked;
    applyFilter();
  });

  container.querySelectorAll('.filter-sound-type-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const typeId = chk.dataset.typeId;
      if (chk.checked) activeFilters.soundTypes.add(typeId);
      else activeFilters.soundTypes.delete(typeId);
      applyFilter();
    });
  });

  container.querySelector('#reset-filters-btn')?.addEventListener('click', () => {
    activeFilters = { hasNotes: false, hasAudio: false, soundTypes: new Set() };
    renderLibrary(container);
  });
}

// ───────────────────────────────────────────────
// DATA LOADING
// ───────────────────────────────────────────────

async function loadLibraryData() {
  const loaderSub = document.getElementById('loader-subtext');
  try {
    if (loaderSub) loaderSub.textContent = t('library.restoringCache') || "Checking local storage cache...";
    // Try IDB first
    const cached = await loadLibraryFromStorage();
    if (cached) {
      if (loaderSub) loaderSub.textContent = t('library.buildingInterface') || "Cache found! Building interface...";
      // Allow DOM to paint progress text
      await new Promise(r => setTimeout(r, 10));
      allAssets = cached.sections.flatMap(s => s.assets);
      folderTree = buildFolderTree(allAssets);
      showToast(t('library.restoredAssets', { count: allAssets.length }) || `Restored ${allAssets.length} assets from storage`, 'success');
      return;
    }

    const state = getState();
    // First launch detection
    if (!state.globalSettings.dcsPath) {
      // Hide global loader so user can see and interact with the modal
      const loader = document.getElementById('global-loader');
      if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }
      await openScannerModal(true);
      return;
    }

    await loadLibraryFallback();
  } catch (e) {
    showToast('Failed to load asset library: ' + e.message, 'error');
  } finally {
    renderIcons(document.getElementById('page-container'));
    updateTranslations();
  }
}

async function loadLibraryFallback() {
  const loaderSub = document.getElementById('loader-subtext');
  if (loaderSub) loaderSub.textContent = t('library.downloadingData') || "Downloading DCS Data...";
  // Fallback to fetch default (now from public folder) with cache busting
  const resp = await fetch(`./sdef_and_wave_list.txt?v=${Date.now()}`);
  const text = await resp.text();

  if (loaderSub) loaderSub.textContent = t('library.parsingData') || "Parsing database models... This may take a moment.";
  // Allow DOM to yield the heavy parsing to display text
  await new Promise(r => setTimeout(r, 20));

  const data = parseSdefList(text);

  setLibraryData(data);
  await saveLibraryToStorage(data);

  if (loaderSub) loaderSub.textContent = t('library.buildingFolders') || "Building folder structures...";
  await new Promise(r => setTimeout(r, 10));
  allAssets = data.sections.flatMap(s => s.assets);
  folderTree = buildFolderTree(allAssets);
  showToast(`Loaded ${allAssets.length} assets`, 'success');

  currentPath = [];
  renderFolderTree();
  applyFilter();
  renderStats();
}

async function reloadLibrary() {
  // Keep original manual reload logic if user wants to use manual file picker
  // But now this is secondary, the main reload button calls openScannerModal directly
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

function exportLibrary() {
  const data = getState().libraryData;
  if (!data) return;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assets_library_export.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Library exported successfully', 'success');
}

async function handleImportClick() {
  const action = await showModal({
    title: 'Import',
    content: '<p style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">What would you like to import?</p>',
    actions: [
      { id: 'import-mod', label: `${getIcon('folder-plus', 'w-4 h-4')} Import Mod (.zip)`, class: 'btn-primary' },
      { id: 'import-lib', label: `${getIcon('file-text', 'w-4 h-4')} Import Library (.json)`, class: 'btn-secondary' },
      { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' }
    ]
  });

  if (action === 'import-mod') {
    importModZips();
  } else if (action === 'import-lib') {
    importLibraryData();
  }
}

async function importLibraryData() {
  try {
    const file = await pickJsonFile();
    const text = await file.text();
    const data = JSON.parse(text);
    if (data && data.sections) {
      setLibraryData(data);
      await saveLibraryToStorage(data);
      allAssets = data.sections.flatMap(s => s.assets);
      folderTree = buildFolderTree(allAssets);
      currentPath = [];
      renderFolderTree();
      applyFilter();
      renderStats();
      showToast('Library data imported successfully', 'success');
      renderIcons(document.getElementById('page-container'));
      updateTranslations();
    } else {
      showToast('Invalid library data format', 'error');
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to import library: ' + e.message, 'error');
    }
  }
}

async function importModZips() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.zip';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast(`Extracting ${file.name}...`, 'info');
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      const sdefFiles = Object.keys(zip.files).filter(k => k.toLowerCase().endsWith('.sdef') && !zip.files[k].dir);

      const modSectionName = `Mod: ${file.name.replace('.zip', '')}`;
      let libraryData = getState().libraryData;
      if (!libraryData) {
        showToast('Library not loaded yet!', 'error');
        return;
      }

      let modSection = libraryData.sections.find(s => s.name === modSectionName);
      if (!modSection) {
        modSection = { name: modSectionName, assets: [] };
        libraryData.sections.push(modSection);
      }

      let importedCount = 0;
      for (const zPath of sdefFiles) {
        const content = await zip.files[zPath].async('string');
        const asset = parseSingleSdefFromMod(zPath, content, modSectionName);
        if (asset) {
          if (!modSection.assets.find(a => a.sdefPath === asset.sdefPath)) {
            modSection.assets.push(asset);
            importedCount++;
          }
        }
      }

      if (importedCount > 0) {
        await saveLibraryToStorage(libraryData);
        allAssets = libraryData.sections.flatMap(s => s.assets);
        folderTree = buildFolderTree(allAssets);
        currentPath = [];
        renderFolderTree();
        applyFilter();
        renderStats();
        showToast(`Imported ${importedCount} assets from Mod`, 'success');
      } else {
        showToast('No valid .sdef files found in this mod zip', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to import mod zip: ' + err.message, 'error');
    }
  };
  input.click();
}

function parseSingleSdefFromMod(zipPath, content, modSectionName) {
  const lines = content.split('\\n');
  const waves = [];

  for (const l of lines) {
    const line = l.trim();
    if (line.toLowerCase().startsWith('wave')) {
      const match = line.match(/"([^"]+)"/);
      if (match) waves.push(match[1].replace(/\\\\/g, '/'));
    }
  }

  let sPath = zipPath.replace(/\\\\/g, '/');
  if (sPath.toLowerCase().includes('sounds/sdef/')) {
    sPath = sPath.substring(sPath.toLowerCase().indexOf('sounds/sdef/') + 'sounds/sdef/'.length);
  }

  const asset = {
    sdefPath: sPath,
    name: sPath.split('/').pop(),
    waves: waves,
    treePath: sPath.replace(/\\.sdef$/i, ''),
    customSdefContent: content
  };

  if (asset.waves.length > 0) {
    const wPath = asset.waves[0];
    const wParts = wPath.split('/');
    if (wParts.length > 1) {
      wParts.pop();
      const sName = asset.name.replace(/\\.sdef$/i, '');
      asset.treePath = `[Mods]/${modSectionName}/${wParts.join('/')}/${sName}`;
    } else {
      asset.treePath = `[Mods]/${modSectionName}/${asset.treePath}`;
    }
  } else {
    asset.treePath = `[Mods]/${modSectionName}/${asset.treePath}`;
  }
  return asset;
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
    if (!asset) continue;
    let pathStr = asset.treePath || asset.sdefPath || 'Unknown';
    if (pathStr.includes('\\')) pathStr = pathStr.replace(/\\/g, '/');
    const parts = pathStr.split('/');

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

/** Count all assets under a node (memoized) */
function countAssets(node) {
  if (!node) return 0;
  if (node._count !== undefined) return node._count;

  let count = (node._files || []).length;
  for (const key of Object.keys(node)) {
    if (key === '_files' || key === '_count') continue;
    count += countAssets(node[key]);
  }

  node._count = count;
  return count;
}

function renderFolderTree() {
  const treeEl = document.getElementById('folder-tree');
  if (!treeEl) return;

  // Clear memoized counts to be safe on re-render (e.g. after selection changes if we used it, but here it's static)
  // For now, let's just render.

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
  // Keys that are subfolders (exclude internal props)
  const keys = Object.keys(node).filter(k => k !== '_files' && k !== '_count').sort();

  for (const key of keys) {
    const child = node[key];
    const childPath = [...parentPath, key];
    const pathStr = childPath.join('/');
    const isActive = currentPath.join('/') === pathStr;
    const isOpen = currentPath.slice(0, childPath.length).join('/') === pathStr ||
      currentPath.join('/').startsWith(pathStr + '/');
    const count = countAssets(child);
    const hasSubfolders = Object.keys(child).some(k => k !== '_files' && k !== '_count');
    const indent = depth * 14;

    html += `
      <div class="folder-item ${isActive ? 'active' : ''}" data-path="${pathStr}" style="padding-left:${12 + indent}px;">
        <span class="folder-toggle ${isOpen && hasSubfolders ? 'open' : ''}">
          ${hasSubfolders ? getIcon('chevron-right', 'w-4 h-4') : '<span style="width:14px;display:inline-block"></span>'}
        </span>
        <span class="folder-icon">${isOpen ? getIcon('folder-open') : getIcon('folder')}</span>
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
  let base = [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    base = allAssets.filter(a =>
      a.sdefPath.toLowerCase().includes(q) ||
      (a.treePath && a.treePath.toLowerCase().includes(q)) ||
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.waves && a.waves.some(w => w && w.toLowerCase().includes(q)))
    );
  } else {
    // Collect assets from current folder
    if (currentPath.length === 0) {
      base = allAssets;
    } else {
      const node = getNodeAtPath(currentPath);
      base = node ? collectAssets(node) : [];
    }
  }

  // Apply Advanced Filters
  if (activeFilters.hasNotes) {
    base = base.filter(a => getAssetNote(a.sdefPath) || (a.waves && a.waves.some(w => getAssetNote(`wave::${w}`))));
  }
  if (activeFilters.hasAudio) {
    const state = getState();
    base = base.filter(a => {
      const projAsset = state.selectedAssets[a.sdefPath];
      if (!projAsset) return false;
      // Must have a primary audio file OR at least one wave replacement
      const hasPrimary = !!projAsset.audioFileName;
      const hasWaves = projAsset.waveAudioFiles && Object.keys(projAsset.waveAudioFiles).length > 0;
      return hasPrimary || hasWaves;
    });
  }
  if (activeFilters.soundTypes.size > 0) {
    base = base.filter(a => activeFilters.soundTypes.has(detectSoundType(a.sdefPath)));
  }

  filteredAssetsCache = base;

  const filteredEl = document.getElementById('filtered-count');
  if (filteredEl) filteredEl.textContent = filteredAssetsCache.length.toLocaleString();

  renderBreadcrumb();
  renderVirtualList(true);
}

/**
 * Strip all known type labels from a note string.
 * Removes occurrences like "(Radio / Comm)", "(Engine)", etc. that already appear in the Type column.
 */
function stripTypeLabels(note) {
  if (!note || !SOUND_TYPES) return note;
  // Build list of labels to strip from note (case-insensitive)
  const labels = Object.values(SOUND_TYPES).map(t => t.label).filter(Boolean);
  if (labels.length === 0) return note;
  // Escape special characters for regex
  const escaped = labels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Remove labels in parens: "(Radio / Comm)" → ""
  const parenRegex = new RegExp(`\\s*\\(?\\s*(${escaped.join('|')})\\s*\\)?\\s*`, 'gi');
  let cleaned = note.replace(parenRegex, ' ').trim();
  // Remove leading/trailing dashes, colons, semicolons left behind
  cleaned = cleaned.replace(/^[\s\-:;,]+|[\s\-:;,]+$/g, '').trim();
  return cleaned;
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

    const rawNote = getAssetNote(asset.sdefPath);
    const hasAudio = !!getAudioFile(asset.sdefPath);
    const isActive = selectedDetailAsset?.sdefPath === asset.sdefPath;

    const audioIndicator = hasAudio
      ? `<span class="asset-audio-dot" title="Audio uploaded">${getIcon('music', 'w-3 h-3')}</span>`
      : '';
    const typeIconHtml = getTypeIconHtml(typeInfo, 'w-3 h-3');
    // Strip all type labels from note display (they're shown in the Type column)
    const note = rawNote ? stripTypeLabels(rawNote) : '';
    const NOTE_MAX = 10;
    const noteSnippet = note
      ? (note.length > NOTE_MAX
        ? `<div style="display:flex; justify-content:center; width:100%;"><button class="btn-expand-note" data-note="${note.replace(/"/g, '&quot;')}" onclick="event.stopPropagation()" title="View full note" style="background:var(--bg-tertiary); border:1px solid var(--accent-blue); color:var(--accent-blue); cursor:pointer; padding:4px; border-radius:6px; transition:all 0.2s; display:flex; align-items:center;">${getIcon('maximize', 'w-4 h-4')}</button></div>`
        : `<span class="asset-note-snippet" style="font-style:italic; opacity:0.8;" title="${note.replace(/"/g, '&quot;')}">${note}</span>`)
      : '<span style="color:var(--text-muted);font-size:11px; opacity:0.3;">—</span>';

    html += `
      <div class="asset-row ${selected ? 'selected' : ''} ${isActive ? 'detail-active' : ''}"
           data-idx="${i}"
           style="position:absolute; top:${i * ROW_HEIGHT}px; width:100%; height:${ROW_HEIGHT}px; cursor:pointer;">
        <div onclick="event.stopPropagation()">
          <label class="checkbox-wrapper">
            <input type="checkbox" ${selected ? 'checked' : ''} data-sdef="${asset.sdefPath}" />
          </label>
        </div>
        <div class="asset-sdef-path truncate" style="line-height: 1.2; display: flex; flex-direction: column; justify-content: center;" title="${asset.sdefPath}">
          <div style="font-weight: 600; font-size: 13px; color: var(--text-color);">${audioIndicator}${asset.name}</div>
          <div class="truncate" style="font-size: 10px; color: var(--text-muted); margin-top: 2px;" title="${asset.sdefPath}">${asset.sdefPath}</div>
        </div>
        <div class="asset-wave-paths truncate" title="${asset.waves.join(', ')}">
          ${asset.waves.join(', ') || '—'}
        </div>
        <div>
          <span class="tag" title="${typeInfo.description}" style="font-size:10px; display:inline-flex; align-items:center; gap:4px;">${typeIconHtml} ${typeInfo.label}</span>
        </div>
        <div>${loopTag}</div>
        <div>${noteSnippet}</div>
      </div>
    `;
  }

  html += '</div>';
  listContainer.innerHTML = html;
  renderIcons(listContainer);

  // Expand-note modal
  listContainer.querySelectorAll('.btn-expand-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { showModal } = await import('../components/modal.js');
      await showModal({
        title: 'Note',
        content: `<div style="white-space:pre-wrap; font-size:13px; color:var(--text-secondary); max-height:400px; overflow-y:auto; padding:4px 0;">${btn.dataset.note}</div>`,
        actions: [{ id: 'close', label: 'Close', class: 'btn-secondary' }]
      });
    });
  });

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
          <input type="file" accept=".wav,.ogg,.mp3" multiple class="hidden" id="detail-audio-input" />
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
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (!isAssetSelected(asset.sdefPath)) {
      selectAsset(asset.sdefPath, asset); // Auto-select when uploading
    }

    if (files.length > 1 && asset.waves.length > 1) {
      for (let i = 0; i < Math.min(files.length, asset.waves.length); i++) {
        try {
          const meta = await analyzeAudioFile(files[i]);
          await setWaveAudioFile(asset.sdefPath, asset.waves[i], files[i], meta);
        } catch (e) {
          console.warn('Failed to analyze audio', e);
        }
      }
      showToast(`Audio uploaded: ${Math.min(files.length, asset.waves.length)} files assigned to waves`, 'success');
    } else {
      const file = files[0];
      setAudioFile(asset.sdefPath, file, { name: file.name, size: file.size });
      showToast(`Audio uploaded: ${file.name}`, 'success');
    }
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
      setAssetNote(`wave:: ${ta.dataset.wave}`, ta.value);
    }, 500));
  });

  // Wave audio uploads
  panel.querySelectorAll('input[data-wave-upload]').forEach(inp => {
    inp.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const wavePath = inp.dataset.waveUpload;
      // Store wave-specific audio
      if (!isAssetSelected(asset.sdefPath)) selectAsset(asset.sdefPath, asset);
      try {
        const meta = await analyzeAudioFile(file);
        setWaveAudioFile(asset.sdefPath, wavePath, file, meta);
        openDetailPanel(asset); // Re-render panel completely to update names
        showToast(`Wave audio uploaded: ${file.name}`, 'success');
      } catch (err) {
        showToast(`Failed to analyze wave audio: ${err.message}`, 'error');
      }
    });
  });
}

function getWaveAudioFileName(sdefPath, wavePath) {
  const file = getWaveAudioFile(sdefPath, wavePath);
  return file ? file.name : null;
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

// ───────────────────────────────────────────────
// DCS SCANNER INTEGRATION
// ───────────────────────────────────────────────

async function openScannerModal(isFirstLaunch = false) {
  const { globalSettings } = getState();
  let dcsPath = globalSettings.dcsPath || '';
  let savedGamesPath = globalSettings.savedGamesPath || '';

  // Auto detect if empty
  if (!dcsPath && window.electronAPI) {
    const dcsDefault = 'C:/Program Files/Eagle Dynamics/DCS World';
    if (await window.electronAPI.exists(dcsDefault)) dcsPath = dcsDefault;
  }

  if (!savedGamesPath && window.electronAPI) {
    const home = await window.electronAPI.getUserHome();
    const sgDefault = home ? `${home}/Saved Games/DCS` : '';
    // Let's also check DCS.openbeta as a fallback if plain DCS isn't there, 
    // even though user said no more openbeta, it doesn't hurt to check if 'DCS' doesn't exist.
    if (sgDefault && await window.electronAPI.exists(sgDefault)) {
      savedGamesPath = sgDefault;
    }
  }

  const modalHtml = `
    <div style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">
      ${isFirstLaunch ? t('library.scanner.welcome') : t('library.scanner.rescan')}
      <br/><br/>
      <div style="color: var(--accent-amber); padding: 8px; background: rgba(255, 193, 7, 0.1); border-radius: 4px; display: flex; align-items: center; gap: 8px;">
        ${getIcon('alert-triangle', 'w-5 h-5')} <div><b>${t('library.scanner.recommendation')}:</b> ${t('library.scanner.recommendationText')}</div>
      </div>
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:5px; font-weight: 500;">${t('library.scanner.dcsLabel')}</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="scan-dcs-path" class="input-field" style="flex:1" value="${dcsPath}" placeholder="${t('library.scanner.dcsPlaceholder')}" />
        <button class="btn btn-secondary" id="browse-dcs-btn">${getIcon('folder')}</button>
      </div>
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:5px; font-weight: 500;">${t('library.scanner.sgLabel')}</label>
      <div style="display:flex; gap:8px;">
        <input type="text" id="scan-sg-path" class="input-field" style="flex:1" value="${savedGamesPath}" placeholder="${t('library.scanner.sgPlaceholder')}" />
        <button class="btn btn-secondary" id="browse-sg-btn">${getIcon('folder')}</button>
      </div>
    </div>
    <div style="margin-bottom: 15px; font-size: 12px; color: var(--text-muted);">
      <p>${t('library.scanner.desc')}</p>
    </div>
  `;

  let finalDcsPath = '';
  let finalSgPath = '';

  const action = await showModal({
    title: t('library.scanner.title'),
    content: modalHtml,
    actions: [
      { id: 'start-scan', label: t('library.scanner.start'), class: 'btn-primary' },
      { id: 'manual-load', label: t('library.scanner.manual'), class: 'btn-secondary', title: t('library.scanner.manualTip') },
      { id: 'cancel', label: t('library.scanner.cancel'), class: 'btn-secondary' }
    ],
    onRender: (modalEl) => {
      if (window.electronAPI) {
        modalEl.querySelector('#browse-dcs-btn').addEventListener('click', async () => {
          const res = await window.electronAPI.selectDirectory();
          if (res) modalEl.querySelector('#scan-dcs-path').value = res;
        });
        modalEl.querySelector('#browse-sg-btn').addEventListener('click', async () => {
          const res = await window.electronAPI.selectDirectory();
          if (res) modalEl.querySelector('#scan-sg-path').value = res;
        });
      }
    },
    onClose: (modalEl, act) => {
      if (act === 'start-scan') {
        const dcsInput = modalEl.querySelector('#scan-dcs-path');
        const sgInput = modalEl.querySelector('#scan-sg-path');
        if (dcsInput) finalDcsPath = dcsInput.value.trim();
        if (sgInput) finalSgPath = sgInput.value.trim();
      }
    }
  });

  if (action === 'start-scan') {
    setGlobalSettings({ dcsPath: finalDcsPath, savedGamesPath: finalSgPath });
    await runDcsScanner(finalDcsPath, finalSgPath);
  } else if (action === 'manual-load') {
    await reloadLibrary(); // the old manual file picker logic
  } else if (isFirstLaunch) {
    // If they cancel first launch, load fallback
    await loadLibraryFallback();
  }
}

async function runDcsScanner(dcsPath, sgPath) {
  const loaderSub = document.getElementById('loader-subtext');
  showToast(t('library.scanner.toast'), 'info');

  try {
    let combinedData = { sections: [] };
    let totalAssetsCount = 0;

    // 1. Read base list
    if (dcsPath && window.electronAPI) {
      if (loaderSub) loaderSub.textContent = "Parsing base sdef list...";
      const basePath = dcsPath + '/Doc/Sounds/sdef_and_wave_list.txt';
      if (await window.electronAPI.exists(basePath)) {
        const text = await window.electronAPI.readTextFile(basePath);
        if (text) {
          const baseData = parseSdefList(text);
          combinedData.sections.push(...baseData.sections);
          totalAssetsCount += baseData.sections.reduce((acc, sec) => acc + sec.assets.length, 0);
        }
      } else {
        showToast('Could not find base list in Doc/Sounds/sdef_and_wave_list.txt', 'warning');
        // We can still continue to scan CoreMods though
      }
    }

    // 2. Scan CoreMods
    if (dcsPath && window.electronAPI) {
      if (loaderSub) loaderSub.textContent = "Scanning CoreMods for sdefs...";
      showToast('Scanning CoreMods. This may take a while...', 'info');
      const coreModsPath = dcsPath + '/CoreMods';
      if (await window.electronAPI.exists(coreModsPath)) {
        const sdefs = await window.electronAPI.scanSdefs(coreModsPath);

        const coreSectionMap = {};

        for (const sdef of sdefs) {
          const sPath = sdef.relPath.replace(/\\/g, '/');
          let localPath = sPath;
          let modRoot = sPath.substring(0, sPath.lastIndexOf('/'));

          const lowerSPath = sPath.toLowerCase();

          if (lowerSPath.includes('/sounds/sdef/')) {
            const idx = lowerSPath.indexOf('/sounds/sdef/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 13);
          } else if (lowerSPath.includes('sounds/sdef/')) {
            const idx = lowerSPath.indexOf('sounds/sdef/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 12);
          } else if (lowerSPath.includes('/sounds/')) {
            const idx = lowerSPath.indexOf('/sounds/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 8);
          } else if (lowerSPath.includes('sounds/')) {
            const idx = lowerSPath.indexOf('sounds/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 7);
          }

          if (modRoot.endsWith('/')) modRoot = modRoot.substring(0, modRoot.length - 1);

          const modName = sPath.split('/')[1] || 'UnknownMod'; // e.g. aircraft/<ModName> => <ModName>
          const sectionName = `CoreMods: ${modName}`;
          const treePath = modRoot ? `[CoreMods]/${modRoot}/${localPath.replace(/\.sdef$/i, '')}` : `[CoreMods]/${localPath.replace(/\.sdef$/i, '')}`;

          const asset = {
            sdefPath: localPath,
            name: localPath.split('/').pop(),
            waves: sdef.waves,
            treePath: treePath,
            customSdefContent: sdef.content,
            sectionName: sectionName
          };

          if (!coreSectionMap[sectionName]) {
            coreSectionMap[sectionName] = { name: sectionName, modPrefix: `CoreMods/${modName}`, assets: [] };
          }
          coreSectionMap[sectionName].assets.push(asset);
          totalAssetsCount++;
        }

        for (const key in coreSectionMap) {
          if (coreSectionMap[key].assets.length > 0) {
            combinedData.sections.push(coreSectionMap[key]);
          }
        }
      }
    }

    // 3. Scan Saved Games Mods
    if (sgPath && window.electronAPI) {
      if (loaderSub) loaderSub.textContent = "Scanning Saved Games Mods...";
      const sgModsPath = sgPath + '/Mods';
      if (await window.electronAPI.exists(sgModsPath)) {
        const sdefs = await window.electronAPI.scanSdefs(sgModsPath);
        const sgSection = { name: "SavedGames Mods", modPrefix: "SavedGames Mods", assets: [] };

        for (const sdef of sdefs) {
          const sPath = sdef.relPath.replace(/\\/g, '/');
          let localPath = sPath;
          let modRoot = sPath.substring(0, sPath.lastIndexOf('/'));

          const lowerSPath = sPath.toLowerCase();

          if (lowerSPath.includes('/sounds/sdef/')) {
            const idx = lowerSPath.indexOf('/sounds/sdef/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 13);
          } else if (lowerSPath.includes('sounds/sdef/')) {
            const idx = lowerSPath.indexOf('sounds/sdef/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 12);
          } else if (lowerSPath.includes('/sounds/')) {
            const idx = lowerSPath.indexOf('/sounds/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 8);
          } else if (lowerSPath.includes('sounds/')) {
            const idx = lowerSPath.indexOf('sounds/');
            modRoot = sPath.substring(0, idx);
            localPath = sPath.substring(idx + 7);
          }

          if (modRoot.endsWith('/')) modRoot = modRoot.substring(0, modRoot.length - 1);

          const treePath = modRoot ? `[SavedGames]/${modRoot}/${localPath.replace(/\.sdef$/i, '')}` : `[SavedGames]/${localPath.replace(/\.sdef$/i, '')}`;

          const asset = {
            sdefPath: localPath,
            name: localPath.split('/').pop(),
            waves: sdef.waves,
            treePath: treePath,
            customSdefContent: sdef.content,
            sectionName: "SavedGames Mods"
          };
          sgSection.assets.push(asset);
          totalAssetsCount++;
        }
        if (sgSection.assets.length > 0) {
          combinedData.sections.push(sgSection);
        }
      }
    }

    if (totalAssetsCount === 0) {
      showToast('No assets found during scan. Check paths.', 'warning');
      return;
    }

    setLibraryData(combinedData);
    await saveLibraryToStorage(combinedData);

    allAssets = combinedData.sections.flatMap(s => s.assets);
    folderTree = buildFolderTree(allAssets);
    currentPath = [];
    renderFolderTree();
    applyFilter();
    renderStats();
    showToast(`Scan complete. Loaded ${totalAssetsCount} assets`, 'success');
  } catch (e) {
    console.error(e);
    showToast('Scanner failed: ' + e.message, 'error');
  } finally {
    renderIcons(document.getElementById('page-container'));
    updateTranslations();
  }
}
