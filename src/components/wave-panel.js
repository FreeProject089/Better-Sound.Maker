/**
 * wave-panel.js — "Sound samples" block of the SDEF editor
 *
 * Replaces the old one-path-per-line textarea with a list: each `wave` shows
 * its path and the audio attached to it, and has Play / Listen / Edit /
 * Attach / move / remove buttons; audio can be dropped on a row. Adding a
 * sample: drop an audio file on the zone (its path is derived from the SDEF
 * folder and the file name), or type/pick a path from the library.
 *
 * A hidden <textarea data-param="wave"> keeps the editor's collect/save code
 * unchanged: every edit rewrites it and fires `input`.
 */

import {
    getState, getAudioFile, getWaveAudioFile, setAudioFile, setWaveAudioFile,
} from '../state/store.js';
import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { showToast } from './toast.js';
import '../audio/audio.css';

const T = {
    en: { none: 'Original DCS audio (not replaced)', add: 'Add', addPh: 'Effects/Folder/sound (path relative to Sounds/)', drop: 'Drop audio files here to add samples, or click to browse', play: 'Play', listen: 'Listen at distance / compare A-B', edit: 'Edit audio (trim, fades, loop…)', attach: 'Attach audio', up: 'Move up', down: 'Move down', remove: 'Remove', hint: 'Several samples: DCS picks one at random (listmode RANDOM), plays them in order (SEQUENCE) or plays the first then loops the others (ASR).', onlyAudio: 'Only .wav and .ogg files' },
    fr: { none: 'Audio d\'origine DCS (non remplacé)', add: 'Ajouter', addPh: 'Effects/Dossier/son (chemin relatif à Sounds/)', drop: 'Déposez des fichiers audio ici pour ajouter des échantillons, ou cliquez pour parcourir', play: 'Lire', listen: 'Écouter à distance / comparer A-B', edit: 'Modifier l\'audio (découpe, fondus, boucle…)', attach: 'Associer un audio', up: 'Monter', down: 'Descendre', remove: 'Retirer', hint: 'Plusieurs échantillons : DCS en choisit un au hasard (listmode RANDOM), les joue dans l\'ordre (SEQUENCE) ou joue le premier puis boucle les autres (ASR).', onlyAudio: 'Fichiers .wav et .ogg uniquement' },
};
const t = () => T[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];

let preview = null;

export function audioForWave(sdefPath, wave, waves) {
    return getWaveAudioFile(sdefPath, wave) || (waves.length <= 1 ? getAudioFile(sdefPath) : null) || null;
}

export function renderWavePanel(sdefPath, waves) {
    const u = t();
    const libWaves = libraryWaves(sdefPath);
    return `
      <div class="wv" data-wave-panel>
        <textarea data-param="wave" hidden>${escapeHtml(waves.join('\n'))}</textarea>
        ${waves.map((w, i) => {
            const file = audioForWave(sdefPath, w, waves);
            return `<div class="wv-row ${file ? 'has-audio' : ''}" data-i="${i}">
              <span class="wv-num">${i + 1}</span>
              <div class="wv-main"><span class="wv-path" title="${escapeHtml(w)}">${escapeHtml(w)}</span>
                <span class="wv-file">${file ? `${getIcon('file-audio', 'w-3 h-3')} ${escapeHtml(file.name)}` : u.none}</span></div>
              <div class="wv-acts">
                ${file ? `<button class="btn btn-ghost btn-sm btn-icon" data-act="play" title="${u.play}">${getIcon('play', 'w-3.5 h-3.5')}</button>
                  <button class="btn btn-ghost btn-sm btn-icon" data-act="listen" title="${u.listen}">${getIcon('headphones', 'w-3.5 h-3.5')}</button>
                  <button class="btn btn-ghost btn-sm btn-icon" data-act="edit" title="${u.edit}">${getIcon('scissors', 'w-3.5 h-3.5')}</button>` : ''}
                <button class="btn btn-ghost btn-sm btn-icon" data-act="attach" title="${u.attach}">${getIcon('upload', 'w-3.5 h-3.5')}</button>
                ${i > 0 ? `<button class="btn btn-ghost btn-sm btn-icon" data-act="up" title="${u.up}">${getIcon('chevron-up', 'w-3.5 h-3.5')}</button>` : ''}
                ${i < waves.length - 1 ? `<button class="btn btn-ghost btn-sm btn-icon" data-act="down" title="${u.down}">${getIcon('chevron-down', 'w-3.5 h-3.5')}</button>` : ''}
                <button class="btn btn-ghost btn-sm btn-icon" data-act="remove" title="${u.remove}">${getIcon('trash-2', 'w-3.5 h-3.5')}</button>
              </div></div>`;
        }).join('')}
        <div class="wv-drop" data-drop>${getIcon('upload-cloud', 'w-4 h-4')} ${u.drop}</div>
        <div class="wv-add">
          <input class="input-field" list="wv-lib" data-add-input placeholder="${u.addPh}" />
          <datalist id="wv-lib">${libWaves.map(w => `<option value="${escapeHtml(w)}"></option>`).join('')}</datalist>
          <button class="btn btn-secondary btn-sm" data-add>${getIcon('plus', 'w-3.5 h-3.5')} ${u.add}</button>
        </div>
        ${waves.length > 1 ? `<div class="wv-hint">${u.hint}</div>` : ''}
        <input type="file" accept=".wav,.ogg,audio/wav,audio/ogg" data-file hidden multiple />
      </div>`;
}

/**
 * @param {HTMLElement} root  element containing the panel
 * @param {string} sdefPath
 * @param {() => object} getParams  current SDEF params (for Listen)
 * @param {() => void} rerender     redraw the panel after a change
 */
export function attachWavePanel(root, sdefPath, getParams, rerender) {
    const panel = root.querySelector('[data-wave-panel]');
    if (!panel) return;
    const area = panel.querySelector('textarea[data-param="wave"]');
    const waves = () => area.value.split('\n').map(s => s.trim()).filter(Boolean);
    const commit = (list) => {
        area.value = list.join('\n');
        area.dispatchEvent(new Event('input', { bubbles: true }));
        rerender();
    };
    const fileInput = panel.querySelector('[data-file]');
    let pickTarget = null;

    const attach = async (wave, file) => {
        if (!/\.(wav|ogg)$/i.test(file.name)) { showToast(t().onlyAudio, 'warning'); return; }
        const { analyzeAudioFile } = await import('../utils/audio-analyzer.js');
        const meta = await analyzeAudioFile(file).catch(() => ({ name: file.name, size: file.size }));
        if (waves().length <= 1) await setAudioFile(sdefPath, file, meta);
        else await setWaveAudioFile(sdefPath, wave, file, meta);
    };

    const addFiles = async (files) => {
        const list = waves();
        for (const f of files) {
            if (!/\.(wav|ogg)$/i.test(f.name)) { showToast(t().onlyAudio, 'warning'); continue; }
            const wave = deriveWave(sdefPath, list, f.name);
            if (!list.includes(wave)) list.push(wave);
            area.value = list.join('\n');
            await attach(wave, f);
        }
        commit(list);
    };

    panel.querySelectorAll('.wv-row').forEach(row => {
        const i = Number(row.dataset.i);
        row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('is-drop'); });
        row.addEventListener('dragleave', () => row.classList.remove('is-drop'));
        row.addEventListener('drop', async (e) => {
            e.preventDefault();
            row.classList.remove('is-drop');
            const f = e.dataTransfer.files[0];
            if (f) { await attach(waves()[i], f); rerender(); }
        });
        row.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', async () => {
            const list = waves();
            const w = list[i];
            const file = audioForWave(sdefPath, w, list);
            switch (btn.dataset.act) {
                case 'play': togglePreview(file, btn); break;
                case 'listen': (await import('../audio/audition.js')).openAudition({ sdefPath, params: getParams(), file, wave: w }); break;
                case 'edit': {
                    const edited = await (await import('../audio/audio-editor.js')).openAudioEditor(file);
                    if (edited) { await attach(w, edited); rerender(); }
                    break;
                }
                case 'attach': pickTarget = w; fileInput.multiple = false; fileInput.click(); break;
                case 'up': [list[i - 1], list[i]] = [list[i], list[i - 1]]; commit(list); break;
                case 'down': [list[i + 1], list[i]] = [list[i], list[i + 1]]; commit(list); break;
                case 'remove': list.splice(i, 1); commit(list); break;
            }
        }));
    });

    const drop = panel.querySelector('[data-drop]');
    drop.addEventListener('click', () => { pickTarget = null; fileInput.multiple = true; fileInput.click(); });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-drop'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-drop'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-drop'); addFiles([...e.dataTransfer.files]); });

    fileInput.addEventListener('change', async () => {
        const files = [...fileInput.files];
        fileInput.value = '';
        if (!files.length) return;
        if (pickTarget) { await attach(pickTarget, files[0]); rerender(); } else addFiles(files);
    });

    const addInput = panel.querySelector('[data-add-input]');
    const add = () => {
        const v = addInput.value.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^Sounds\//i, '');
        if (!v) return;
        const list = waves();
        if (!list.includes(v)) list.push(v);
        commit(list);
    };
    panel.querySelector('[data-add]').addEventListener('click', add);
    addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
}

function togglePreview(file, btn) {
    if (preview) { preview.pause(); preview.btn.innerHTML = getIcon('play', 'w-3.5 h-3.5'); const same = preview.btn === btn; preview = null; if (same) return; }
    const audio = new Audio(URL.createObjectURL(file));
    audio.btn = btn;
    btn.innerHTML = getIcon('square', 'w-3.5 h-3.5');
    audio.onended = () => { btn.innerHTML = getIcon('play', 'w-3.5 h-3.5'); preview = null; };
    audio.play();
    preview = audio;
}

/** Folder of the existing samples (or of the SDEF) + the file's name. */
function deriveWave(sdefPath, list, fileName) {
    const base = fileName.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_');
    const dir = list.length ? list[0].split('/').slice(0, -1).join('/') : `Effects/${sdefPath.split('/').slice(0, -1).join('/')}`;
    return `${dir}/${base}`.replace(/\/+/g, '/');
}

function libraryWaves(sdefPath) {
    const sections = getState().libraryData?.sections || [];
    const dir = sdefPath.split('/').slice(0, -1).join('/').toLowerCase();
    const out = new Set();
    for (const sec of sections) {
        for (const a of sec.assets || []) {
            for (const w of a.waves || []) {
                if (!dir || w.toLowerCase().includes(dir.split('/').pop())) out.add(w);
                if (out.size >= 300) return [...out];
            }
        }
    }
    return [...out];
}
