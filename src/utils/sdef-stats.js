/**
 * sdef-stats.js — Build SDEF templates from real DCS files
 *
 * Input: SDEF texts with the module they come from. Files are grouped by
 * sound type (the same regex rules as the library) and by module + type;
 * each group of at least MIN_FILES gives one template whose values are what
 * Eagle Dynamics and the module makers actually use: the median of numeric
 * parameters and the most common value of the others, keeping only the
 * parameters present in at least KEEP_SHARE of the group's files.
 *
 * Pure functions, shared by scripts/build-sdef-templates.mjs (bundled pack)
 * and the app's "Rebuild from my DCS" (desktop).
 */

import { parseSdef } from './sdef-generator.js';

const MIN_FILES = 3;
const KEEP_SHARE = 0.4;
const SKIP = new Set(['wave', 'inherit']);

/* Template categories: tuned on the paths of DCS module SDEFs (Jester/…,
   Aircrafts/<x>/RHAW/radars/…, Aircrafts/Engines/J79/…). First match wins. */
export const TEMPLATE_CATEGORIES = [
    { id: 'music', label: 'Music / Walkman', icon: 'music', re: /walkman|song|music/ },
    { id: 'crew_voice', label: 'Crew voice (Jester, Iceman…)', icon: 'mic', re: /^(jester|chief|iceman|crew)\/|voice|speech/ },
    { id: 'betty', label: 'Warning voice (Betty)', icon: 'megaphone', re: /betty|bitching|warn_voice|voicewarn/ },
    { id: 'rwr', label: 'RWR / radar tones', icon: 'radar', re: /rwr|rhaw|alr\d*|\/radars?\/|_search|_track|lock|launch_warn/ },
    { id: 'tone', label: 'Tones & beeps', icon: 'radio', re: /tone|beep|chirp|morze|morse|growl|seeker|head_(high|low)/ },
    { id: 'apu', label: 'APU', icon: 'battery-charging', re: /apu/ },
    { id: 'engine_cockpit', label: 'Engine (cockpit)', icon: 'headphones', re: /(engine|afterburner|turbine|intake|compressor|jet\d|rpm|idle).*(cpt|cockpit|_int|int_|inside|internal)|(cpt|cockpit|_int|internal).*(engine|afterburner|turbine|intake)/ },
    { id: 'engine', label: 'Engine (external)', icon: 'flame', re: /engine|afterburner|turbine|intake|compressor|jet\d|nozzle|prop(eller)?|rpm|idle/ },
    { id: 'rotor', label: 'Rotor / blades', icon: 'fan', re: /rotor|blade|heli/ },
    { id: 'gun', label: 'Gun / cannon', icon: 'crosshair', re: /gun|cannon|vulcan|gau|gsh|defa|aden|mg_|machinegun/ },
    { id: 'weapon', label: 'Weapon launch / release', icon: 'rocket', re: /missile|rocket|launch|release|bomb|pylon|weapon|flare|chaff/ },
    { id: 'explosion', label: 'Explosion / impact', icon: 'bomb', re: /explo|blast|impact|hit|damage|crash|shrapnel/ },
    { id: 'gear', label: 'Landing gear / wheels', icon: 'circle-dot', re: /gear|wheel|tire|tyre|touchdown|brake|hook|skid/ },
    { id: 'canopy', label: 'Canopy', icon: 'panel-top-open', re: /canopy|hatch/ },
    { id: 'wind', label: 'Wind / airflow', icon: 'wind', re: /wind|airflow|air_|buffet|rattle|stall|aero|slipstream/ },
    { id: 'flyby', label: 'Fly-by / distant', icon: 'plane', re: /flyby|fly_by|distant|_far|far_/ },
    { id: 'radio', label: 'Radio / intercom', icon: 'radio-tower', re: /radio|comm|intercom|static|squelch|ics/ },
    { id: 'switch', label: 'Cockpit switches', icon: 'toggle-left', re: /switch|button|click|toggle|knob|lever|handle|cockpit\/|cpt\// },
    { id: 'other', label: 'Other', icon: 'music-2', re: /./ },
];

export function categorize(path) {
    const p = path.toLowerCase();
    return TEMPLATE_CATEGORIES.find(c => c.re.test(p)).id;
}

export const CATEGORY_RULES = {
    types: Object.fromEntries(TEMPLATE_CATEGORIES.map(c => [c.id, { label: c.label, lucideIcon: c.icon }])),
    detect: categorize,
};

export function compileRules(packs) {
    const types = {};
    const rules = [];
    for (const p of packs) {
        Object.assign(types, p.types || {});
        for (const r of p.rules || []) rules.push({ re: new RegExp(r.match, 'i'), type: r.type });
    }
    return { types, detect: (path) => rules.find(r => r.re.test(path.toLowerCase()))?.type || 'generic' };
}

/**
 * @param {Array<{ module: string, path: string, text: string }>} files
 * @param {{ types: object, detect: (path) => string }} rules
 * @returns {{ generatedAt, fileCount, byType: Template[], byModule: Template[] }}
 */
export function buildTemplates(files, rules) {
    const byType = new Map();
    const byModule = new Map();
    for (const f of files) {
        let params;
        try { params = parseSdef(f.text); } catch { continue; }
        const type = rules.detect(f.path);
        push(byType, type, params);
        if (f.module) push(byModule, `${f.module}::${type}`, params);
    }

    const label = (type) => rules.types[type]?.label || type;
    const icon = (type) => rules.types[type]?.lucideIcon || 'music';
    const out = { generatedAt: new Date().toISOString(), fileCount: files.length, byType: [], byModule: [] };

    for (const [type, list] of byType) {
        if (list.length < MIN_FILES) continue;
        const params = summarise(list);
        if (Object.keys(params).length < 2) continue;
        out.byType.push({ id: `dcs-type-${type}`, name: label(type), type, lucideIcon: icon(type), files: list.length, params, source: 'dcs' });
    }
    for (const [key, list] of byModule) {
        if (list.length < MIN_FILES) continue;
        const [module, type] = key.split('::');
        const params = summarise(list);
        if (Object.keys(params).length < 2) continue;
        out.byModule.push({ id: `dcs-mod-${slug(module)}-${type}`, name: `${module} · ${label(type)}`, module, type, lucideIcon: icon(type), files: list.length, params, source: 'dcs' });
    }
    out.byType.sort((a, b) => b.files - a.files);
    out.byModule.sort((a, b) => a.module.localeCompare(b.module) || b.files - a.files);
    return out;
}

function push(map, key, params) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(params);
}

function summarise(list) {
    const keys = new Map();
    for (const p of list) for (const k of Object.keys(p)) if (!SKIP.has(k)) keys.set(k, (keys.get(k) || 0) + 1);
    const out = {};
    for (const [k, n] of keys) {
        if (n / list.length < KEEP_SHARE) continue;
        const values = list.map(p => p[k]).filter(v => v !== undefined);
        if (values.every(v => typeof v === 'number')) out[k] = round(median(values));
        else if (values.every(v => Array.isArray(v) && v.every(x => typeof x === 'number'))) {
            out[k] = [0, 1, 2].map(i => round(median(values.map(v => v[i] ?? 0))));
        } else out[k] = mode(values);
    }
    return out;
}

function median(v) {
    const s = [...v].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mode(v) {
    const c = new Map();
    for (const x of v) { const k = JSON.stringify(x); c.set(k, (c.get(k) || 0) + 1); }
    return JSON.parse([...c].sort((a, b) => b[1] - a[1])[0][0]);
}
const round = (x) => Math.round(x * 1000) / 1000;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
