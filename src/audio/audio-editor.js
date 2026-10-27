/**
 * audio-editor.js — Mini audio editor (modal)
 *
 * openAudioEditor(file) → Promise<File|null>. Trim (drag on the waveform),
 * fade in/out, gain, normalise to -1 dBFS, convert to mono, and a loop
 * crossfade that blends the end into the start so a loop has no click.
 * Preview plays the selection (looped if "Loop preview" is on). The result is
 * a 16-bit WAV named after the source.
 */

import { showModal } from '../components/modal.js';
import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { audioContext, decodeFile, encodeWav, drawWave, peakLevel, dbfs, fmtTime } from './audio-utils.js';
import './audio.css';

const T = {
    en: { title: 'Edit audio', sel: 'Selection', fin: 'Fade in', fout: 'Fade out', gain: 'Gain', norm: 'Normalise (-1 dBFS)', mono: 'Convert to mono', xfade: 'Loop crossfade', play: 'Play', stop: 'Stop', loop: 'Loop preview', reset: 'Reset', apply: 'Apply', cancel: 'Cancel', peak: 'Peak', hint: 'Drag on the waveform to select the part to keep.', monoTip: 'Mono is best for sounds placed in 3D.' },
    fr: { title: 'Modifier l\'audio', sel: 'Sélection', fin: 'Fondu entrant', fout: 'Fondu sortant', gain: 'Gain', norm: 'Normaliser (-1 dBFS)', mono: 'Convertir en mono', xfade: 'Fondu de boucle', play: 'Lire', stop: 'Stop', loop: 'Boucler l\'écoute', reset: 'Réinitialiser', apply: 'Appliquer', cancel: 'Annuler', peak: 'Crête', hint: 'Glissez sur la forme d\'onde pour choisir la partie à garder.', monoTip: 'Le mono est préférable pour les sons placés en 3D.' },
};

export async function openAudioEditor(file) {
    const t = T[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];
    const src = await decodeFile(file);
    const dur = src.duration;
    const s = { a: 0, b: dur, fin: 0, fout: 0, gain: 0, norm: false, mono: false, xfade: 0, loop: false };
    let player = null;
    let rafId = 0;
    let result = null;

    const ms = (id, label, max, step, unit) => `
      <label class="ae-ctl"><span>${label} <b id="ae-${id}-v"></b></span>
        <input type="range" id="ae-${id}" min="0" max="${max}" step="${step}" value="0" data-unit="${unit}" /></label>`;

    const done = await showModal({
        title: `${t.title} · ${file.name}`, icon: 'scissors', size: 'lg',
        content: `
          <div class="ae">
            <div class="ae-wave" id="ae-wave"><canvas></canvas><div class="ae-sel"></div><div class="ae-head"></div></div>
            <div class="ae-meta"><span id="ae-time"></span><span id="ae-peak"></span><span>${t.hint}</span></div>
            <div class="ae-transport">
              <button class="btn btn-secondary btn-sm" id="ae-play">${getIcon('play', 'w-3.5 h-3.5')} ${t.play}</button>
              <label class="ae-check"><input type="checkbox" id="ae-loop" /> ${t.loop}</label>
              <button class="btn btn-ghost btn-sm" id="ae-reset">${getIcon('rotate-ccw', 'w-3.5 h-3.5')} ${t.reset}</button>
            </div>
            <div class="ae-ctls">
              ${ms('fin', t.fin, Math.min(5, dur / 2).toFixed(2), 0.01, 's')}
              ${ms('fout', t.fout, Math.min(5, dur / 2).toFixed(2), 0.01, 's')}
              <label class="ae-ctl"><span>${t.gain} <b id="ae-gain-v"></b></span><input type="range" id="ae-gain" min="-24" max="12" step="0.5" value="0" data-unit="dB" /></label>
              ${ms('xfade', t.xfade, Math.min(1, dur / 3).toFixed(2), 0.01, 's')}
            </div>
            <div class="ae-flags">
              <label class="ae-check"><input type="checkbox" id="ae-norm" /> ${t.norm}</label>
              ${src.numberOfChannels > 1 ? `<label class="ae-check" title="${t.monoTip}"><input type="checkbox" id="ae-mono" /> ${t.mono}</label>` : ''}
            </div>
          </div>`,
        actions: [
            { id: 'cancel', label: t.cancel },
            { id: 'apply', label: `${getIcon('check', 'w-4 h-4')} ${t.apply}`, class: 'btn-primary', onClick: () => { result = render(); } },
        ],
        onRender: (ov) => wire(ov),
        onClose: () => stop(),
    });
    return done === 'apply' && result ? new File([encodeWav(result)], file.name.replace(/\.[^.]+$/, '') + '.wav', { type: 'audio/wav' }) : null;

    function wire(ov) {
        const wave = ov.querySelector('#ae-wave');
        const canvas = wave.querySelector('canvas');
        requestAnimationFrame(() => { drawWave(canvas, src); paint(); });
        const x2t = (x) => Math.max(0, Math.min(dur, (x - wave.getBoundingClientRect().left) / wave.clientWidth * dur));
        wave.addEventListener('pointerdown', (e) => {
            wave.setPointerCapture(e.pointerId);
            const start = x2t(e.clientX);
            s.a = s.b = start;
            const move = (ev) => { const v = x2t(ev.clientX); s.a = Math.min(start, v); s.b = Math.max(start, v); paint(); };
            const up = () => { if (s.b - s.a < 0.01) { s.a = 0; s.b = dur; } wave.removeEventListener('pointermove', move); paint(); };
            wave.addEventListener('pointermove', move);
            wave.addEventListener('pointerup', up, { once: true });
        });
        for (const id of ['fin', 'fout', 'gain', 'xfade']) {
            ov.querySelector(`#ae-${id}`).addEventListener('input', (e) => { s[id] = Number(e.target.value); paint(); });
        }
        ov.querySelector('#ae-norm').addEventListener('change', (e) => { s.norm = e.target.checked; paint(); });
        ov.querySelector('#ae-mono')?.addEventListener('change', (e) => { s.mono = e.target.checked; });
        ov.querySelector('#ae-loop').addEventListener('change', (e) => { s.loop = e.target.checked; if (player) { stop(); play(ov); } });
        ov.querySelector('#ae-play').addEventListener('click', () => (player ? stop() : play(ov)));
        ov.querySelector('#ae-reset').addEventListener('click', () => {
            Object.assign(s, { a: 0, b: dur, fin: 0, fout: 0, gain: 0, norm: false, xfade: 0 });
            for (const id of ['fin', 'fout', 'gain', 'xfade']) ov.querySelector(`#ae-${id}`).value = 0;
            ov.querySelector('#ae-norm').checked = false;
            paint();
        });

        function paint() {
            const sel = wave.querySelector('.ae-sel');
            sel.style.left = `${(s.a / dur) * 100}%`;
            sel.style.width = `${((s.b - s.a) / dur) * 100}%`;
            sel.style.setProperty('--fin', `${(s.fin / Math.max(0.001, s.b - s.a)) * 100}%`);
            sel.style.setProperty('--fout', `${(s.fout / Math.max(0.001, s.b - s.a)) * 100}%`);
            for (const id of ['fin', 'fout', 'xfade']) ov.querySelector(`#ae-${id}-v`).textContent = `${s[id].toFixed(2)} s`;
            ov.querySelector('#ae-gain-v').textContent = `${s.gain > 0 ? '+' : ''}${s.gain} dB`;
            ov.querySelector('#ae-time').textContent = `${t.sel}: ${fmtTime(s.a)} → ${fmtTime(s.b)} (${(s.b - s.a).toFixed(2)} s)`;
            const pk = peakLevel(src) * gainFactor(src);
            ov.querySelector('#ae-peak').textContent = `${t.peak}: ${dbfs(pk).toFixed(1)} dBFS`;
            ov.querySelector('#ae-peak').classList.toggle('is-clip', pk > 1);
        }
    }

    function gainFactor(buf) {
        if (s.norm) return 0.891 / Math.max(1e-6, peakLevel(buf)); // -1 dBFS
        return Math.pow(10, s.gain / 20);
    }

    /** Apply every setting to a new AudioBuffer. */
    function render() {
        const rate = src.sampleRate;
        const a = Math.floor(s.a * rate), b = Math.floor(s.b * rate);
        const xf = Math.min(Math.floor(s.xfade * rate), Math.floor((b - a) / 3));
        const len = b - a - xf;
        const chans = s.mono ? 1 : src.numberOfChannels;
        const out = audioContext().createBuffer(chans, Math.max(1, len), rate);
        const g = gainFactor(src);
        const fin = Math.floor(s.fin * rate), fout = Math.floor(s.fout * rate);
        for (let c = 0; c < chans; c++) {
            const o = out.getChannelData(c);
            const read = (i) => {
                if (!s.mono) return src.getChannelData(c)[i];
                let v = 0;
                for (let k = 0; k < src.numberOfChannels; k++) v += src.getChannelData(k)[i];
                return v / src.numberOfChannels;
            };
            for (let i = 0; i < len; i++) {
                let v = read(a + i);
                // Loop crossfade: the tail (len..len+xf) fades into the head
                if (i < xf) { const k = i / xf; v = v * k + read(a + len + i) * (1 - k); }
                let env = 1;
                if (fin && i < fin) env *= i / fin;
                if (fout && i > len - fout) env *= (len - i) / fout;
                o[i] = v * g * env;
            }
        }
        return out;
    }

    function play(ov) {
        const ac = audioContext();
        const buf = render();
        player = ac.createBufferSource();
        player.buffer = buf;
        player.loop = s.loop;
        player.connect(ac.destination);
        const t0 = ac.currentTime;
        player.start();
        player.onended = () => stop();
        const btn = ov.querySelector('#ae-play');
        btn.innerHTML = `${getIcon('square', 'w-3.5 h-3.5')} ${t.stop}`;
        const head = ov.querySelector('.ae-head');
        const tick = () => {
            const pos = ((ac.currentTime - t0) % buf.duration) + s.a;
            head.style.left = `${(pos / dur) * 100}%`;
            head.style.opacity = 1;
            rafId = requestAnimationFrame(tick);
        };
        tick();
        stop.ov = ov;
    }

    function stop() {
        cancelAnimationFrame(rafId);
        try { player?.stop(); } catch { /* already stopped */ }
        player = null;
        const ov = stop.ov;
        if (ov?.isConnected !== false) {
            const btn = ov?.querySelector('#ae-play');
            if (btn) btn.innerHTML = `${getIcon('play', 'w-3.5 h-3.5')} ${t.play}`;
            const head = ov?.querySelector('.ae-head');
            if (head) head.style.opacity = 0;
        }
    }
}
