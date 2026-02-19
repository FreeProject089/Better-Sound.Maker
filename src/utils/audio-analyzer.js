/**
 * audio-analyzer.js — Audio file analysis + smart type detection
 * Analyzes audio properties and determines sound type from SDEF paths
 */

/**
 * Sound type definitions with DCS-appropriate defaults
 */
const SOUND_TYPES = {
    cockpit_switch: {
        label: 'Cockpit Switch',
        icon: '🔘',
        inner_radius: 50,
        gain: 1,
        detached: true,
        description: 'Short one-shot click sounds'
    },
    betty: {
        label: 'Betty / Voice',
        icon: '🗣️',
        inner_radius: 50,
        gain: 1,
        detached: true,
        description: 'Voice alerts (Betty callouts)'
    },
    tones: {
        label: 'Tones / RWR',
        icon: '📟',
        inner_radius: 50,
        gain: 1,
        detached: false,
        description: 'Warning tones, RWR, stall horn'
    },
    engine: {
        label: 'Engine',
        icon: '🔥',
        inner_radius: 200,
        outer_radius: 12000,
        gain: 1,
        detached: false,
        description: 'Engine loops — idle, power, afterburner'
    },
    engine_start: {
        label: 'Engine Start',
        icon: '🔑',
        inner_radius: 150,
        outer_radius: 5000,
        gain: 1,
        detached: true,
        description: 'Engine startup/shutdown sequences'
    },
    engine_internal: {
        label: 'Engine (Internal)',
        icon: '🎧',
        inner_radius: 50,
        gain: 0.9,
        detached: false,
        description: 'Engine heard from cockpit'
    },
    weapon: {
        label: 'Weapon',
        icon: '💥',
        inner_radius: 500,
        outer_radius: 15000,
        gain: 1,
        detached: true,
        description: 'Weapon fire, launch, impact'
    },
    apu: {
        label: 'APU',
        icon: '⚙️',
        inner_radius: 100,
        outer_radius: 3000,
        gain: 1,
        detached: false,
        description: 'Auxiliary power unit'
    },
    ecs: {
        label: 'ECS / Climate',
        icon: '❄️',
        inner_radius: 50,
        gain: 0.8,
        detached: false,
        description: 'Environmental Control System / Air conditioning'
    },
    gear: {
        label: 'Landing Gear',
        icon: '🛞',
        inner_radius: 80,
        outer_radius: 2000,
        gain: 1,
        detached: true,
        description: 'Gear extension/retraction'
    },
    canopy: {
        label: 'Canopy',
        icon: '🪟',
        inner_radius: 60,
        outer_radius: 1000,
        gain: 0.9,
        detached: true,
        description: 'Canopy open/close'
    },
    wind: {
        label: 'Wind/Ambient',
        icon: '🌬️',
        inner_radius: 30,
        gain: 0.8,
        detached: false,
        description: 'Wind noise, ambient atmosphere'
    },
    flyby: {
        label: 'Flyby',
        icon: '✈️',
        inner_radius: 500,
        outer_radius: 20000,
        gain: 1,
        detached: true,
        description: 'External flyby / pass sounds'
    },
    radio: {
        label: 'Radio/Comm',
        icon: '📻',
        inner_radius: 10,
        gain: 1,
        detached: true,
        description: 'Radio communication, intercom'
    },
    explosion: {
        label: 'Explosion',
        icon: '💣',
        inner_radius: 800,
        outer_radius: 25000,
        gain: 1.3,
        detached: true,
        description: 'Explosions and impacts'
    },
    damage: {
        label: 'Damage',
        icon: '🔨',
        inner_radius: 100,
        outer_radius: 3000,
        gain: 1,
        detached: true,
        description: 'Damage effects, hits, breaking'
    },
    personnel: {
        label: 'Personnel',
        icon: '👤',
        inner_radius: 30,
        gain: 1,
        detached: false,
        description: 'Pilot breathing, pain, heartbeat'
    },
    environment: {
        label: 'Environment',
        icon: '🌍',
        inner_radius: 200,
        outer_radius: 5000,
        gain: 1,
        detached: false,
        description: 'Environmental and terrain sounds'
    },
    ui: {
        label: 'UI/Interface',
        icon: '🖱️',
        inner_radius: 10,
        gain: 1,
        detached: true,
        description: 'Interface and menu sounds'
    },
    generic: {
        label: 'Generic',
        icon: '🔊',
        inner_radius: 50,
        gain: 1,
        detached: false,
        description: 'Default sound type'
    }
};

export { SOUND_TYPES };

/**
 * Detect sound type from SDEF path
 * Uses patterns from REFERENCE_SDEF_F18 and GUIDE_SONS_F18
 */
export function detectSoundType(sdefPath) {
    const lower = sdefPath.toLowerCase();

    // ── Betty voice alerts ────────────────────────────────────
    if (/betty\//i.test(lower)) return 'betty';
    if (/\b(altitude|bingo|pull.?up|fuel.?low|check.?gear|climb|sink.?rate|roll.?left|roll.?right|roll.?out|engine.?fire|bleed.?air|flight.?computer|flight.?controls|glide.?slope|apu.?fire|mode.?4|power)\b/i.test(lower)
        && /cockpit/i.test(lower)) return 'betty';

    // ── Tones / RWR ───────────────────────────────────────────
    if (/tones?\//i.test(lower)) return 'tones';
    if (/\b(master.?caution|stall.?warn|missile.?alert|missile.?launch|special.?alert|low.?altitude|unsafe.?landing|waterfall|powerup|statuschange)\b/i.test(lower)) return 'tones';

    // ── Cockpit switches (Sw01-15, Throttle, Contactor, etc.) ─
    if (/\bsw\d+/i.test(lower)) return 'cockpit_switch';
    if (/cockpit\/.*(sw_|switch|knob|btn|button|lever|handle|contactor)/i.test(lower)) return 'cockpit_switch';
    if (/throttle.?(click|from|to|idle|off|lim)/i.test(lower)) return 'cockpit_switch';
    if (/cockpit.*click/i.test(lower)) return 'cockpit_switch';
    if (/battery\.sdef/i.test(lower)) return 'cockpit_switch';

    // ── ECS / Air conditioning ────────────────────────────────
    if (/\becs/i.test(lower)) return 'ecs';
    if (/avionics/i.test(lower)) return 'ecs';

    // ── Canopy ────────────────────────────────────────────────
    if (/canopy|hood|hatch/i.test(lower)) return 'canopy';

    // ── APU ───────────────────────────────────────────────────
    if (/apu/i.test(lower)) return 'apu';

    // ── Engine internal ──────────────────────────────────────
    if (/cockpit.*(f404|engine|afterburner|rpm|thrust|amb_in)/i.test(lower)) return 'engine_internal';
    if (/f404.*_in\b/i.test(lower)) return 'engine_internal';
    if (/afterburner_in/i.test(lower)) return 'engine_internal';

    // ── Engine start/shutdown ────────────────────────────────
    if (/(start|shutdown|spool.*up|spool.*down|ignit)/i.test(lower) && /(engine|f404|turbine)/i.test(lower)) return 'engine_start';
    if (/f404ge_(start|shutdown)/i.test(lower)) return 'engine_start';

    // ── Engine external ─────────────────────────────────────
    if (/f404|afterburner|rpm\d|thrust|nozzle|jet.?blast|back[12]/i.test(lower)) return 'engine';
    if (/engine|turbine|idle/i.test(lower)) return 'engine';

    // ── Flyby / Distant ─────────────────────────────────────
    if (/distant|flyby|fly_by|whistle|nearby.?afterburner/i.test(lower)) return 'flyby';

    // ── Personnel ───────────────────────────────────────────
    if (/personnel\//i.test(lower)) return 'personnel';
    if (/\b(pilot|heart|breath|dying|wounded|g-?loc|gasp)\b/i.test(lower)) return 'personnel';

    // ── Damage ──────────────────────────────────────────────
    if (/damage\//i.test(lower)) return 'damage';
    if (/\b(break|bullet.?hit|ricochet|burning|hit.?in|hit.?med|plane.?hit|touch|crash|wings.?damage|overload|tail.?blade|tail.?boom|rotor.?blade)\b/i.test(lower)) return 'damage';

    // ── Explosions ──────────────────────────────────────────
    if (/explosion/i.test(lower)) return 'explosion';
    if (/\b(explode|debris|napalm|impactsgau)\b/i.test(lower)) return 'explosion';

    // ── Weapons ─────────────────────────────────────────────
    if (/weapons?\//i.test(lower)) return 'weapon';
    if (/\b(cannon|vulcan|m61|missile|bomb|rocket|flare|chaff|jettison|catapult|shoot)\b/i.test(lower)) return 'weapon';

    // ── Landing gear ────────────────────────────────────────
    if (/gear|landing|wheel|tire|brake/i.test(lower)) return 'gear';

    // ── Seat ────────────────────────────────────────────────
    if (/seat.?adjust/i.test(lower)) return 'cockpit_switch';

    // ── Wind / aerodynamic ──────────────────────────────────
    if (/wind|turbulence|highspeed|air.?scoop|plane.?wing/i.test(lower)) return 'wind';

    // ── Ground / environment ────────────────────────────────
    if (/ground.?around|ground_/i.test(lower)) return 'environment';
    if (/environment|terrain|sea|water|rain|thunder/i.test(lower)) return 'environment';

    // ── Gyroscope ───────────────────────────────────────────
    if (/gyro/i.test(lower)) return 'ecs';

    // ── Radio ───────────────────────────────────────────────
    if (/radio|comm|intercom|voice|static/i.test(lower)) return 'radio';

    // ── UI ──────────────────────────────────────────────────
    if (/ui[\\/]|menu|cursor/i.test(lower)) return 'ui';

    // ── Cockpit general ────────────────────────────────────
    if (/cockpit/i.test(lower)) return 'cockpit_switch';

    // ── Fallback ────────────────────────────────────────────
    if (/aircraft/i.test(lower)) return 'generic';

    return 'generic';
}

/**
 * Get SDEF defaults for a given sound type
 */
export function getTypeDefaults(type) {
    const def = SOUND_TYPES[type] || SOUND_TYPES.generic;
    const params = {
        inner_radius: def.inner_radius,
        gain: def.gain
    };

    if (def.outer_radius) params.outer_radius = def.outer_radius;
    if (def.detached) params.detached = def.detached;

    return params;
}

/**
 * Guess loop type from SDEF path (more comprehensive)
 */
export function guessLoopType(sdefPath) {
    const type = detectSoundType(sdefPath);

    // One-shot types
    const oneShotTypes = ['cockpit_switch', 'betty', 'weapon', 'gear', 'canopy', 'flyby', 'explosion', 'damage', 'engine_start', 'radio', 'ui'];
    if (oneShotTypes.includes(type)) return 'one-shot';

    // Loop types
    const loopTypes = ['engine', 'engine_internal', 'apu', 'ecs', 'wind', 'environment', 'personnel', 'tones'];
    if (loopTypes.includes(type)) return 'loop';

    // Heuristic fallback
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

        // Recommendations
        if (buffer.sampleRate > 48000) {
            meta.recommendations.push({
                type: 'warning',
                message: `Sample rate ${buffer.sampleRate}Hz is higher than recommended (44100/48000Hz)`
            });
        }

        if (buffer.numberOfChannels > 2) {
            meta.recommendations.push({
                type: 'error',
                message: `${buffer.numberOfChannels} channels detected — DCS only supports Mono or Stereo`
            });
        }

        if (file.size > 50 * 1024 * 1024) {
            meta.recommendations.push({
                type: 'warning',
                message: 'File is very large (>50MB). Consider using .ogg for compression.'
            });
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
