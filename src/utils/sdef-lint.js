/**
 * sdef-lint.js — SDEF checks and distance-attenuation model
 *
 * Rules follow DCS's own reference (DCS World/Doc/Sounds/example.sdef).
 * lintSdef() never throws; it returns a list of findings for the editor.
 */

import { SDEF_PARAMS } from './sdef-generator.js';

const KNOWN = new Set(SDEF_PARAMS.map((p) => p.key));
const ALIASES = { no_doppler: 'nodoppler', ptich: 'pitch', loop: 'looping', volume: 'gain' };
const SILENCE_THRESHOLD = 0.001; // -60 dB, used by DCS to derive the missing radius

/**
 * @param {object} params  parsed SDEF (see parseSdef)
 * @returns {Array<{level: 'error'|'warning'|'info', key: string|null, message: string}>}
 */
export function lintSdef(params = {}) {
    const out = [];
    const add = (level, key, message) => out.push({ level, key, message });
    const has = (k) => params[k] !== undefined && params[k] !== '' && params[k] !== null;
    const num = (k) => (typeof params[k] === 'number' ? params[k] : undefined);

    // Unknown keys / typos
    for (const key of Object.keys(params)) {
        if (KNOWN.has(key) || key.startsWith('_')) continue;
        const guess = ALIASES[key] || closest(key);
        add('warning', key, guess
            ? `Unknown parameter "${key}" — did you mean "${guess}"? DCS ignores it.`
            : `Unknown parameter "${key}" — DCS ignores it.`);
    }
    for (const [key, v] of Object.entries(params)) {
        const def = SDEF_PARAMS.find((p) => p.key === key);
        if (def?.type === 'number' && typeof v !== 'number') add('error', key, `"${key}" must be a number (got ${JSON.stringify(v)}).`);
    }

    // Sample
    const waves = Array.isArray(params.wave) ? params.wave : params.wave ? [params.wave] : [];
    if (!waves.length && !has('inherit')) add('error', 'wave', 'No wave and no inherit: this sound will be silent.');
    for (const w of waves) {
        if (w.includes('\\')) add('warning', 'wave', `"${w}" uses backslashes; use forward slashes.`);
        if (/^[\\/]*sounds[\\/]/i.test(w)) add('warning', 'wave', `"${w}" starts with Sounds/ but wave paths are already relative to Sounds/.`);
    }
    if (params.listmode === 'ASR' && waves.length < 2) add('warning', 'listmode', 'ASR needs at least 2 samples (first = attack, the rest loops).');
    if (params.listmode === 'SEQUENCE' && waves.length < 2) add('info', 'listmode', 'SEQUENCE with a single sample behaves like RANDOM.');

    // Volume / frequency
    if (has('gain') && num('gain') <= 0) add('warning', 'gain', 'gain is 0 or negative: the sound is muted.');
    if (num('gain') > 10) add('warning', 'gain', `gain ${num('gain')} is unusually high and may clip.`);
    if (has('pitch') && num('pitch') <= 0) add('error', 'pitch', 'pitch must be greater than 0.');
    for (const k of ['gain_random', 'pitch_random', 'attack', 'release']) {
        if (num(k) < 0) add('error', k, `${k} cannot be negative.`);
    }
    for (const k of ['lowpass', 'cone_outer_lowpass']) {
        const v = num(k);
        if (v !== undefined && (v < 10 || v > 24000)) add('warning', k, `${k} ${v} Hz is outside the audible 10–24000 Hz range.`);
    }

    // Radii must grow outward
    const order = ['silent_radius', 'peak_radius', 'inner_radius', 'outer_radius'].filter((k) => num(k) !== undefined);
    for (let i = 1; i < order.length; i++) {
        if (num(order[i]) < num(order[i - 1])) {
            add('error', order[i], `${order[i]} (${num(order[i])}) must be ≥ ${order[i - 1]} (${num(order[i - 1])}).`);
        }
    }
    for (const k of order) if (num(k) < 0) add('error', k, `${k} cannot be negative.`);
    if (has('inner_radius') !== has('outer_radius')) {
        const r = attenuationRadii(params);
        add('info', has('inner_radius') ? 'outer_radius' : 'inner_radius',
            `Only one of inner/outer radius is set; DCS derives the other: inner ${fmt(r.inner)} m, outer ${fmt(r.outer)} m.`);
    }

    // Cone
    const ci = num('cone_inner_angle');
    const co = num('cone_outer_angle');
    for (const [k, v] of [['cone_inner_angle', ci], ['cone_outer_angle', co]]) {
        if (v !== undefined && (v < 0 || v > 180)) add('error', k, `${k} is a half-angle and must be between 0 and 180.`);
    }
    const coneUsed = (ci || co) && (num('cone_outer_gain') ?? 1) !== 1;
    const dir = params.direction;
    if (coneUsed && (!Array.isArray(dir) || dir.every((d) => !d))) {
        add('warning', 'direction', 'Cone angles are set but direction is {0, 0, 0}: the cone has no effect.');
    }
    if (ci > co && co !== undefined) {
        if (ci <= 90) add('info', 'cone_inner_angle', 'cone_inner_angle > cone_outer_angle (both ≤ 90): this is an inverse cone (rotor-style).');
        else add('error', 'cone_inner_angle', 'An inverse cone needs both angles ≤ 90.');
    }

    // Play mode
    if (params.streaming === true && params.detached === true) {
        add('warning', 'detached', 'streaming = true implies detached = false; detached is ignored.');
    }

    return out;
}

/** Effective radii after DCS's defaults and the "only one radius set" rule. */
export function attenuationRadii(params = {}) {
    const n = (k) => (typeof params[k] === 'number' ? params[k] : undefined);
    let inner = n('inner_radius');
    let outer = n('outer_radius');
    if (inner === undefined && outer === undefined) { inner = 1; outer = 1000; }
    else if (outer === undefined) outer = inner / SILENCE_THRESHOLD;
    else if (inner === undefined) inner = outer * SILENCE_THRESHOLD;
    return { silent: n('silent_radius') ?? 0, peak: n('peak_radius') ?? 0, inner, outer };
}

/**
 * Relative gain (0..1, before the `gain` multiplier) at distance d, per the
 * curve documented in example.sdef.
 */
export function gainAtDistance(d, r) {
    const { silent, peak, inner, outer } = r;
    if (d < silent) return 0;
    if (d < peak) return peak > silent ? (d - silent) / (peak - silent) : 1;
    if (d < inner) return inner > peak ? 1 - 0.15 * (d - peak) / (inner - peak) : 0.85;
    const half = outer / 2;
    const inverse = (x) => 0.85 * inner / Math.max(x, inner);
    if (d < half) return inverse(d);
    if (d < outer) return inverse(half) * (outer - d) / (outer - half);
    return 0;
}

function closest(key) {
    let best = null;
    let bestDist = 3;
    for (const k of KNOWN) {
        const d = levenshtein(key, k);
        if (d < bestDist) { best = k; bestDist = d; }
    }
    return best;
}

function levenshtein(a, b) {
    const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = dp[j];
            dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return dp[b.length];
}

function fmt(v) {
    return Number.isInteger(v) ? v : Number(v.toFixed(3));
}
