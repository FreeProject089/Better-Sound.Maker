/**
 * src/catalog/schema.js — Normalized catalog formats
 *
 * Single source of truth for the shape of:
 *   - catalog manifests  (catalog.json — lists presets + sound-type packs)
 *   - presets            (preset_*.json)
 *   - sound-type packs   (sound-types/*.json)
 *
 * The JSON Schemas in /schemas mirror these rules for editors and CI.
 * Every normalize* function returns { value, errors }: value is null when the
 * input is unusable, errors lists what was wrong (or what was repaired).
 */

export const CATALOG_SCHEMA_VERSION = 1;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const SEMVER = /^\d+(\.\d+){0,2}$/;
const ID = /^[a-z0-9][a-z0-9_-]*$/;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

/* ── Presets ─────────────────────────────────────────────────────── */

/**
 * Validate a preset. Keeps the historical field names (`UpdateNumber`,
 * `assetPaths`) so existing preset files and saved projects stay compatible.
 */
export function normalizePreset(raw) {
    const errors = [];
    if (!isObj(raw)) return { value: null, errors: ['preset is not an object'] };

    const name = str(raw.name);
    if (!name) errors.push('name is required');

    if (!Array.isArray(raw.assetPaths)) {
        errors.push('assetPaths must be an array');
        return { value: null, errors };
    }
    const assetPaths = [...new Set(
        raw.assetPaths
            .filter((p) => typeof p === 'string' && p.trim())
            .map((p) => p.trim().replace(/\\/g, '/').replace(/^\/+/, ''))
    )];
    if (assetPaths.length !== raw.assetPaths.length) errors.push('assetPaths: removed empty or duplicate entries');

    let color = str(raw.color);
    if (!HEX_COLOR.test(color)) {
        if (color) errors.push(`color "${color}" is not #RRGGBB, using default`);
        color = '#3b82f6';
    }

    let version = str(raw.version) || '1.0.0';
    if (!SEMVER.test(version)) {
        errors.push(`version "${version}" is not numeric (x.y.z), using 1.0.0`);
        version = '1.0.0';
    }

    const updateNumber = Number.isInteger(raw.UpdateNumber) && raw.UpdateNumber > 0 ? raw.UpdateNumber : 1;
    const date = !Number.isNaN(Date.parse(raw.date)) ? raw.date : new Date(0).toISOString();

    if (!name) return { value: null, errors };

    return {
        value: {
            ...raw,
            name,
            color,
            version,
            UpdateNumber: updateNumber,
            date,
            assetPaths,
            ...(str(raw.author) && { author: str(raw.author) }),
            ...(str(raw.description) && { description: str(raw.description) }),
            ...(Array.isArray(raw.tags) && { tags: raw.tags.filter((t) => typeof t === 'string') }),
        },
        errors,
    };
}

/** Compare semver-ish strings: >0 when a is newer. */
export function compareVersions(a = '0', b = '0') {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d) return d;
    }
    return 0;
}

/** True when `remote` should replace `local`. UpdateNumber wins, version breaks ties. */
export function isPresetNewer(local, remote) {
    const lu = local.UpdateNumber || 1;
    const ru = remote.UpdateNumber || 1;
    if (ru !== lu) return ru > lu;
    return compareVersions(remote.version, local.version) > 0;
}

/* ── Sound-type packs ────────────────────────────────────────────── */

/**
 * Validate a sound-type pack: { types: { id: {label, lucideIcon, description} }, rules: [{match, type}] }.
 * Rules with an invalid regex or pointing at an unknown type are dropped.
 * `knownTypes` lets a pack reference types defined by earlier packs.
 */
export function normalizeSoundTypes(raw, knownTypes = {}) {
    const errors = [];
    if (!isObj(raw)) return { value: null, errors: ['sound-type pack is not an object'] };

    const types = {};
    for (const [id, def] of Object.entries(isObj(raw.types) ? raw.types : {})) {
        if (!ID.test(id)) { errors.push(`type id "${id}" must be lowercase a-z, 0-9, _ or -`); continue; }
        if (!isObj(def) || !str(def.label)) { errors.push(`type "${id}" needs a label`); continue; }
        types[id] = {
            ...def,
            label: str(def.label),
            lucideIcon: str(def.lucideIcon) || 'music',
            description: str(def.description),
        };
    }

    const allTypes = { ...knownTypes, ...types };
    const rules = [];
    for (const [i, r] of (Array.isArray(raw.rules) ? raw.rules : []).entries()) {
        if (!isObj(r) || !str(r.match) || !str(r.type)) { errors.push(`rule #${i} needs match and type`); continue; }
        try { new RegExp(r.match, 'i'); } catch { errors.push(`rule #${i}: invalid regex "${r.match}"`); continue; }
        if (!allTypes[r.type]) { errors.push(`rule #${i}: unknown type "${r.type}"`); continue; }
        rules.push({ match: r.match, type: r.type });
    }

    return { value: { types, rules }, errors };
}

/* ── Catalog manifest ────────────────────────────────────────────── */

/**
 * Validate a catalog manifest and resolve every entry URL against `baseUrl`.
 *
 * {
 *   "schemaVersion": 1,
 *   "name": "Better Sound.Maker Community Catalog",
 *   "presets":    [{ "id": "fa-18c", "url": "presets/preset_FA-18C.json", "name": "...", "UpdateNumber": 2, "version": "1.0.3" }],
 *   "soundTypes": [{ "id": "community", "url": "sound-types/community.json" }]
 * }
 */
export function normalizeCatalog(raw, baseUrl) {
    const errors = [];
    if (!isObj(raw)) return { value: null, errors: ['catalog is not an object'] };
    if (raw.schemaVersion > CATALOG_SCHEMA_VERSION) {
        errors.push(`catalog schemaVersion ${raw.schemaVersion} is newer than supported (${CATALOG_SCHEMA_VERSION}); some fields may be ignored`);
    }

    const entries = (list, kind) => {
        const out = [];
        const seen = new Set();
        for (const [i, e] of (Array.isArray(list) ? list : []).entries()) {
            const url = str(e?.url);
            if (!url) { errors.push(`${kind} #${i}: url is required`); continue; }
            let resolved;
            try { resolved = new URL(url, baseUrl).href; } catch { errors.push(`${kind} #${i}: bad url "${url}"`); continue; }
            if (!/^(https?|file):/.test(resolved)) {
                errors.push(`${kind} #${i}: unsupported url scheme`); continue;
            }
            const id = str(e.id) || url.split('/').pop().replace(/\.json$/i, '').toLowerCase();
            if (seen.has(id)) { errors.push(`${kind} #${i}: duplicate id "${id}"`); continue; }
            seen.add(id);
            out.push({ ...e, id, url: resolved });
        }
        return out;
    };

    return {
        value: {
            schemaVersion: raw.schemaVersion || 1,
            name: str(raw.name) || 'Catalog',
            presets: entries(raw.presets, 'preset'),
            soundTypes: entries(raw.soundTypes, 'soundTypes'),
        },
        errors,
    };
}
