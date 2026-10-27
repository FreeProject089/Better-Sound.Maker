/**
 * onboarding.js — Tasky's guided tour
 *
 * A spotlight tour: each step opens the page it talks about, cuts a hole in
 * the dim around the element it points at (sidebar item or a part of the
 * page) and Tasky explains it in a bubble placed next to it.
 *
 * Chapters: welcome + language → the 4-step workflow (Library, Project,
 * SDEF editor, Build) → the extras → a "you're ready" checklist.
 * Keys: → / Enter next, ← back, Esc closes. Progress is remembered, so a tour
 * closed half-way resumes there from Help → Tutorial.
 *
 * Exports kept for main.js / nav.js: initOnboarding, startOnboarding, restartTutorial.
 */

import { changeLanguage, getAvailableLanguages, getCurrentLanguage } from '../utils/i18n.js';
import { getState, navigate } from '../state/store.js';
import { getIcon } from '../utils/icons.js';
import './onboarding.css';

const DONE_KEY = 'bsm-onboarding-done';
const STEP_KEY = 'bsm-onboarding-step';

const TASKY = { idle: './Tasky.webp', blink: './Tasky_yeux1.webp', happy: './Tasky_Happy.webp' };

/* Tour text lives here (EN/FR) so a step's words sit next to its target. */
const TEXT = {
    en: {
        next: 'Next', back: 'Back', skip: 'Skip tour', finish: "Let's go!", start: 'Start the tour',
        of: '{n} of {total}', keys: '← → to move · Esc to close',
        chapters: { welcome: 'Welcome', workflow: 'The workflow', extras: 'Going further', done: 'Ready' },
    },
    fr: {
        next: 'Suivant', back: 'Retour', skip: 'Passer le tuto', finish: "C'est parti !", start: 'Commencer la visite',
        of: '{n} sur {total}', keys: '← → pour naviguer · Échap pour fermer',
        chapters: { welcome: 'Bienvenue', workflow: 'Le parcours', extras: 'Aller plus loin', done: 'Prêt' },
    },
};

const STEPS = [
    {
        id: 'language', chapter: 'welcome', mood: 'happy', center: true,
        title: { en: 'Hi, I\'m Tasky!', fr: 'Salut, moi c\'est Tasky !' },
        body: {
            en: 'I\'ll show you around <b>Better Sound.Maker</b> in under two minutes. First, pick your language:',
            fr: 'Je vais vous faire visiter <b>Better Sound.Maker</b> en moins de deux minutes. D\'abord, choisissez votre langue :',
        },
        language: true,
    },
    {
        id: 'idea', chapter: 'welcome', mood: 'idle', center: true,
        title: { en: 'How a DCS sound mod works', fr: 'Comment marche un mod son DCS' },
        body: {
            en: 'DCS never plays an audio file directly: it plays an <b>SDEF</b>, a small file that says which audio to use and how (volume, distance, loop…). A sound mod ships SDEFs with the <b>same names</b> as the game\'s, plus your audio. BSM builds all of that for you.',
            fr: 'DCS ne joue jamais un fichier audio directement : il joue un <b>SDEF</b>, un petit fichier qui dit quel audio utiliser et comment (volume, distance, boucle…). Un mod son contient des SDEF aux <b>mêmes noms</b> que ceux du jeu, plus votre audio. BSM fabrique tout ça pour vous.',
        },
        flow: true,
    },
    {
        id: 'library', chapter: 'workflow', page: 'library', target: '[data-page="library"]', mood: 'blink',
        title: { en: '1 · Find the sounds', fr: '1 · Trouver les sons' },
        body: {
            en: 'The <b>Assets Library</b> lists every DCS sound. Browse the folder tree or search, then tick the sounds you want to replace. The first time, BSM asks for your DCS folder to scan it.',
            fr: 'La <b>Bibliothèque</b> liste tous les sons de DCS. Parcourez l\'arborescence ou cherchez, puis cochez les sons à remplacer. La première fois, BSM demande votre dossier DCS pour l\'analyser.',
        },
        tip: { en: 'Tip: Reload Library rescans after a DCS update.', fr: 'Astuce : « Recharger la bibliothèque » relance l\'analyse après une mise à jour de DCS.' },
    },
    {
        id: 'project', chapter: 'workflow', page: 'project', target: '[data-page="project"]', mood: 'idle',
        title: { en: '2 · Add your audio', fr: '2 · Ajouter votre audio' },
        body: {
            en: 'In <b>Projects</b>, every ticked sound gets a drop zone. Drag a <code>.wav</code> or <code>.ogg</code> onto it and press Play to listen. Mono is best for sounds placed in 3D.',
            fr: 'Dans <b>Projets</b>, chaque son coché a sa zone de dépôt. Glissez-y un <code>.wav</code> ou un <code>.ogg</code> et appuyez sur Lecture pour écouter. Le mono est préférable pour les sons placés en 3D.',
        },
    },
    {
        id: 'sdef', chapter: 'workflow', page: 'sdef-editor', target: '[data-page="sdef-editor"]', mood: 'blink',
        title: { en: '3 · Tune it (optional)', fr: '3 · L\'ajuster (facultatif)' },
        body: {
            en: 'The <b>SDEF editor</b> changes volume, pitch, distance, cone and loop without code. A live checker flags mistakes, and a curve shows how loud the sound is at each distance.',
            fr: 'L\'<b>éditeur SDEF</b> règle volume, hauteur, distance, cône et boucle sans code. Un vérificateur signale les erreurs en direct, et une courbe montre le volume selon la distance.',
        },
        tip: { en: 'Templates let you apply the same settings to many sounds.', fr: 'Les templates appliquent les mêmes réglages à plusieurs sons.' },
    },
    {
        id: 'build', chapter: 'workflow', page: 'build', target: '[data-page="build"]', mood: 'happy',
        title: { en: '4 · Build the mod', fr: '4 · Construire le mod' },
        body: {
            en: 'The <b>Mod Generator</b> writes the finished mod folder: <code>entry.lua</code>, SDEFs and audio (kept, WAV or real OGG). Drop it in <code>Saved Games\\DCS\\Mods\\resource</code> and fly.',
            fr: 'Le <b>Générateur de mod</b> écrit le dossier final : <code>entry.lua</code>, SDEF et audio (tel quel, WAV ou vrai OGG). Déposez-le dans <code>Saved Games\\DCS\\Mods\\resource</code> et volez.',
        },
    },
    {
        id: 'presets', chapter: 'extras', page: 'presets', target: '[data-page="presets"]', mood: 'idle',
        title: { en: 'Presets & community', fr: 'Presets et communauté' },
        body: {
            en: 'Save a selection of sounds as a <b>preset</b>, share it, or install ready-made ones from the <b>community catalog</b>. You\'re told when one you installed gets an update.',
            fr: 'Enregistrez une sélection de sons en <b>preset</b>, partagez-la, ou installez-en depuis le <b>catalogue communautaire</b>. Vous êtes prévenu quand un preset installé est mis à jour.',
        },
    },
    {
        id: 'types', chapter: 'extras', page: 'custom-types', target: '[data-page="custom-types"]', mood: 'blink',
        title: { en: 'Sound types', fr: 'Types de sons' },
        body: {
            en: 'BSM labels sounds (engine, switch, weapon…) from their path. Add your own types and rules here; each type also brings good default SDEF values.',
            fr: 'BSM étiquette les sons (moteur, interrupteur, arme…) d\'après leur chemin. Ajoutez vos propres types et règles ici ; chaque type apporte aussi de bonnes valeurs SDEF par défaut.',
        },
    },
    {
        id: 'collab', chapter: 'extras', page: 'collaboration', target: '[data-page="collaboration"]', mood: 'idle',
        title: { en: 'Work as a team', fr: 'Travailler à plusieurs' },
        body: {
            en: '<b>Collaboration</b> syncs a project through a GitHub repository: push, pull and restore earlier versions.',
            fr: '<b>Collaboration</b> synchronise un projet via un dépôt GitHub : envoyer, récupérer et restaurer des versions précédentes.',
        },
    },
    {
        id: 'help', chapter: 'extras', page: 'settings', target: '#sidebar-crash-btn', mood: 'blink',
        title: { en: 'If something goes wrong', fr: 'Si quelque chose ne va pas' },
        body: {
            en: 'This bug button (or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>L</kbd>) makes a <b>crash log</b> to attach to a bug report. The <b>Documentation</b> and <b>F.A.Q</b> are in the Help section.',
            fr: 'Ce bouton bug (ou <kbd>Ctrl</kbd>+<kbd>Maj</kbd>+<kbd>L</kbd>) crée un <b>crash log</b> à joindre à un rapport de bug. La <b>Documentation</b> et la <b>F.A.Q</b> sont dans la section Aide.',
        },
    },
    {
        id: 'done', chapter: 'done', mood: 'happy', center: true, page: 'library',
        title: { en: 'You\'re ready!', fr: 'Vous êtes prêt !' },
        body: {
            en: 'Your first mod in four moves:',
            fr: 'Votre premier mod en quatre étapes :',
        },
        checklist: {
            en: ['Set your DCS folder (Library or Settings)', 'Tick a few sounds', 'Drop your audio in Projects', 'Build and copy to Mods\\resource'],
            fr: ['Indiquer votre dossier DCS (Bibliothèque ou Paramètres)', 'Cocher quelques sons', 'Déposer votre audio dans Projets', 'Construire et copier dans Mods\\resource'],
        },
        tip: { en: 'Replay this tour any time from Help → Tutorial.', fr: 'Relancez cette visite quand vous voulez depuis Aide → Relancer Tuto.' },
    },
];

let root = null;
let index = 0;
let blinkTimer = null;

const lang = () => (getCurrentLanguage() === 'fr' ? 'fr' : 'en');
const L = (obj) => (obj ? obj[lang()] ?? obj.en : '');
const ui = () => TEXT[lang()];

/* ── Public API ───────────────────────────────────────────────────── */

export function initOnboarding() {
    if (localStorage.getItem(DONE_KEY) === 'true') return;
    // Let the intro finish first
    setTimeout(() => open(Number(localStorage.getItem(STEP_KEY)) || 0), 900);
}

export function startOnboarding() {
    localStorage.removeItem(DONE_KEY);
    open(0);
}

export function restartTutorial() {
    startOnboarding();
}

/* ── Tour ─────────────────────────────────────────────────────────── */

function open(start) {
    close(false);
    index = Math.min(Math.max(start, 0), STEPS.length - 1);
    root = document.createElement('div');
    root.id = 'tour';
    root.innerHTML = `
      <div class="tour-dim"></div>
      <div class="tour-spot"></div>
      <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"></div>`;
    document.body.appendChild(root);
    document.body.classList.add('tour-active');
    addEventListener('keydown', onKey, true);
    addEventListener('resize', place);
    show(index);
    startBlinking();
}

function close(markDone = true) {
    if (!root) return;
    removeEventListener('keydown', onKey, true);
    removeEventListener('resize', place);
    clearInterval(blinkTimer);
    document.body.classList.remove('tour-active');
    root.classList.add('is-leaving');
    const el = root;
    root = null;
    setTimeout(() => el.remove(), 220);
    if (markDone) {
        localStorage.setItem(DONE_KEY, 'true');
        localStorage.removeItem(STEP_KEY);
    }
}

function go(delta) {
    const next = index + delta;
    if (next < 0) return;
    if (next >= STEPS.length) { close(true); return; }
    show(next);
}

async function show(i) {
    index = i;
    localStorage.setItem(STEP_KEY, String(i));
    const step = STEPS[i];

    if (step.page && getState().currentPage !== step.page) {
        navigate(step.page);
        await new Promise(r => setTimeout(r, 260));
    }
    // A first-run scanner or other dialog would sit on top of the tour
    if (!step.center) document.getElementById('modal-overlay')?.classList.add('tour-behind');

    render(step);
    requestAnimationFrame(place);
}

function render(step) {
    const card = root.querySelector('.tour-card');
    const total = STEPS.length;
    const chapters = ['welcome', 'workflow', 'extras', 'done'];

    card.className = `tour-card ${step.center ? 'is-center' : ''}`;
    card.innerHTML = `
      <div class="tour-head">
        <div class="tour-tasky tour-tasky--${step.mood || 'idle'}">
          <img src="${step.mood === 'happy' ? TASKY.happy : TASKY.idle}" alt="" draggable="false" />
        </div>
        <div class="tour-heading">
          <div class="tour-chapter">${chapters.map(c => `<span class="${c === step.chapter ? 'on' : ''}">${ui().chapters[c]}</span>`).join('<i></i>')}</div>
          <h3 id="tour-title">${L(step.title)}</h3>
        </div>
        <button type="button" class="tour-x" data-tour="skip" aria-label="${ui().skip}">${getIcon('x', 'w-4 h-4')}</button>
      </div>
      <div class="tour-body">
        <p>${L(step.body)}</p>
        ${step.language ? languagePicker() : ''}
        ${step.flow ? flowDiagram() : ''}
        ${step.checklist ? `<ul class="tour-check">${L(step.checklist).map(x => `<li>${getIcon('check-circle-2', 'w-4 h-4')}<span>${x}</span></li>`).join('')}</ul>` : ''}
        ${step.tip ? `<div class="tour-tip">${getIcon('lightbulb', 'w-4 h-4')}<span>${L(step.tip)}</span></div>` : ''}
      </div>
      <div class="tour-foot">
        <div class="tour-progress" aria-label="${ui().of.replace('{n}', index + 1).replace('{total}', total)}">
          ${STEPS.map((_, k) => `<span class="${k < index ? 'past' : k === index ? 'now' : ''}"></span>`).join('')}
        </div>
        <div class="tour-actions">
          ${index > 0 ? `<button type="button" class="btn btn-ghost btn-sm" data-tour="back">${getIcon('arrow-left', 'w-3.5 h-3.5')} ${ui().back}</button>` : `<button type="button" class="btn btn-ghost btn-sm" data-tour="skip">${ui().skip}</button>`}
          <button type="button" class="btn btn-primary btn-sm" data-tour="next">${index === STEPS.length - 1 ? ui().finish : index === 0 ? ui().start : ui().next} ${getIcon(index === STEPS.length - 1 ? 'rocket' : 'arrow-right', 'w-3.5 h-3.5')}</button>
        </div>
      </div>
      <div class="tour-keys">${ui().keys}</div>`;

    card.querySelector('[data-tour="next"]').addEventListener('click', () => go(1));
    card.querySelector('[data-tour="back"]')?.addEventListener('click', () => go(-1));
    card.querySelectorAll('[data-tour="skip"]').forEach(b => b.addEventListener('click', () => close(true)));
    card.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', async () => {
        await changeLanguage(b.dataset.lang);
        render(step);
        place();
    }));
    card.querySelector('[data-tour="next"]').focus({ preventScroll: true });
}

function languagePicker() {
    return `<div class="tour-langs">${getAvailableLanguages().map(l => `
      <button type="button" class="tour-lang ${l.code === getCurrentLanguage() ? 'on' : ''}" data-lang="${l.code}">
        <span class="tour-flag">${l.flag}</span><span>${l.name}</span>
      </button>`).join('')}</div>`;
}

function flowDiagram() {
    const box = (icon, label) => `<div class="tour-flow-box">${getIcon(icon, 'w-5 h-5')}<span>${label}</span></div>`;
    const arrow = `<div class="tour-flow-arrow">${getIcon('chevron-right', 'w-4 h-4')}</div>`;
    const fr = lang() === 'fr';
    return `<div class="tour-flow">${[
        box('folder-search', fr ? 'Sons DCS' : 'DCS sounds'),
        box('file-audio', fr ? 'Votre audio' : 'Your audio'),
        box('sliders-horizontal', 'SDEF'),
        box('package', fr ? 'Mod prêt' : 'Ready mod'),
    ].join(arrow)}</div>`;
}

/* ── Placement ────────────────────────────────────────────────────── */

function place() {
    if (!root) return;
    const step = STEPS[index];
    const spot = root.querySelector('.tour-spot');
    const card = root.querySelector('.tour-card');
    const target = step.target && !step.center ? document.querySelector(step.target) : null;

    if (!target) {
        spot.classList.add('is-hidden');
        card.style.left = '';
        card.style.top = '';
        return;
    }
    target.scrollIntoView?.({ block: 'nearest' });
    const r = target.getBoundingClientRect();
    const pad = 6;
    spot.classList.remove('is-hidden');
    Object.assign(spot.style, {
        left: `${r.left - pad}px`, top: `${r.top - pad}px`,
        width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`,
    });

    // Card to the right of the target, kept on screen
    const cw = card.offsetWidth || 420;
    const ch = card.offsetHeight || 300;
    let left = r.right + 22;
    if (left + cw > innerWidth - 16) left = Math.max(16, r.left - cw - 22);
    let top = r.top + r.height / 2 - ch / 2;
    top = Math.min(Math.max(16, top), innerHeight - ch - 16);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
}

function onKey(e) {
    if (!root) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.closest?.('button'))) { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
}

// Tasky blinks now and then
function startBlinking() {
    clearInterval(blinkTimer);
    blinkTimer = setInterval(() => {
        const img = root?.querySelector('.tour-tasky:not(.tour-tasky--happy) img');
        if (!img) return;
        img.src = TASKY.blink;
        setTimeout(() => { if (img.isConnected) img.src = TASKY.idle; }, 160);
    }, 3200);
}
