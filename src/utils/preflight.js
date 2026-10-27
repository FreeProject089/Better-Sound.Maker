/**
 * preflight.js — Checks run before building a mod
 *
 * quickCheck() uses what is already in memory (instant). deepCheck() decodes
 * the attached audio to find clipping, silence and clicks at loop points.
 * Each finding: { level: 'error'|'warning'|'info', message, sdef? }.
 * Errors don't block the build, they are shown first.
 */

import { getState, getAudioFile, getWaveAudioFile, getSdefContent } from '../state/store.js';
import { parseSdef } from './sdef-generator.js';
import { lintSdef } from './sdef-lint.js';
import { guessLoopType } from './audio-analyzer.js';
import { getCurrentLanguage } from './i18n.js';

const M = {
    en: {
        noName: 'The mod has no name.', noAuthor: 'The mod has no author.', noAssets: 'No sound is selected.',
        noAudio: 'No audio attached: the game keeps its own sound.', unsaved: 'Unsaved edits: the build uses the last saved version.',
        lint: '{msg}', stereo3d: 'Stereo audio on a sound placed in 3D: DCS positions mono better.', big: 'Large file ({mb} MB): consider OGG.',
        noWave: 'The SDEF has no wave: it will be silent.', clip: 'Clipping: peaks reach 0 dBFS.', silent: 'The audio is (almost) silent.',
        click: 'Loop click: the end does not join the start (use the audio editor\'s loop crossfade).', ok: 'Everything looks good.',
    },
    fr: {
        noName: 'Le mod n\'a pas de nom.', noAuthor: 'Le mod n\'a pas d\'auteur.', noAssets: 'Aucun son n\'est sélectionné.',
        noAudio: 'Aucun audio associé : le jeu garde son propre son.', unsaved: 'Modifications non enregistrées : la construction utilise la dernière version enregistrée.',
        lint: '{msg}', stereo3d: 'Audio stéréo sur un son placé en 3D : DCS positionne mieux le mono.', big: 'Fichier lourd ({mb} Mo) : pensez à l\'OGG.',
        noWave: 'Le SDEF n\'a pas de wave : il sera muet.', clip: 'Saturation : les crêtes atteignent 0 dBFS.', silent: 'L\'audio est (presque) muet.',
        click: 'Clic de boucle : la fin ne rejoint pas le début (utilisez le fondu de boucle de l\'éditeur audio).', ok: 'Tout semble bon.',
    },
};
const m = () => M[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];
const COCKPIT = /cockpit|cpt|_int\b|internal|betty|radio|intercom|music|ui\//i;

function audioFiles(key, asset) {
    const text = getState().unsavedSdefs?.[key] || getSdefContent(key) || asset.sdefContent || '';
    const parsed = parseSdef(text).wave;
    const waves = asset.customWaves || asset.originalAsset?.waves || (Array.isArray(parsed) ? parsed : parsed ? [parsed] : []);
    const found = waves.map(w => [w, getWaveAudioFile(key, w) || (waves.length <= 1 ? getAudioFile(key) : null)]).filter(([, f]) => f);
    if (!found.length && getAudioFile(key)) found.push(['', getAudioFile(key)]);
    return found;
}

export function quickCheck() {
    const s = getState();
    const out = [];
    const add = (level, message, sdef) => out.push({ level, message, sdef });
    const cfg = s.projectConfig || {};
    if (!cfg.modName) add('error', m().noName);
    if (!cfg.author) add('warning', m().noAuthor);
    const entries = Object.entries(s.selectedAssets || {});
    if (!entries.length) add('error', m().noAssets);

    for (const [key, asset] of entries) {
        const text = getSdefContent(key) || asset.sdefContent || '';
        if (s.unsavedSdefs?.[key]) add('warning', m().unsaved, key);
        const files = audioFiles(key, asset);
        if (!files.length) add('info', m().noAudio, key);
        if (text) {
            for (const f of lintSdef(parseSdef(text))) {
                if (f.level === 'error') add('error', f.message, key);
            }
        }
        const metas = [asset.audioMeta, ...Object.values(asset.waveAudioFiles || {}).map(w => w.audioMeta)].filter(Boolean);
        if (metas.some(mm => mm.channels > 1) && !COCKPIT.test(key)) add('warning', m().stereo3d, key);
        for (const [, f] of files) if (f.size > 20 * 1048576) add('warning', m().big.replace('{mb}', (f.size / 1048576).toFixed(0)), key);
    }
    return sort(out);
}

/** Decode every attached file: clipping, silence, loop clicks. */
export async function deepCheck(progress = () => {}) {
    const out = quickCheck();
    const entries = Object.entries(getState().selectedAssets || {});
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
    let i = 0;
    for (const [key, asset] of entries) {
        progress(++i, entries.length, key);
        for (const [, f] of audioFiles(key, asset)) {
            let buf;
            try { buf = await ctx.decodeAudioData(await f.arrayBuffer()); } catch { continue; }
            let peak = 0;
            const d = buf.getChannelData(0);
            for (let k = 0; k < d.length; k++) { const v = Math.abs(d[k]); if (v > peak) peak = v; }
            if (peak >= 0.999) out.push({ level: 'warning', message: m().clip, sdef: key });
            if (peak < 0.003) out.push({ level: 'warning', message: m().silent, sdef: key });
            if (guessLoopType(key) === 'loop' && d.length > 64) {
                const jump = Math.abs(d[d.length - 1] - d[0]);
                if (jump > 0.12 && jump > peak * 0.25) out.push({ level: 'warning', message: m().click, sdef: key });
            }
        }
    }
    return sort(out);
}

export const okMessage = () => m().ok;

function sort(list) {
    const rank = { error: 0, warning: 1, info: 2 };
    return list.sort((a, b) => rank[a.level] - rank[b.level]);
}
