/**
 * command-palette.js — Ctrl+K: jump to any page, action, SDEF or help article
 *
 * Fuzzy-ish match (every typed word must appear), ↑/↓ to move, Enter to run,
 * Esc to close. SDEFs of the current project are searchable by name, so
 * "afterb" opens Afterburner.sdef in the editor.
 */

import { getState, navigate, setCurrentSdef } from '../state/store.js';
import { getCurrentLanguage, t } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { NAV_ITEMS } from './nav.js';
import { DOC_ARTICLES, FAQ } from '../data/help-content.js';

const UI = {
    en: { ph: 'Search pages, actions, sounds, help…', pages: 'Pages', actions: 'Actions', sounds: 'Project sounds', help: 'Help', empty: 'Nothing found', hint: '↑↓ navigate · Enter open · Esc close' },
    fr: { ph: 'Rechercher pages, actions, sons, aide…', pages: 'Pages', actions: 'Actions', sounds: 'Sons du projet', help: 'Aide', empty: 'Aucun résultat', hint: '↑↓ naviguer · Entrée ouvrir · Échap fermer' },
};
const ACTIONS = [
    { icon: 'bug', label: { en: 'Generate a crash log', fr: 'Générer un crash log' }, run: async () => (await import('./crash-dialog.js')).openCrashLogDialog() },
    { icon: 'refresh-cw', label: { en: 'Check for updates', fr: 'Vérifier les mises à jour' }, run: async () => (await import('../utils/update-check.js')).checkUpdate(false) },
    { icon: 'play-circle', label: { en: 'Replay the tutorial', fr: 'Relancer le tutoriel' }, run: async () => (await import('../pages/onboarding.js')).startOnboarding() },
    { icon: 'users', label: { en: 'Browse community presets', fr: 'Parcourir les presets communautaires' }, run: () => navigate('presets') },
    { icon: 'package-check', label: { en: 'Build the mod', fr: 'Construire le mod' }, run: () => navigate('build') },
];

let root = null;
let items = [];
let active = 0;

const lang = () => (getCurrentLanguage() === 'fr' ? 'fr' : 'en');
const L = (o) => (o ? o[lang()] ?? o.en : '');

export function toggleCommandPalette() {
    if (root) close(); else open();
}

function open() {
    const ui = UI[lang()];
    root = document.createElement('div');
    root.id = 'cmdk';
    root.innerHTML = `
      <div class="cmdk-box" role="dialog" aria-modal="true" aria-label="Command palette">
        <label class="cmdk-input">${getIcon('search', 'w-4 h-4')}<input type="text" placeholder="${ui.ph}" autocomplete="off" spellcheck="false" /><kbd>Esc</kbd></label>
        <div class="cmdk-list" role="listbox"></div>
        <div class="cmdk-foot">${ui.hint}</div>
      </div>`;
    document.body.appendChild(root);
    const input = root.querySelector('input');
    input.addEventListener('input', () => { active = 0; render(input.value); });
    input.addEventListener('keydown', onKey);
    root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
    render('');
    input.focus();
}

function close() {
    root?.remove();
    root = null;
}

function sources() {
    const ui = UI[lang()];
    const pages = NAV_ITEMS.filter(n => n.id !== 'tutorial').map(n => ({ group: ui.pages, icon: n.icon, label: t(n.label), run: () => navigate(n.id) }));
    const actions = ACTIONS.map(a => ({ group: ui.actions, icon: a.icon, label: L(a.label), run: a.run }));
    const sounds = Object.keys(getState().selectedAssets || {}).map(p => ({
        group: ui.sounds, icon: 'file-audio', label: p.split('/').pop(), sub: p,
        run: () => { navigate('sdef-editor'); setTimeout(() => setCurrentSdef(p), 80); },
    }));
    const help = [
        ...DOC_ARTICLES.map(a => ({ group: ui.help, icon: a.icon, label: L(a.title), sub: L(a.summary), run: () => navigate('docs') })),
        ...FAQ.map(f => ({ group: ui.help, icon: 'circle-help', label: L(f.q), run: () => navigate('faq') })),
    ];
    return [...pages, ...actions, ...sounds, ...help];
}

function render(q) {
    const ui = UI[lang()];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const all = sources();
    items = words.length
        ? all.filter(i => words.every(w => `${i.label} ${i.sub || ''}`.toLowerCase().includes(w))).slice(0, 40)
        : all.filter(i => i.group !== ui.help && i.group !== ui.sounds).concat(all.filter(i => i.group === ui.sounds).slice(0, 5));

    const list = root.querySelector('.cmdk-list');
    if (!items.length) { list.innerHTML = `<div class="cmdk-empty">${ui.empty}</div>`; return; }
    let lastGroup = '';
    list.innerHTML = items.map((it, i) => {
        const head = it.group !== lastGroup ? `<div class="cmdk-group">${it.group}</div>` : '';
        lastGroup = it.group;
        return `${head}<button type="button" class="cmdk-item ${i === active ? 'on' : ''}" data-i="${i}" role="option">
          <span class="cmdk-icon">${getIcon(it.icon, 'w-4 h-4')}</span>
          <span class="cmdk-text"><b>${escapeHtml(it.label)}</b>${it.sub ? `<small>${escapeHtml(it.sub)}</small>` : ''}</span>
          ${i === active ? getIcon('corner-down-left', 'w-3.5 h-3.5') : ''}</button>`;
    }).join('');
    list.querySelectorAll('[data-i]').forEach(b => {
        b.addEventListener('click', () => run(Number(b.dataset.i)));
        b.addEventListener('mousemove', () => { if (active !== Number(b.dataset.i)) { active = Number(b.dataset.i); render(root.querySelector('input').value); } });
    });
    list.querySelector('.cmdk-item.on')?.scrollIntoView({ block: 'nearest' });
}

function run(i) {
    const it = items[i];
    close();
    it?.run();
}

function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, items.length - 1); render(e.target.value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(e.target.value); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
}
