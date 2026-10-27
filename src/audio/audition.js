/**
 * audition.js — "Listen" window: distance simulation + A/B comparison
 *
 * openAudition({ sdefPath, params, file, wave })
 *
 * Distance: plays your audio through the SDEF as DCS would at that distance —
 * gain × attenuation curve (gainAtDistance), pitch, lowpass, and the
 * distance filter past distance_filter_offset (an approximation: DCS' exact
 * air-absorption curve isn't documented). Presets: cockpit, 10 m, 100 m, 1 km…
 *
 * A/B: switches instantly between your sound (A) and the original (B). B is
 * found in the DCS install for module sounds (CoreMods/Mods); base-game sounds
 * are packed in Sounds.edce, so you can drop a reference file instead.
 * Both play in sync, so switching keeps the position.
 */

import { showModal } from '../components/modal.js';
import { getState } from '../state/store.js';
import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { attenuationRadii, gainAtDistance } from '../utils/sdef-lint.js';
import { audioContext, decodeFile, drawWave } from './audio-utils.js';
import './audio.css';

const T = {
    en: { title: 'Listen', dist: 'Distance', yours: 'A · Yours', orig: 'B · Original', play: 'Play', stop: 'Stop', loop: 'Loop', apply: 'Apply SDEF (gain, curve, pitch, filter)', gain: 'Gain here', looking: 'Looking for the original…', notFound: 'Not found in your DCS modules: base-game sounds are packed (Sounds.edce) and can\'t be read.', drop: 'Drop or pick a reference file', pick: 'Choose a reference file (or drop it here)', how: '<b>A</b> is your sound, <b>B</b> the original. Press Play, then click A or B (or press the A / B keys): both play in sync, so you hear the difference instantly. Move the distance slider to hear it as in game.', noDcs: 'Set your DCS folder in Settings to load originals.', web: 'Loading originals needs the desktop app: drop a reference file instead.', tip: 'Press Space to play/stop, A/B to switch.', cockpit: 'Cockpit' },
    fr: { title: 'Écouter', dist: 'Distance', yours: 'A · Le vôtre', orig: 'B · Original', play: 'Lire', stop: 'Stop', loop: 'Boucle', apply: 'Appliquer le SDEF (gain, courbe, hauteur, filtre)', gain: 'Gain ici', looking: 'Recherche de l\'original…', notFound: 'Introuvable dans vos modules DCS : les sons de base sont compressés (Sounds.edce) et illisibles.', drop: 'Déposez ou choisissez un fichier de référence', pick: 'Choisir un fichier de référence (ou le déposer ici)', how: '<b>A</b> est votre son, <b>B</b> l\'original. Appuyez sur Lire, puis cliquez sur A ou B (ou touches A / B) : les deux jouent en même temps, vous entendez la différence tout de suite. Le curseur de distance fait entendre le son comme en jeu.', noDcs: 'Indiquez votre dossier DCS dans Paramètres pour charger les originaux.', web: 'Charger les originaux nécessite l\'application de bureau : déposez un fichier de référence.', tip: 'Espace pour lire/arrêter, A/B pour basculer.', cockpit: 'Cockpit' },
};

export async function openAudition({ sdefPath, params = {}, file, wave, originals = [] }) {
    const t = T[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];
    const ac = audioContext();
    const r = attenuationRadii(params);
    const maxD = Math.max(r.outer * 1.05, 10);
    const bufA = await decodeFile(file);
    let bufB = null;
    let side = 'A';
    let distance = Math.min(r.inner, maxD);
    let applySdef = true;
    let loop = true;
    let nodes = null;

    const presets = [[0, t.cockpit], [10, '10 m'], [100, '100 m'], [1000, '1 km'], [5000, '5 km']].filter(([d]) => d <= maxD);
    const sliderToD = (v) => (Math.pow(10, v * Math.log10(maxD + 1)) - 1);
    const dToSlider = (d) => Math.log10(d + 1) / Math.log10(maxD + 1);

    await showModal({
        title: `${t.title} · ${escapeHtml(sdefPath.split('/').pop())}`, icon: 'headphones', size: 'lg',
        content: `
          <div class="au">
            <p class="au-how">${t.how}</p>
            <div class="au-ab">
              <button class="au-side on" data-side="A"><canvas></canvas><span>${t.yours}</span></button>
              <button class="au-side" data-side="B" id="au-b"><canvas></canvas><span>${t.orig}</span><em id="au-b-status">${t.looking}</em>
                <i class="au-b-pick" id="au-b-pick" hidden>${getIcon('file-plus', 'w-4 h-4')} ${t.pick}</i></button>
            </div>
            <div class="au-dist">
              <div class="au-dist-head"><b>${t.dist}</b><span id="au-d"></span><span class="au-g" id="au-g"></span></div>
              <input type="range" id="au-slider" min="0" max="1" step="0.001" value="${dToSlider(distance)}" />
              <div class="au-presets">${presets.map(([d, l]) => `<button class="btn btn-ghost btn-sm" data-d="${d}">${l}</button>`).join('')}
                <span class="au-mark" style="left:${dToSlider(r.inner) * 100}%">inner</span><span class="au-mark" style="left:${dToSlider(r.outer) * 100}%">outer</span></div>
            </div>
            <div class="au-row">
              <button class="btn btn-primary" id="au-play">${getIcon('play', 'w-4 h-4')} ${t.play}</button>
              <label class="ae-check"><input type="checkbox" id="au-loop" checked /> ${t.loop}</label>
              <label class="ae-check"><input type="checkbox" id="au-apply" checked /> ${t.apply}</label>
            </div>
            <p class="au-tip">${t.tip}</p>
            <input type="file" id="au-file" accept=".wav,.ogg,audio/*" hidden />
          </div>`,
        actions: [],
        onRender: (ov) => wire(ov),
        onClose: () => { stop(); removeEventListener('keydown', onKey, true); },
    });

    function onKey(e) {
        if (e.target.closest?.('input[type=text], textarea')) return;
        const ov = document.querySelector('.au');
        if (!ov) return;
        if (e.code === 'Space') { e.preventDefault(); nodes ? stop() : play(); }
        if (e.key.toLowerCase() === 'a') switchTo('A');
        if (e.key.toLowerCase() === 'b') switchTo('B');
    }

    function wire(ov) {
        requestAnimationFrame(() => drawWave(ov.querySelector('[data-side="A"] canvas'), bufA, { color: '#60a5fa' }));
        ov.querySelectorAll('.au-side').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.side === 'B' && !bufB) { ov.querySelector('#au-file').click(); return; }
            switchTo(b.dataset.side);
        }));
        ov.querySelector('#au-file').addEventListener('change', async (e) => { if (e.target.files[0]) await setB(e.target.files[0], ov); });
        const bBtn = ov.querySelector('#au-b');
        bBtn.addEventListener('dragover', (e) => { e.preventDefault(); bBtn.classList.add('is-drop'); });
        bBtn.addEventListener('dragleave', () => bBtn.classList.remove('is-drop'));
        bBtn.addEventListener('drop', async (e) => { e.preventDefault(); bBtn.classList.remove('is-drop'); if (e.dataTransfer.files[0]) await setB(e.dataTransfer.files[0], ov); });

        ov.querySelector('#au-slider').addEventListener('input', (e) => { distance = sliderToD(Number(e.target.value)); update(ov); });
        ov.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
            distance = Number(b.dataset.d);
            ov.querySelector('#au-slider').value = dToSlider(distance);
            update(ov);
        }));
        ov.querySelector('#au-play').addEventListener('click', () => (nodes ? stop() : play()));
        ov.querySelector('#au-loop').addEventListener('change', (e) => { loop = e.target.checked; if (nodes) { stop(); play(); } });
        ov.querySelector('#au-apply').addEventListener('change', (e) => { applySdef = e.target.checked; update(ov); });
        addEventListener('keydown', onKey, true);
        update(ov);
        findOriginal(ov);
    }

    async function findOriginal(ov) {
        const st = ov.querySelector('#au-b-status');
        const dcs = getState().globalSettings?.dcsPath;
        if (!window.nativeAPI) { st.textContent = t.web; ov.querySelector('#au-b-pick').hidden = false; return; }
        const showPick = (msg) => { st.textContent = msg; ov.querySelector('#au-b-pick').hidden = false; };
        if (!dcs) { showPick(t.noDcs); return; }
        let path = null;
        for (const w of (originals.length ? originals : [wave]).filter(Boolean)) {
            path = await window.nativeAPI.findDcsWave(dcs, w).catch(() => null);
            if (path) break;
        }
        if (!path) { showPick(t.notFound); return; }
        const bytes = await window.nativeAPI.readFile(path);
        await setB(new File([bytes], path.split('/').pop()), ov);
    }

    async function setB(f, ov) {
        try {
            bufB = await decodeFile(f);
            ov.querySelector('#au-b-status').textContent = f.name;
            ov.querySelector('#au-b-pick').hidden = true;
            requestAnimationFrame(() => drawWave(ov.querySelector('[data-side="B"] canvas'), bufB, { color: '#a78bfa' }));
            if (nodes) { stop(); play(); }
        } catch (e) {
            ov.querySelector('#au-b-status').textContent = e.message;
        }
    }

    function sdefGain() {
        if (!applySdef) return 1;
        const g = typeof params.gain === 'number' ? params.gain : 1;
        return g * gainAtDistance(distance, r);
    }

    function lowpass() {
        if (!applySdef) return 22000;
        let f = typeof params.lowpass === 'number' ? params.lowpass : 22000;
        // Air absorption past the filter offset (approximation)
        const off = typeof params.distance_filter_offset === 'number' ? params.distance_filter_offset : 0;
        if (distance > off) f = Math.min(f, 22000 / (1 + (distance - off) / 300));
        return Math.max(200, Math.min(22000, f));
    }

    function update(ov) {
        ov.querySelector('#au-d').textContent = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance.toFixed(distance < 10 ? 1 : 0)} m`;
        const g = sdefGain();
        ov.querySelector('#au-g').textContent = `${t.gain}: ${g > 0 ? (20 * Math.log10(g)).toFixed(1) : '-∞'} dB`;
        if (nodes) {
            const now = ac.currentTime;
            nodes.gainA.gain.setTargetAtTime(side === 'A' ? g : 0, now, 0.03);
            if (nodes.gainB) nodes.gainB.gain.setTargetAtTime(side === 'B' ? g : 0, now, 0.03);
            nodes.filter.frequency.setTargetAtTime(lowpass(), now, 0.05);
        }
    }

    function switchTo(s) {
        if (s === 'B' && !bufB) return;
        side = s;
        document.querySelectorAll('.au-side').forEach(b => b.classList.toggle('on', b.dataset.side === s));
        const ov = document.querySelector('.au');
        if (ov) update(ov);
    }

    function play() {
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpass();
        filter.connect(ac.destination);
        const make = (buf, on) => {
            const src = ac.createBufferSource();
            src.buffer = buf;
            src.loop = loop;
            src.playbackRate.value = applySdef && typeof params.pitch === 'number' ? params.pitch : 1;
            const g = ac.createGain();
            g.gain.value = on ? sdefGain() : 0;
            src.connect(g).connect(filter);
            return { src, g };
        };
        const A = make(bufA, side === 'A');
        const B = bufB ? make(bufB, side === 'B') : null;
        const at = ac.currentTime + 0.03;
        A.src.start(at);
        B?.src.start(at);
        nodes = { srcA: A.src, gainA: A.g, srcB: B?.src, gainB: B?.g, filter };
        A.src.onended = () => { if (!loop) stop(); };
        const btn = document.querySelector('#au-play');
        if (btn) btn.innerHTML = `${getIcon('square', 'w-4 h-4')} ${t.stop}`;
    }

    function stop() {
        if (!nodes) return;
        for (const n of [nodes.srcA, nodes.srcB]) { try { n?.stop(); } catch { /* done */ } }
        nodes.filter.disconnect();
        nodes = null;
        const btn = document.querySelector('#au-play');
        if (btn) btn.innerHTML = `${getIcon('play', 'w-4 h-4')} ${t.play}`;
    }
}
