/**
 * store.js — Central application state with pub/sub reactivity
 */

import { get, set, del, keys as idbKeys } from 'idb-keyval';
import { APP_VERSION } from '../utils/version.js';

const STORAGE_KEY = 'dcs-sound-mod-creator';
const ASSET_FILES_PREFIX = 'audio::';
const THEME_FILES_PREFIX = 'theme::';

const defaultState = {
    // Selected assets: key = sdefPath, value = { sdefContent, audioFileName, audioMeta, customWaves, note }
    selectedAssets: {},

    // Notes: key = sdefPath or `wave::wavePath`, value = string
    assetNotes: {},

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
    libraryData: null,

    // Global settings
    globalSettings: {
        dcsPath: '',
        autoScan: false
    },

    // Unsaved SDEF changes (transient)
    unsavedSdefs: {}
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
    let defaultContent = '';
    if (assetData && assetData.customSdefContent) {
        defaultContent = assetData.customSdefContent;
    }
    state.selectedAssets[sdefPath] = {
        sdefContent: defaultContent,
        audioFileName: null,
        audioMeta: null,
        customWaves: assetData.waves || [],
        originalAsset: assetData,
        note: '',
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
export async function setAudioFile(sdefPath, file, meta) {
    audioFiles.set(sdefPath, file);
    if (state.selectedAssets[sdefPath]) {
        state.selectedAssets[sdefPath].audioFileName = file.name;
        state.selectedAssets[sdefPath].audioMeta = meta;
        // Persist path if available (Electron)
        if (file.path) {
            state.selectedAssets[sdefPath].audioPath = file.path;
        } else {
            // Browser: Save blob to IndexedDB
            try {
                // We serialize the file as a Blob or ArrayBuffer
                // idb-keyval handles Blobs/Files directly in modern browsers
                await set(ASSET_FILES_PREFIX + sdefPath, file);
            } catch (e) {
                console.warn('Failed to save audio to IDB', e);
            }
        }
        notify('selectedAssets');
        saveState();
    }
}

export function getAudioFile(sdefPath) {
    return audioFiles.get(sdefPath);
}

export async function removeAudioFile(sdefPath) {
    audioFiles.delete(sdefPath);
    if (state.selectedAssets[sdefPath]) {
        state.selectedAssets[sdefPath].audioFileName = null;
        state.selectedAssets[sdefPath].audioMeta = null;
        state.selectedAssets[sdefPath].audioPath = null;

        // Remove from IDB
        try {
            await del(ASSET_FILES_PREFIX + sdefPath);
        } catch (e) { /* ignore */ }

        notify('selectedAssets');
        saveState();
    }
}

// --- Notes ---
export function setAssetNote(key, text) {
    if (!state.assetNotes) state.assetNotes = {};
    if (text.trim() === '') {
        delete state.assetNotes[key];
    } else {
        state.assetNotes[key] = text;
    }
    notify('assetNotes');
    saveState();
}

export function getAssetNote(key) {
    return state.assetNotes?.[key] || '';
}

// --- SDEF Content ---
export function setSdefContent(sdefPath, content) {
    if (!state.selectedAssets[sdefPath]) {
        // Automatically select if saving an unselected SDEF
        let assetData = null;
        if (state.libraryData && state.libraryData.sections) {
            for (const sec of state.libraryData.sections) {
                const found = sec.assets.find(a => a.sdefPath === sdefPath);
                if (found) { assetData = found; break; }
            }
        }
        if (assetData) {
            selectAsset(sdefPath, assetData);
        } else {
            return;
        }
    }
    state.selectedAssets[sdefPath].sdefContent = content;
    notify('selectedAssets');
    saveState();
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

// --- Unsaved SDEFs ---
export function updateUnsavedSdef(sdefPath, content) {
    state.unsavedSdefs[sdefPath] = content;
    notify('unsavedSdefs');
}

export function clearUnsavedSdef(sdefPath) {
    if (state.unsavedSdefs[sdefPath] !== undefined) {
        delete state.unsavedSdefs[sdefPath];
        notify('unsavedSdefs');
    }
}

export function saveAllUnsavedSdefs() {
    for (const [sdefPath, content] of Object.entries(state.unsavedSdefs)) {
        if (!state.selectedAssets[sdefPath]) {
            state.selectedAssets[sdefPath] = {};
        }
        state.selectedAssets[sdefPath].sdefContent = content;
    }
    state.unsavedSdefs = {};
    saveState();
    notify('selectedAssets');
    notify('unsavedSdefs');
}

// --- Project Config ---
export function updateProjectConfig(updates) {
    state.projectConfig = { ...state.projectConfig, ...updates };
    notify('projectConfig');
    saveState();
}

// --- Presets ---
export function savePreset(name, color = '#3b82f6') {
    const preset = {
        name,
        color,
        version: APP_VERSION,
        UpdateNumber: 1,
        date: new Date().toISOString(),
        assetPaths: Object.keys(state.selectedAssets)
    };
    state.presets.push(preset);
    notify('presets');
    saveState();
    return preset;
}

export function updatePreset(index, pd) {
    if (state.presets[index]) {
        state.presets[index] = { ...state.presets[index], ...pd };
        notify('presets');
        saveState();
    }
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
export function setGlobalSettings(settings) {
    state.globalSettings = { ...state.globalSettings, ...settings };
    saveState();
    notify('globalSettings');
}

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
    // Helper to persist if needed, but we might want to do this explicitly
}

export async function saveLibraryToStorage(data) {
    try {
        await set(STORAGE_KEY + '::library', data);
        console.log('Library data saved to IDB');
    } catch (e) {
        console.warn('Failed to save library data to IDB:', e);
    }
}

export async function loadLibraryFromStorage() {
    try {
        const data = await get(STORAGE_KEY + '::library');
        if (data) {
            state.libraryData = data;
            notify('libraryData');
            return data;
        }
    } catch (e) {
        console.warn('Failed to load library data from IDB:', e);
    }
    return null;
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
// Initialize
loadState();

// Restore persisted audio files (if in Electron)
// Restore persisted audio files
(async function restoreAudioFiles() {
    // 1. Electron Strategy: Read from disk paths
    if (window.electronAPI) {
        // Wait a tick for listeners to maybe be ready, though not strictly necessary
        await new Promise(r => setTimeout(r, 100));

        const keys = Object.keys(state.selectedAssets);
        let restoredCount = 0;

        for (const key of keys) {
            const asset = state.selectedAssets[key];
            if (asset.audioPath && !audioFiles.has(key)) {
                try {
                    const buffer = await window.electronAPI.readFile(asset.audioPath);
                    if (buffer) {
                        const type = asset.audioFileName?.endsWith('.ogg') ? 'audio/ogg' : 'audio/wav';
                        const blob = new Blob([buffer], { type });
                        blob.name = asset.audioFileName || 'restored_audio';
                        // Re-attach path
                        blob.path = asset.audioPath;

                        audioFiles.set(key, blob);
                        restoredCount++;
                    }
                } catch (e) {
                    console.warn(`Failed to restore audio for ${key} from ${asset.audioPath}`, e);
                }
            }
        }

        if (restoredCount > 0) {
            notify('selectedAssets');
            console.log(`Restored ${restoredCount} audio files from disk (Electron).`);
        }
    }

    // 2. Browser Strategy: Read from IndexedDB
    // We try this regardless of Electron, in case some files were "downloaded"/synced and stored in IDB
    try {
        const keys = await idbKeys();
        let idbCount = 0;
        for (const k of keys) {
            if (typeof k === 'string' && k.startsWith(ASSET_FILES_PREFIX)) {
                const sdefPath = k.replace(ASSET_FILES_PREFIX, '');
                // Only restore if we don't have it yet (e.g. from Electron path)
                if (!audioFiles.has(sdefPath)) {
                    const file = await get(k);
                    if (file) {
                        audioFiles.set(sdefPath, file);
                        idbCount++;
                    }
                }
            }
        }
        if (idbCount > 0) {
            notify('selectedAssets');
            console.log(`Restored ${idbCount} audio files from storage (IDB).`);
        }
    } catch (e) {
        console.warn('IDB Restore error:', e);
    }
})();
