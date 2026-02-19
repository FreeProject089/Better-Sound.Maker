/**
 * library.js — Assets Library page
 * Browse, search, filter, and select DCS sound assets
 */

import { getState, isAssetSelected, toggleAsset, selectAsset, deselectAsset, subscribe, setLibraryData } from '../state/store.js';
import { parseSdefList, buildCategoryTree, filterAssets } from '../data/sdef-parser.js';
import { showToast } from '../components/toast.js';
import { guessLoopType, detectSoundType, SOUND_TYPES } from '../utils/audio-analyzer.js';
import { pickTextFile } from '../utils/file-picker.js';

let allAssets = [];
let currentFilter = { query: '', category: '', subcategory: '' };
let categoryTree = {};
let scrollPos = 0;

// Virtual scroll settings
const ROW_HEIGHT = 46;
const BUFFER_ROWS = 20;
let listContainer = null;
let filteredAssetsCache = [];

export async function renderLibrary(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Assets Library</h1>
      <p class="page-description">Browse and select DCS sound assets to modify. Use search and category filters to find specific sounds.</p>
    </div>
    <div id="library-stats" class="stats-bar"></div>
    <div class="flex-between" style="margin-bottom: 16px; gap: 12px;">
      <div class="search-container" style="flex: 1;">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" id="library-search" placeholder="Search by name, SDEF path, or wave path..." />
      </div>
      <div class="flex-gap">
        <button class="btn btn-secondary btn-sm" id="select-filtered-btn">Select All Visible</button>
        <button class="btn btn-danger btn-sm" id="deselect-all-btn">Clear Selection</button>
        <button class="btn btn-secondary btn-sm" id="reload-library-btn">🔄 Reload Library</button>
      </div>
    </div>
    <div class="library-layout">
      <div class="category-tree" id="category-tree">
        <div class="loading-overlay"><div class="spinner"></div><div>Loading categories...</div></div>
      </div>
      <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
        <div id="asset-list-header" class="asset-row" style="border-bottom: 2px solid var(--border-default); font-weight: 600; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px;">
          <div>✓</div>
          <div>SDEF Path</div>
          <div>Wave Path(s)</div>
          <div>Type</div>
        </div>
        <div id="asset-list" class="asset-list-container" style="flex: 1; position: relative;">
          <div class="loading-overlay"><div class="spinner"></div><div>Loading assets...</div></div>
        </div>
      </div>
    </div>
  `;

  // Load data if not cached
  const state = getState();
  if (!state.libraryData) {
    await loadLibraryData();
  } else {
    allAssets = state.libraryData.sections.flatMap(s => s.assets);
    categoryTree = buildCategoryTree(allAssets);
  }

  renderStats();
  renderCategoryTree();
  applyFilter();

  // Event listeners
  document.getElementById('library-search').addEventListener('input', debounce((e) => {
    currentFilter.query = e.target.value;
    applyFilter();
  }, 200));

  document.getElementById('select-filtered-btn').addEventListener('click', selectAllVisible);
  document.getElementById('deselect-all-btn').addEventListener('click', deselectAll);
  document.getElementById('reload-library-btn').addEventListener('click', reloadLibrary);

  // Setup virtual scroll
  listContainer = document.getElementById('asset-list');
  listContainer.addEventListener('scroll', () => renderVirtualList());
}

async function loadLibraryData() {
  try {
    const resp = await fetch('/sdef_and_wave_list.txt');
    const text = await resp.text();
    const data = parseSdefList(text);
    setLibraryData(data);
    allAssets = data.sections.flatMap(s => s.assets);
    categoryTree = buildCategoryTree(allAssets);
    showToast(`Loaded ${allAssets.length} assets`, 'success');
  } catch (e) {
    showToast('Failed to load asset library: ' + e.message, 'error');
  }
}

async function reloadLibrary() {
  try {
    const file = await pickTextFile();
    const text = await file.text();
    const data = parseSdefList(text);
    setLibraryData(data);
    allAssets = data.sections.flatMap(s => s.assets);
    categoryTree = buildCategoryTree(allAssets);
    renderCategoryTree();
    applyFilter();
    renderStats();
    showToast(`Reloaded: ${allAssets.length} assets`, 'success');
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to reload: ' + e.message, 'error');
    }
  }
}

function renderStats() {
  const statsEl = document.getElementById('library-stats');
  if (!statsEl) return;

  const selected = Object.keys(getState().selectedAssets).length;
  const categories = Object.keys(categoryTree).length;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${allAssets.length.toLocaleString()}</div>
      <div class="stat-label">Total Assets</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${categories}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" id="filtered-count">${allAssets.length.toLocaleString()}</div>
      <div class="stat-label">Showing</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: var(--accent-blue);" id="selected-count">${selected}</div>
      <div class="stat-label">Selected</div>
    </div>
  `;
}

function renderCategoryTree() {
  const treeEl = document.getElementById('category-tree');
  if (!treeEl) return;

  let html = `
    <div class="category-item ${!currentFilter.category ? 'active' : ''}" data-category="" data-sub="">
      <span class="nav-icon">📦</span>
      <span>All Assets</span>
      <span class="count">${allAssets.length}</span>
    </div>
  `;

  const sortedCats = Object.keys(categoryTree).sort();

  for (const cat of sortedCats) {
    const catData = categoryTree[cat];
    const isActive = currentFilter.category === cat && !currentFilter.subcategory;
    const isOpen = currentFilter.category === cat;
    const hasChildren = Object.keys(catData.children).length > 0;

    html += `
      <div class="category-item ${isActive ? 'active' : ''}" data-category="${cat}" data-sub="">
        ${hasChildren ? `<span class="category-toggle ${isOpen ? 'open' : ''}">▶</span>` : '<span style="width:14px"></span>'}
        <span>${cat}</span>
        <span class="count">${catData.count}</span>
      </div>
    `;

    if (isOpen && hasChildren) {
      html += '<div class="category-children">';
      for (const sub of Object.keys(catData.children).sort()) {
        const isSubActive = currentFilter.subcategory === sub;
        html += `
          <div class="category-item ${isSubActive ? 'active' : ''}" data-category="${cat}" data-sub="${sub}">
            <span style="width:14px"></span>
            <span>${sub}</span>
            <span class="count">${catData.children[sub].count}</span>
          </div>
        `;
      }
      html += '</div>';
    }
  }

  treeEl.innerHTML = html;

  treeEl.querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', () => {
      currentFilter.category = el.dataset.category;
      currentFilter.subcategory = el.dataset.sub;
      renderCategoryTree();
      applyFilter();
    });
  });
}

function applyFilter() {
  filteredAssetsCache = filterAssets(allAssets, currentFilter);

  const filteredEl = document.getElementById('filtered-count');
  if (filteredEl) filteredEl.textContent = filteredAssetsCache.length.toLocaleString();

  renderVirtualList(true);
}

function renderVirtualList(reset = false) {
  if (!listContainer) return;

  if (reset) {
    listContainer.scrollTop = 0;
  }

  const totalHeight = filteredAssetsCache.length * ROW_HEIGHT;
  const scrollTop = listContainer.scrollTop;
  const viewHeight = listContainer.clientHeight;

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIdx = Math.min(filteredAssetsCache.length, Math.ceil((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER_ROWS);

  let html = `<div style="height: ${totalHeight}px; position: relative;">`;

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

    html += `
      <div class="asset-row ${selected ? 'selected' : ''}"
           data-idx="${i}"
           style="position: absolute; top: ${i * ROW_HEIGHT}px; width: 100%; height: ${ROW_HEIGHT}px;">
        <div>
          <label class="checkbox-wrapper">
            <input type="checkbox" ${selected ? 'checked' : ''} data-sdef="${asset.sdefPath}" />
          </label>
        </div>
        <div class="asset-sdef-path truncate" title="${asset.sdefPath}">${asset.sdefPath}</div>
        <div class="asset-wave-paths truncate" title="${asset.waves.join(', ')}">${asset.waves.join(', ') || '—'}</div>
        <div>
          <span class="tag" title="${typeInfo.description}" style="font-size:10px;">${typeInfo.icon} ${typeInfo.label}</span>
          ${loopTag}
        </div>
      </div>
    `;
  }

  html += '</div>';
  listContainer.innerHTML = html;

  // Checkbox handlers
  listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const sdefPath = e.target.dataset.sdef;
      const asset = filteredAssetsCache.find(a => a.sdefPath === sdefPath);
      if (asset) {
        toggleAsset(sdefPath, asset);
        updateSelectedCount();
        // Re-render just this row's style
        const row = e.target.closest('.asset-row');
        if (row) {
          row.classList.toggle('selected', isAssetSelected(sdefPath));
        }
      }
    });
  });
}

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

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
