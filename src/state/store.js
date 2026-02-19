/**
 * store.js — Central application state with pub/sub reactivity
 */

const STORAGE_KEY = 'dcs-sound-mod-creator';

const defaultState = {
    // Selected assets: key = sdefPath, value = { sdefContent, audioFile (name only), audioMeta, customWaves }
    selectedAssets: {},

    // Project configuration for entry.lua
    projectConfig: {
        modName: '',
        author: '',
        version: '1.0.0',
        description: '',
        url: '',
        credits: '',
        displayName: '',
        shortName: '',
        themeEnabled: false
    },

    // Theme images: key = slot name, value = { fileName, dataUrl }
    themeImages: {},

    // Presets: array of { name, date, assetPaths[] }
    presets: [],

    // Current page
    currentPage: 'library',

    // Current SDEF being edited
    currentSdef: null,

    // Library data (transient, not persisted)
    libraryData: null
};

let state = { ...defaultState };
const listeners = new Map();
const audioFiles = new Map();    // sdefPath → File object (not serializable)
const themeFiles = new Map();    // slot → File object

// Load persisted state
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...defaultState, ...parsed, libraryData: null };
        }
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
}

// Save state (exclude transient data)
function saveState() {
    try {
        const toSave = { ...state };
        delete toSave.libraryData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

// Subscribe to changes
export function subscribe(key, callback) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
}

// Notify listeners
function notify(key) {
    if (listeners.has(key)) {
        for (const cb of listeners.get(key)) {
            cb(state[key]);
        }
    }
    // Global listeners
    if (listeners.has('*')) {
        for (const cb of listeners.get('*')) {
            cb(state);
        }
    }
}

// Get state
export function getState() {
    return state;
}

// Update state
export function setState(key, value) {
    state[key] = value;
    notify(key);
    saveState();
}

// --- Asset Selection ---
export function selectAsset(sdefPath, assetData) {
    state.selectedAssets[sdefPath] = {
        sdefContent: '',
        audioFileName: null,
        audioMeta: null,
        customWaves: assetData.waves || [],
        originalAsset: assetData,
        ...state.selectedAssets[sdefPath]
    };
    notify('selectedAssets');
    saveState();
}

export function deselectAsset(sdefPath) {
    delete state.selectedAssets[sdefPath];
    audioFiles.delete(sdefPath);
    notify('selectedAssets');
    saveState();
}

export function isAssetSelected(sdefPath) {
    return sdefPath in state.selectedAssets;
}

export function getSelectedCount() {
    return Object.keys(state.selectedAssets).length;
}

export function toggleAsset(sdefPath, assetData) {
    if (isAssetSelected(sdefPath)) {
        deselectAsset(sdefPath);
    } else {
        selectAsset(sdefPath, assetData);
    }
}

// --- Audio Files ---
export function setAudioFile(sdefPath, file, meta) {
    audioFiles.set(sdefPath, file);
    if (state.selectedAssets[sdefPath]) {
        state.selectedAssets[sdefPath].audioFileName = file.name;
        state.selectedAssets[sdefPath].audioMeta = meta;
        notify('selectedAssets');
        saveState();
    }
}

export function getAudioFile(sdefPath) {
    return audioFiles.get(sdefPath);
}

export function removeAudioFile(sdefPath) {
    audioFiles.delete(sdefPath);
    if (state.selectedAssets[sdefPath]) {
        state.selectedAssets[sdefPath].audioFileName = null;
        state.selectedAssets[sdefPath].audioMeta = null;
        notify('selectedAssets');
        saveState();
    }
}

// --- SDEF Content ---
export function setSdefContent(sdefPath, content) {
    if (state.selectedAssets[sdefPath]) {
        state.selectedAssets[sdefPath].sdefContent = content;
        notify('selectedAssets');
        saveState();
    }
}

export function getSdefContent(sdefPath) {
    return state.selectedAssets[sdefPath]?.sdefContent || '';
}

// --- Theme ---
export function setThemeImage(slot, file, dataUrl) {
    themeFiles.set(slot, file);
    state.themeImages[slot] = { fileName: file.name, dataUrl };
    notify('themeImages');
    saveState();
}

export function getThemeFile(slot) {
    return themeFiles.get(slot);
}

export function removeThemeImage(slot) {
    themeFiles.delete(slot);
    delete state.themeImages[slot];
    notify('themeImages');
    saveState();
}

// --- Project Config ---
export function updateProjectConfig(updates) {
    state.projectConfig = { ...state.projectConfig, ...updates };
    notify('projectConfig');
    saveState();
}

// --- Presets ---
export function savePreset(name) {
    const preset = {
        name,
        date: new Date().toISOString(),
        assetPaths: Object.keys(state.selectedAssets)
    };
    state.presets.push(preset);
    notify('presets');
    saveState();
    return preset;
}

export function deletePreset(index) {
    state.presets.splice(index, 1);
    notify('presets');
    saveState();
}

export function importPreset(preset) {
    state.presets.push(preset);
    notify('presets');
    saveState();
}

// --- Navigation ---
export function navigate(page) {
    state.currentPage = page;
    notify('currentPage');
}

export function setCurrentSdef(sdefPath) {
    state.currentSdef = sdefPath;
    notify('currentSdef');
}

// --- Library Data ---
export function setLibraryData(data) {
    state.libraryData = data;
    notify('libraryData');
}

// --- Reset ---
export function resetProject() {
    audioFiles.clear();
    themeFiles.clear();
    state.selectedAssets = {};
    state.themeImages = {};
    state.projectConfig = { ...defaultState.projectConfig };
    state.currentSdef = null;
    notify('selectedAssets');
    notify('themeImages');
    notify('projectConfig');
    saveState();
}

// Initialize
loadState();
