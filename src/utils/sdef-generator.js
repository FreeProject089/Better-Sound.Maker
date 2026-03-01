/**
 * sdef-generator.js — Generate SDEF file content from structured data
 */

const SDEF_PARAMS = [
    { key: 'inherit', type: 'string', default: '', group: 'include', desc: 'Name of .sdef to inherit settings from' },
    { key: 'wave', type: 'wave', default: '', group: 'sample', desc: 'Sound sample file path relative to Sounds/ directory' },
    { key: 'gain', type: 'number', default: 1.0, group: 'volume', desc: 'Gain multiplier (linear)' },
    { key: 'pitch', type: 'number', default: 1.0, group: 'frequency', desc: 'Source frequency multiplier' },
    { key: 'lowpass', type: 'number', default: 24000, group: 'filtering', desc: 'Source lowpass filter cutoff frequency (Hz)' },
    { key: 'position', type: 'vec3', default: [0, 0, 0], group: 'position', desc: 'Position relative to host {forward, up, right} in meters' },
    { key: 'silent_radius', type: 'number', default: 0, group: 'radius', desc: 'Inside this radius the sound is silent' },
    { key: 'peak_radius', type: 'number', default: 0, group: 'radius', desc: 'At this radius gain is at maximum' },
    { key: 'inner_radius', type: 'number', default: 1, group: 'radius', desc: 'Reference distance — gain is 0.85 of max' },
    { key: 'outer_radius', type: 'number', default: 1000, group: 'radius', desc: 'Beyond this radius the source is silent' },
    { key: 'direction', type: 'vec3', default: [0, 0, 0], group: 'cone', desc: 'Direction relative to host {forward, up, right}' },
    { key: 'cone_inner_angle', type: 'number', default: 0, group: 'cone', desc: 'Inside this cone (half-angle 0-180°) gain is at max' },
    { key: 'cone_outer_angle', type: 'number', default: 0, group: 'cone', desc: 'Outside this cone (half-angle 0-180°) gain is at cone_outer_gain' },
    { key: 'cone_outer_gain', type: 'number', default: 1, group: 'cone', desc: 'Gain outside cone_outer_angle' },
    { key: 'cone_outer_lowpass', type: 'number', default: 24000, group: 'cone', desc: 'Cutoff frequency outside cone_outer_angle' },
    { key: 'detached', type: 'boolean', default: false, group: 'playmode', desc: 'If true, always plays the whole sample (explosions, gunshots)' },
    { key: 'streaming', type: 'boolean', default: false, group: 'playmode', desc: 'If true, samples are streamed from disk instead of memory' },
    { key: 'listmode', type: 'enum', values: ['RANDOM', 'SEQUENCE', 'ASR'], default: 'RANDOM', group: 'playmode', desc: 'RANDOM=one random sample, SEQUENCE=play all, ASR=first on start then loop rest' },
    { key: 'attack', type: 'number', default: 0.0, group: 'envelope', desc: 'Time (seconds) for initial volume rise from 0 to peak' },
    { key: 'release', type: 'number', default: 0.0, group: 'envelope', desc: 'Time (seconds) for volume decay to zero when stopping' },
    { key: 'auto_width', type: 'boolean', default: true, group: 'stereo', desc: 'If false, panorama width won\'t change with distance' },
    { key: 'nodoppler', type: 'boolean', default: true, group: 'doppler', desc: 'If true, Doppler effect won\'t affect sound' },
    { key: 'distance_filter_offset', type: 'number', default: 0, group: 'filtering', desc: 'Distance at which lowpass filter begins to affect sound' }
];

export { SDEF_PARAMS };

/**
 * Generate SDEF text from a params object
 */
export function generateSdef(params) {
    const lines = [
        '-- Generated with Better ModMaker',
        ''
    ];

    // Wave
    if (params.wave) {
        if (Array.isArray(params.wave) && params.wave.length > 1) {
            lines.push('wave = {');
            params.wave.forEach((w, i) => {
                const comma = i < params.wave.length - 1 ? ',' : '';
                lines.push(`\t"${w}"${comma}`);
            });
            lines.push('\t}');
        } else {
            const w = Array.isArray(params.wave) ? params.wave[0] : params.wave;
            if (w) lines.push(`wave = "${w}"`);
        }
    }

    // Other params
    for (const def of SDEF_PARAMS) {
        if (def.key === 'wave') continue;
        const val = params[def.key];
        if (val === undefined || val === '' || val === null) continue;

        // Always include inner_radius and gain — they are critical for audibility
        // (DCS default inner_radius=1 is too small, and gain should always be explicit)
        const alwaysInclude = ['inner_radius', 'gain'];
        if (!alwaysInclude.includes(def.key)) {
            // Skip other params if they match defaults
            if (JSON.stringify(val) === JSON.stringify(def.default)) continue;
        }

        if (def.type === 'string') {
            lines.push(`${def.key} = "${val}"`);
        } else if (def.type === 'vec3') {
            lines.push(`${def.key} = {${val[0]}, ${val[1]}, ${val[2]}}`);
        } else if (def.type === 'boolean') {
            lines.push(`${def.key} = ${val}`);
        } else if (def.type === 'enum') {
            lines.push(`${def.key} = ${val}`);
        } else {
            lines.push(`${def.key} = ${val}`);
        }
    }

    return lines.join('\n') + '\n';
}

/**
 * Parse an existing SDEF text into a params object
 */
export function parseSdef(text) {
    const params = {};
    const lines = text.split(/\r?\n/).map(line => {
        const hashIdx = line.indexOf('--');
        return hashIdx >= 0 ? line.substring(0, hashIdx).trim() : line.trim();
    }).filter(Boolean);

    let inWaveList = false;
    const waveList = [];

    for (const line of lines) {
        if (inWaveList) {
            if (line === '}') {
                inWaveList = false;
                params.wave = waveList.slice();
                continue;
            }
            const match = line.match(/"([^"]+)"/);
            if (match) waveList.push(match[1]);
            continue;
        }

        if (line.toLowerCase().startsWith('wave') && line.includes('{')) {
            inWaveList = true;
            waveList.length = 0;
            // Check if it's a single-line list
            const singleMatch = line.match(/wave\s*=\s*\{(.+)\}/);
            if (singleMatch) {
                inWaveList = false;
                const items = singleMatch[1].match(/"([^"]+)"/g);
                if (items) {
                    params.wave = items.map(i => i.replace(/"/g, ''));
                }
            }
            continue;
        }

        const kv = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (kv) {
            const [, key, rawVal] = kv;
            let val = rawVal.trim();

            // String
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
                if (key.toLowerCase() === 'wave') {
                    params.wave = [val];
                } else {
                    params[key] = val;
                }
                continue;
            }

            // Vec3
            if (val.startsWith('{') && val.endsWith('}')) {
                const nums = val.slice(1, -1).split(',').map(n => parseFloat(n.trim()));
                params[key] = nums;
                continue;
            }

            // Boolean
            if (val.toLowerCase() === 'true' || val.toLowerCase() === 'false') {
                params[key] = val.toLowerCase() === 'true';
                continue;
            }

            // Enum or number
            const num = parseFloat(val);
            if (!isNaN(num) && String(num) === val) {
                params[key] = num;
            } else {
                params[key] = val; // enum like RANDOM, SEQUENCE, ASR
            }
        }
    }

    return params;
}
