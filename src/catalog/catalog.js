/**
 * src/catalog/catalog.js — Community catalog loader
 *
 * The community catalog is a single catalog.json reachable by URL (default:
 * the Community-Presets repo, overridable in Settings or Load.cfg). It lists
 * presets and sound-type packs; each entry points to its own JSON file.
 *
 * Resolution order:
 *   1. remote catalog.json           (fresh, cached 5 min)
 *      └ legacy: if the default repo has no catalog.json yet, its preset_*.json
 *        files are listed through the GitHub API instead
 *   2. last good remote copy         (localStorage, any age — offline mode)
 *   3. bundled ./catalog.json        (ships with the app)
 */

import { getState } from '../state/store.js';
import { normalizeCatalog, normalizePreset, normalizeSoundTypes } from './schema.js';

export const DEFAULT_CATALOG_URL =
    'https://raw.githubusercontent.com/BetterDCS/Better-Sound.Maker-Community-Presets/main/catalog.json';
const BUNDLED_CATALOG_URL = './catalog.json';

const CACHE_KEY = 'bsm-community-catalog-cache';
const FRESH_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

let memo = null; // { time, result }
let inflight = null;

/** Catalog URL: user setting > Load.cfg > default. */
export function getCatalogUrl() {
    return str(getState().globalSettings?.catalogUrl)
        || str(window.APP_CONFIG?.CommunityCatalogUrl)
        || DEFAULT_CATALOG_URL;
}

export function isCommunityCatalogDisabled() {
    return window.APP_CONFIG?.DisableCommunityPresets === 'true';
}

/**
 * Load the catalog and every file it references.
 * @returns {Promise<{ source: 'remote'|'cache'|'bundled'|'disabled', name: string,
 *   presets: Array<{id, url, data}>, soundTypes: Array<{id, url, data}>, errors: string[] }>}
 */
export function loadCommunityCatalog({ force = false } = {}) {
    if (isCommunityCatalogDisabled()) {
        return Promise.resolve({ source: 'disabled', name: '', presets: [], soundTypes: [], errors: [] });
    }
    if (!force && memo && Date.now() - memo.time < FRESH_MS) return Promise.resolve(memo.result);
    if (inflight) return inflight;

    inflight = (async () => {
        const errors = [];
        let result = null;

        try {
            try {
                result = await loadFrom(getCatalogUrl(), 'remote', errors);
            } catch (e) {
                if (getCatalogUrl() !== DEFAULT_CATALOG_URL) throw e;
                result = await loadFrom(null, 'remote', errors, await legacyGithubManifest());
            }
            writeCache(result);
        } catch (e) {
            errors.push(`Remote catalog unavailable: ${e.message}`);
            result = readCache();
            if (!result) {
                try {
                    result = await loadFrom(new URL(BUNDLED_CATALOG_URL, location.href).href, 'bundled', errors);
                } catch (e2) {
                    errors.push(`Bundled catalog unavailable: ${e2.message}`);
                    result = { source: 'bundled', name: '', presets: [], soundTypes: [] };
                }
            }
        }

        result = { ...result, errors: [...errors, ...(result.errors || [])] };
        if (result.errors.length) console.warn('[Catalog]', result.errors);
        memo = { time: Date.now(), result };
        return result;
    })().finally(() => { inflight = null; });

    return inflight;
}

async function loadFrom(url, source, errors, rawManifest = null) {
    const raw = rawManifest || await fetchJson(url);
    const { value: catalog, errors: catErrors } = normalizeCatalog(raw, url || undefined);
    if (!catalog) throw new Error(catErrors.join('; '));
    errors.push(...catErrors);

    const presets = (await Promise.all(catalog.presets.map(async (entry) => {
        try {
            const { value, errors: e } = normalizePreset(await fetchJson(entry.url));
            e.forEach((msg) => errors.push(`${entry.id}: ${msg}`));
            return value ? { id: entry.id, url: entry.url, data: value } : null;
        } catch (e) {
            errors.push(`${entry.id}: ${e.message}`);
            return null;
        }
    }))).filter(Boolean);

    const soundTypes = [];
    let known = {};
    for (const entry of catalog.soundTypes) {
        try {
            const { value, errors: e } = normalizeSoundTypes(await fetchJson(entry.url), known);
            e.forEach((msg) => errors.push(`${entry.id}: ${msg}`));
            if (value) {
                known = { ...known, ...value.types };
                soundTypes.push({ id: entry.id, url: entry.url, data: value });
            }
        } catch (e) {
            errors.push(`${entry.id}: ${e.message}`);
        }
    }

    return { source, name: catalog.name, presets, soundTypes };
}

/** Pre-catalog.json layout: preset_*.json at the root of the community repo. */
async function legacyGithubManifest() {
    const files = await fetchJson('https://api.github.com/repos/BetterDCS/Better-Sound.Maker-Community-Presets/contents/');
    if (!Array.isArray(files)) throw new Error('unexpected GitHub listing');
    return {
        schemaVersion: 1,
        name: 'Community Presets',
        presets: files
            .filter((f) => /^preset_.*\.json$/i.test(f.name) && f.download_url)
            .map((f) => ({ url: f.download_url })),
    };
}

async function fetchJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
        const bust = /^https?:/.test(url) && !url.startsWith(location.origin) ? `${url.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
        const res = await fetch(url + bust, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

function writeCache(result) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), result }));
    } catch { /* quota or private mode: cache is optional */ }
}

function readCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        return cached?.result ? { ...cached.result, source: 'cache' } : null;
    } catch {
        return null;
    }
}

function str(v) {
    return typeof v === 'string' ? v.trim() : '';
}
