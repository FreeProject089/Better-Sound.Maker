/**
 * audio-analyzer.js — Audio file analysis + smart type detection
 * Sound types are driven by JSON rule files in public/sound-types/*.json
 */

import { getIcon } from './icons.js';

// ── Runtime-loaded sound-type rules ──────────────────────────────────────────
let SOUND_TYPES = null;     // { id: { label, lucideIcon, description, ... } }
let SOUND_RULES = null;     // [{ match: RegExp, type: string }]

/**
 * Load all *.json files from public/sound-types/ and merge them.
 * Files are fetched at runtime; the app must be served (Vite dev or Electron).
 * Callers should await ensureRulesLoaded() before using detectSoundType.
 */
async function loadSoundTypeRules() {
    SOUND_TYPES = {};
    SOUND_RULES = [];

    try {
        // Load the manifest (default + any user-added files)
        // First try fetching an index, otherwise fall back to just default.json
        let files = ['./sound-types/default.json'];

        // Attempt to fetch additional files listed via a meta-index if present
        try {
            const idxRes = await fetch('./sound-types/index.json');
            if (idxRes.ok) {
                const idx = await idxRes.json();
                if (Array.isArray(idx.files)) {
                    files = idx.files.map(f => `./sound-types/${f}`);
                }
            }
        } catch (_) { /* no index file, use defaults */ }

        for (const url of files) {
            try {
                const res = await fetch(url + '?v=' + Date.now());
                if (!res.ok) continue;
                const data = await res.json();
                // Merge types
                if (data.types) Object.assign(SOUND_TYPES, data.types);
                // Merge rules
                if (Array.isArray(data.rules)) {
                    for (const r of data.rules) {
                        SOUND_RULES.push({ match: new RegExp(r.match, 'i'), type: r.type });
                    }
                }
            } catch (e) {
                console.warn('[SoundTypes] Failed to load', url, e);
            }
        }
    } catch (e) {
        console.warn('[SoundTypes] Failed to load rule files, using hardcoded fallback', e);
    }

    // Load custom types from localStorage
    try {
        const customTypesJson = localStorage.getItem('bsm-custom-types');
        if (customTypesJson) {
            const custom = JSON.parse(customTypesJson);
            if (custom.types) Object.assign(SOUND_TYPES, custom.types);
            if (Array.isArray(custom.rules)) {
                for (const r of custom.rules) {
                    // Prepend custom rules so they take priority
                    SOUND_RULES.unshift({ match: new RegExp(r.match, 'i'), type: r.type });
                }
            }
        }
    } catch (e) {
        console.warn('[SoundTypes] Failed to load custom types from localStorage', e);
    }

    // Hardcoded fallback if fetch completely fails (offline / test env)
    if (!SOUND_TYPES || Object.keys(SOUND_TYPES).length === 0) {
        SOUND_TYPES = _hardcodedTypes();
        SOUND_RULES = _hardcodedRules();
    }

    // Always ensure 'generic' exists
    if (!SOUND_TYPES.generic) {
        SOUND_TYPES.generic = { label: 'Generic', lucideIcon: 'volume-2', description: 'Unclassified sound' };
    }
}

export async function ensureRulesLoaded() {
    if (!SOUND_TYPES || !SOUND_RULES) {
        await loadSoundTypeRules();
    }
}

/**
 * Force a reload of rules (e.g. after custom type changes)
 */
export async function reloadRules() {
    SOUND_TYPES = null;
    SOUND_RULES = null;
    await loadSoundTypeRules();
}

// Sync accessor — call ensureRulesLoaded() first, or types will be {} on first render
export { SOUND_TYPES };

/**
 * Get the rendered icon HTML for a sound type entry.
 * Uses lucideIcon (Lucide SVG) if available, falls back to legacy unicode icon field.
 */
export function getTypeIconHtml(typeInfo, className = '') {
    if (!typeInfo) return getIcon('volume-2', className);
    if (typeInfo.lucideIcon) {
        return getIcon(typeInfo.lucideIcon, className);
    }
    // Legacy unicode fallback
    if (typeInfo.icon) {
        return `<span class="${className}">${typeInfo.icon}</span>`;
    }
    return getIcon('volume-2', className);
}

/**
 * Detect sound type from SDEF path using loaded JSON rules.
 */
export function detectSoundType(sdefPath) {
    if (!SOUND_RULES) return 'generic';
    const lower = sdefPath.toLowerCase();
    for (const r of SOUND_RULES) {
        if (r.match.test(lower)) return r.type;
    }
    return 'generic';
}

/**
 * Get SDEF defaults for a given sound type
 */
export function getTypeDefaults(type) {
    const hardcoded = {
        engine: { inner_radius: 200, outer_radius: 12000, gain: 1, detached: false },
        engine_start: { inner_radius: 150, outer_radius: 5000, gain: 1, detached: true },
        engine_internal: { inner_radius: 50, gain: 0.9, detached: false },
        cockpit_switch: { inner_radius: 50, gain: 1, detached: true },
        betty: { inner_radius: 50, gain: 1, detached: true },
        tones: { inner_radius: 50, gain: 1, detached: false },
        weapon: { inner_radius: 500, outer_radius: 15000, gain: 1, detached: true },
        apu: { inner_radius: 100, outer_radius: 3000, gain: 1, detached: false },
        ecs: { inner_radius: 50, gain: 0.8, detached: false },
        gear: { inner_radius: 80, outer_radius: 2000, gain: 1, detached: true },
        canopy: { inner_radius: 60, outer_radius: 1000, gain: 0.9, detached: true },
        wind: { inner_radius: 30, gain: 0.8, detached: false },
        flyby: { inner_radius: 500, outer_radius: 20000, gain: 1, detached: true },
        radio: { inner_radius: 10, gain: 1, detached: true },
        explosion: { inner_radius: 800, outer_radius: 25000, gain: 1.3, detached: true },
        damage: { inner_radius: 100, outer_radius: 3000, gain: 1, detached: true },
        personnel: { inner_radius: 30, gain: 1, detached: false },
        environment: { inner_radius: 200, outer_radius: 5000, gain: 1, detached: false },
        ui: { inner_radius: 10, gain: 1, detached: true },
        generic: { inner_radius: 50, gain: 1, detached: false },
    };
    return hardcoded[type] || hardcoded.generic;
}

/**
 * Guess loop type from SDEF path
 */
export function guessLoopType(sdefPath) {
    const type = detectSoundType(sdefPath);
    const oneShotTypes = ['cockpit_switch', 'betty', 'weapon', 'gear', 'canopy', 'flyby', 'explosion', 'damage', 'engine_start', 'radio', 'ui'];
    if (oneShotTypes.includes(type)) return 'one-shot';
    const loopTypes = ['engine', 'engine_internal', 'apu', 'ecs', 'wind', 'environment', 'personnel', 'tones'];
    if (loopTypes.includes(type)) return 'loop';
    const lower = sdefPath.toLowerCase();
    if (/loop|idle|steady|continuous|hum|drone/i.test(lower)) return 'loop';
    if (/click|shot|hit|start|stop|open|close|up|down|on|off/i.test(lower)) return 'one-shot';
    return 'unknown';
}

/**
 * Analyze an audio file — returns metadata about channels, sample rate, etc.
 */
export async function analyzeAudioFile(file) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);

        const meta = {
            channels: buffer.numberOfChannels,
            channelType: buffer.numberOfChannels === 1 ? 'Mono' : 'Stereo',
            sampleRate: buffer.sampleRate,
            duration: Math.round(buffer.duration * 100) / 100,
            durationFormatted: formatDuration(buffer.duration),
            fileSize: file.size,
            fileSizeFormatted: formatFileSize(file.size),
            fileName: file.name,
            recommendations: []
        };

        if (buffer.sampleRate > 48000) {
            meta.recommendations.push({ type: 'warning', message: `Sample rate ${buffer.sampleRate}Hz is higher than recommended (44100/48000Hz)` });
        }
        if (buffer.numberOfChannels > 2) {
            meta.recommendations.push({ type: 'error', message: `${buffer.numberOfChannels} channels detected — DCS only supports Mono or Stereo` });
        }
        if (file.size > 50 * 1024 * 1024) {
            meta.recommendations.push({ type: 'warning', message: 'File is very large (>50MB). Consider using .ogg for compression.' });
        }

        return meta;
    } finally {
        ctx.close();
    }
}

function formatDuration(seconds) {
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m${s}s`;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Hardcoded fallback data ─────────────────────────────────────────────────
function _hardcodedTypes() {
    return {
        engine: { label: 'Engine', lucideIcon: 'flame', description: 'External engine loops' },
        engine_start: { label: 'Engine Start', lucideIcon: 'key', description: 'Engine startup/shutdown' },
        engine_internal: { label: 'Cockpit Engine', lucideIcon: 'headphones', description: 'Engine heard from cockpit' },
        cockpit_switch: { label: 'Cockpit Switch', lucideIcon: 'toggle-left', description: 'Button/switch one-shots' },
        betty: { label: 'Betty / Voice', lucideIcon: 'megaphone', description: 'Voice alerts' },
        tones: { label: 'Tones / RWR', lucideIcon: 'radio', description: 'Warning tones and RWR' },
        weapon: { label: 'Weapon', lucideIcon: 'crosshair', description: 'Cannon, missiles, bombs' },
        apu: { label: 'APU', lucideIcon: 'cog', description: 'Auxiliary power unit' },
        ecs: { label: 'ECS / Avionics', lucideIcon: 'snowflake', description: 'Climate & avionics' },
        gear: { label: 'Landing Gear', lucideIcon: 'circle-dot', description: 'Gear extension/retraction' },
        canopy: { label: 'Canopy', lucideIcon: 'shield', description: 'Canopy open/close' },
        wind: { label: 'Wind / Ambient', lucideIcon: 'wind', description: 'Wind and atmosphere' },
        flyby: { label: 'Flyby', lucideIcon: 'plane', description: 'External flyby sounds' },
        radio: { label: 'Radio / Comm', lucideIcon: 'radio-tower', description: 'Radio and intercom' },
        explosion: { label: 'Explosion', lucideIcon: 'bomb', description: 'Explosions and impacts' },
        damage: { label: 'Damage', lucideIcon: 'hammer', description: 'Damage and hit effects' },
        personnel: { label: 'Personnel', lucideIcon: 'user', description: 'Pilot breathing, pain' },
        environment: { label: 'Environment', lucideIcon: 'globe', description: 'Terrain, weather, sea' },
        ui: { label: 'UI / Interface', lucideIcon: 'mouse-pointer', description: 'Menu and UI sounds' },
        generic: { label: 'Generic', lucideIcon: 'volume-2', description: 'Unclassified sound' },
    };
}

function _hardcodedRules() {
    const patterns = [
        ['betty\\/', 'betty'],
        ['tones?\\/', 'tones'],
        ['\\bsw\\d+', 'cockpit_switch'],
        ['cockpit\\/.*(sw_|switch|knob|btn|button|lever|handle|contactor)', 'cockpit_switch'],
        ['throttle.?(click|from|to|idle|off|lim)', 'cockpit_switch'],
        ['cockpit.*click', 'cockpit_switch'],
        ['battery\\.sdef', 'cockpit_switch'],
        ['seat.?adjust', 'cockpit_switch'],
        ['\\becs', 'ecs'],
        ['avionics', 'ecs'],
        ['gyro', 'ecs'],
        ['canopy|hood|hatch', 'canopy'],
        ['\\bapu', 'apu'],
        ['cockpit.*(f404|engine|afterburner|rpm|thrust|amb_in)', 'engine_internal'],
        ['f404.*_in\\b', 'engine_internal'],
        ['afterburner_in', 'engine_internal'],
        ['(start|shutdown|spool.*up|spool.*down|ignit).*(engine|f404|turbine)', 'engine_start'],
        ['f404ge_(start|shutdown)', 'engine_start'],
        ['f404|afterburner|rpm\\d|thrust|nozzle|jet.?blast|back[12]', 'engine'],
        ['engine|turbine|idle', 'engine'],
        ['distant|flyby|fly_by|whistle', 'flyby'],
        ['personnel\\/', 'personnel'],
        ['\\b(pilot|heart|breath|dying|wounded|g-?loc|gasp)\\b', 'personnel'],
        ['damage\\/', 'damage'],
        ['\\b(break|bullet.?hit|ricochet|burning|hit.?in|crash|wings.?damage)\\b', 'damage'],
        ['explosion', 'explosion'],
        ['\\b(explode|debris|napalm)\\b', 'explosion'],
        ['weapons?\\/', 'weapon'],
        ['\\b(cannon|vulcan|m61|missile|bomb|rocket|flare|chaff|catapult)\\b', 'weapon'],
        ['gear|landing|wheel|tire|brake', 'gear'],
        ['wind|turbulence|highspeed|plane.?wing', 'wind'],
        ['environment|terrain|sea|water|rain|thunder', 'environment'],
        ['radio|comm|intercom|voice|static', 'radio'],
        ['ui[\\/]|menu|cursor', 'ui'],
        ['cockpit', 'cockpit_switch'],
        ['aircraft', 'generic'],
    ];
    return patterns.map(([m, t]) => ({ match: new RegExp(m, 'i'), type: t }));
}
