/**
 * dcs-originals.js — Which game sounds can be compared (A/B)
 *
 * DCS ships module sounds as plain files (CoreMods/Mods/…/Sounds/Effects);
 * base-game sounds are packed in Sounds.edce and are not readable. This
 * module indexes the readable ones once (Rust: index_dcs_waves) and answers
 * "is there a readable original for this wave / this SDEF?".
 */

import { getState } from '../state/store.js';

let index = null;      // Map<key, absPath>
let indexedFor = '';
let loading = null;

const key = (wave) => String(wave || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/^effects\//i, '').replace(/\.(wav|ogg)$/i, '').toLowerCase();

/** Load (or reuse) the index for the DCS folder in Settings. Desktop only. */
export function loadOriginals() {
    const dcs = getState().globalSettings?.dcsPath || '';
    if (!window.nativeAPI?.indexDcsWaves || !dcs) return Promise.resolve(null);
    if (index && indexedFor === dcs) return Promise.resolve(index);
    if (loading) return loading;
    loading = window.nativeAPI.indexDcsWaves(dcs)
        .then(obj => { index = new Map(Object.entries(obj || {})); indexedFor = dcs; return index; })
        .catch(() => null)
        .finally(() => { loading = null; });
    return loading;
}

/** Absolute path of the readable original for a wave, or null. Sync: index must be loaded. */
export function originalPath(wave) {
    return index?.get(key(wave)) || null;
}

/** First readable original among an SDEF's waves. */
export function originalForWaves(waves = []) {
    for (const w of waves) { const p = originalPath(w); if (p) return p; }
    return null;
}

export const originalsReady = () => !!index;
export const originalsCount = () => index?.size || 0;
