/**
 * template-manager.js — SDEF template manager (modal)
 *
 * Three sources, one list:
 *   Mine          — templates the user saved (store.sdefTemplates), editable;
 *   By sound type — values Eagle Dynamics and module makers use, per category;
 *   By module     — the same, per DCS module (F-14, Mirage, MiG-21…).
 * The DCS packs ship in public/templates/dcs-templates.json (built from a
 * DCS install by scripts/build-sdef-templates.mjs); the desktop app can
 * rebuild them from the user's own install.
 *
 * Each template: Apply to the current SDEF, to an aircraft/module folder, or
 * to every SDEF; a preview of its values; Save as mine for DCS ones.
 */

import { showModal, hideModal } from './modal.js';
import { showToast } from './toast.js';
import {
    getState, getSdefContent, saveSdefTemplate, deleteSdefTemplate, exportSdefTemplates,
    exportSingleSdefTemplate, importSdefTemplates,
} from '../state/store.js';
import { parseSdef } from '../utils/sdef-generator.js';
import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { buildTemplates, CATEGORY_RULES } from '../utils/sdef-stats.js';
import './template-manager.css';

const PACK_KEY = 'bsm-dcs-templates';
const ICONS = ['star', 'flame', 'headphones', 'toggle-left', 'megaphone', 'radio', 'radar', 'crosshair', 'rocket', 'bomb', 'wind', 'fan', 'plane', 'circle-dot', 'zap', 'music', 'mic', 'bell', 'layers', 'settings'];

const T = {
    en: { title: 'SDEF templates', sub: 'Reusable parameter sets: yours, and the values used in DCS itself.', search: 'Search templates…', mine: 'My templates', byType: 'By sound type', byModule: 'By DCS module', none: 'No template yet. Save the current SDEF as one below.', current: 'Current SDEF', folder: 'Folder', all: 'All ({n})', saveMine: 'Save as mine', del: 'Delete', export: 'Export', import: 'Import', exportAll: 'Export mine', newTitle: 'Save current SDEF as a template', name: 'Name', namePh: 'e.g. Loud cockpit switch', source: 'Source SDEF', icon: 'Icon', create: 'Save template', files: '{n} DCS files', rebuild: 'Rebuild from my DCS', rebuilding: 'Reading your DCS modules…', rebuilt: '{a} type and {b} module templates from {n} SDEFs', needDcs: 'Set your DCS folder in Settings first.', confirm: 'Apply "{t}" to {n} SDEF(s)? Their wave stays, the other parameters are replaced.', applied: 'Applied to {n} SDEF(s)', nameRequired: 'Give the template a name', saved: 'Template saved', scope: 'Apply to', empty: 'No match' },
    fr: { title: 'Templates SDEF', sub: 'Des réglages réutilisables : les vôtres, et les valeurs utilisées dans DCS.', search: 'Rechercher un template…', mine: 'Mes templates', byType: 'Par type de son', byModule: 'Par module DCS', none: 'Aucun template. Enregistrez le SDEF actuel ci-dessous.', current: 'SDEF actuel', folder: 'Dossier', all: 'Tous ({n})', saveMine: 'Garder dans les miens', del: 'Supprimer', export: 'Exporter', import: 'Importer', exportAll: 'Exporter les miens', newTitle: 'Enregistrer le SDEF actuel comme template', name: 'Nom', namePh: 'ex : Interrupteur cockpit fort', source: 'SDEF source', icon: 'Icône', create: 'Enregistrer le template', files: '{n} fichiers DCS', rebuild: 'Reconstruire depuis mon DCS', rebuilding: 'Lecture de vos modules DCS…', rebuilt: '{a} templates par type et {b} par module depuis {n} SDEF', needDcs: 'Indiquez d\'abord votre dossier DCS dans Paramètres.', confirm: 'Appliquer « {t} » à {n} SDEF ? Leur wave est gardé, les autres paramètres sont remplacés.', applied: 'Appliqué à {n} SDEF', nameRequired: 'Donnez un nom au template', saved: 'Template enregistré', scope: 'Appliquer à', empty: 'Aucun résultat' },
};
const tr = () => T[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

async function loadPack() {
    try { const local = JSON.parse(localStorage.getItem(PACK_KEY)); if (local?.byType) return local; } catch { /* use bundled */ }
    try { return await (await fetch('./templates/dcs-templates.json')).json(); } catch { return { byType: [], byModule: [] }; }
}

/**
 * @param {(template, scope: 'current'|true|string) => void} apply  scope: current SDEF, all (true) or a folder prefix
 */
export async function openTemplateManager(apply) {
    const u = tr();
    const state = getState();
    const selected = Object.keys(state.selectedAssets || {});
    const currentSdef = state.currentSdef;
    let pack = await loadPack();
    let query = '';
    let open = 'mine';
    let pickedIcon = 'star';

    const folders = Object.entries(selected.reduce((m, p) => {
        const parts = p.split('/');
        if (parts.length > 2) { const f = parts.slice(0, 2).join('/'); m[f] = (m[f] || 0) + 1; }
        return m;
    }, {})).sort((a, b) => b[1] - a[1]);
    const defaultScope = currentSdef ? 'current' : folders.length ? `f:${folders[0][0]}` : 'all';

    await showModal({
        title: u.title, subtitle: u.sub, icon: 'layout-template', size: 'xl', className: 'tm-modal',
        content: `
          <div class="tm">
            <div class="tm-bar">
              <label class="help-search tm-search">${getIcon('search', 'w-4 h-4')}<input type="search" id="tm-q" placeholder="${u.search}" /></label>
              <label class="tm-scope">${u.scope}
                <select class="input-field" id="tm-scope">
                  ${currentSdef ? `<option value="current">${u.current} · ${escapeHtml(currentSdef.split('/').pop())}</option>` : ''}
                  ${folders.map(([f, n]) => `<option value="f:${escapeHtml(f)}">${u.folder} ${escapeHtml(f)} (${n})</option>`).join('')}
                  <option value="all">${fmt(u.all, { n: selected.length })}</option>
                </select></label>
            </div>
            <div class="tm-tabs" role="tablist">
              <button class="tm-tab" data-tab="mine">${getIcon('user', 'w-3.5 h-3.5')} ${u.mine} <span id="tm-c-mine"></span></button>
              <button class="tm-tab" data-tab="type">${getIcon('tags', 'w-3.5 h-3.5')} ${u.byType} <span id="tm-c-type"></span></button>
              <button class="tm-tab" data-tab="module">${getIcon('plane', 'w-3.5 h-3.5')} ${u.byModule} <span id="tm-c-module"></span></button>
              ${window.nativeAPI ? `<button class="btn btn-ghost btn-sm tm-rebuild" id="tm-rebuild">${getIcon('refresh-cw', 'w-3.5 h-3.5')} ${u.rebuild}</button>` : ''}
            </div>
            <div class="tm-list" id="tm-list"></div>
            <details class="tm-new">
              <summary>${getIcon('plus-circle', 'w-4 h-4')} ${u.newTitle}</summary>
              <div class="tm-new-body">
                <label class="input-group"><span class="input-label">${u.name}</span><input class="input-field" id="tm-name" placeholder="${u.namePh}" /></label>
                <label class="input-group"><span class="input-label">${u.source}</span>
                  <select class="input-field" id="tm-source">${selected.map(p => `<option value="${escapeHtml(p)}" ${p === currentSdef ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}</select></label>
                <div class="input-group"><span class="input-label">${u.icon}</span>
                  <div class="tm-icons">${ICONS.map(i => `<button class="tm-icon ${i === pickedIcon ? 'on' : ''}" data-icon="${i}" title="${i}">${getIcon(i, 'w-4 h-4')}</button>`).join('')}</div></div>
                <div class="tm-new-actions">
                  <button class="btn btn-ghost btn-sm" id="tm-import">${getIcon('download', 'w-3.5 h-3.5')} ${u.import}</button>
                  <button class="btn btn-ghost btn-sm" id="tm-export">${getIcon('share-2', 'w-3.5 h-3.5')} ${u.exportAll}</button>
                  <button class="btn btn-primary btn-sm" id="tm-save">${getIcon('save', 'w-3.5 h-3.5')} ${u.create}</button>
                </div>
              </div>
            </details>
          </div>`,
        actions: [],
        onRender: (ov) => wire(ov),
    });

    function scopeOf(ov) {
        const v = ov.querySelector('#tm-scope').value;
        return v === 'current' ? 'current' : v === 'all' ? true : v.slice(2);
    }
    function scopeCount(scope) {
        if (scope === 'current') return 1;
        if (scope === true) return selected.length;
        return selected.filter(p => p.startsWith(scope + '/')).length;
    }

    function items() {
        const mine = (getState().sdefTemplates || []).map(t => ({ ...t, source: 'mine' }));
        const q = query.toLowerCase();
        const match = (t) => !q || `${t.name} ${t.module || ''} ${Object.keys(t.params).join(' ')}`.toLowerCase().includes(q);
        return { mine: mine.filter(match), type: (pack.byType || []).filter(match), module: (pack.byModule || []).filter(match) };
    }

    function wire(ov) {
        ov.querySelector('#tm-scope').value = defaultScope;
        ov.querySelector('#tm-q').addEventListener('input', (e) => { query = e.target.value.trim(); render(ov); });
        ov.querySelectorAll('.tm-tab').forEach(b => b.addEventListener('click', () => { open = b.dataset.tab; render(ov); }));
        ov.querySelectorAll('.tm-icon').forEach(b => b.addEventListener('click', () => {
            pickedIcon = b.dataset.icon;
            ov.querySelectorAll('.tm-icon').forEach(x => x.classList.toggle('on', x === b));
        }));
        ov.querySelector('#tm-save').addEventListener('click', () => {
            const name = ov.querySelector('#tm-name').value.trim();
            if (!name) { showToast(u.nameRequired, 'warning'); return; }
            const src = ov.querySelector('#tm-source').value;
            const params = parseSdef(getState().unsavedSdefs?.[src] || getSdefContent(src) || '');
            delete params.wave;
            saveSdefTemplate({ id: 'tpl_' + Date.now(), name, lucideIcon: pickedIcon, params });
            ov.querySelector('#tm-name').value = '';
            showToast(u.saved, 'success');
            open = 'mine';
            render(ov);
        });
        ov.querySelector('#tm-export').addEventListener('click', exportSdefTemplates);
        ov.querySelector('#tm-import').addEventListener('click', () => {
            const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
            input.onchange = async () => {
                try {
                    const json = JSON.parse(await input.files[0].text());
                    importSdefTemplates(Array.isArray(json) ? json : [json]);
                    open = 'mine';
                    render(ov);
                } catch (e) { showToast(e.message, 'error'); }
            };
            input.click();
        });
        ov.querySelector('#tm-rebuild')?.addEventListener('click', async (e) => {
            const dcs = getState().globalSettings?.dcsPath;
            if (!dcs) { showToast(u.needDcs, 'warning'); return; }
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = u.rebuilding;
            try {
                pack = await rebuildFromDcs(dcs);
                localStorage.setItem(PACK_KEY, JSON.stringify(pack));
                showToast(fmt(u.rebuilt, { a: pack.byType.length, b: pack.byModule.length, n: pack.fileCount }), 'success', 6000);
            } catch (err) { showToast(err.message, 'error'); }
            btn.disabled = false;
            btn.innerHTML = `${getIcon('refresh-cw', 'w-3.5 h-3.5')} ${u.rebuild}`;
            render(ov);
        });
        if (!(getState().sdefTemplates || []).length) open = 'type';
        render(ov);
    }

    function render(ov) {
        const all = items();
        for (const k of ['mine', 'type', 'module']) ov.querySelector(`#tm-c-${k}`).textContent = all[k].length;
        ov.querySelectorAll('.tm-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === open));
        const list = all[open];
        const el = ov.querySelector('#tm-list');
        if (!list.length) { el.innerHTML = `<p class="tm-empty">${open === 'mine' && !query ? u.none : u.empty}</p>`; return; }

        let lastModule = '';
        el.innerHTML = list.map((t, i) => {
            const head = open === 'module' && t.module !== lastModule ? `<div class="tm-group">${escapeHtml(t.module)}</div>` : '';
            lastModule = t.module;
            const chips = Object.entries(t.params).slice(0, 6).map(([k, v]) => `<span><b>${escapeHtml(k)}</b> ${escapeHtml(Array.isArray(v) ? `{${v.join(', ')}}` : v)}</span>`).join('');
            return `${head}<div class="tm-item">
              <div class="tm-item-icon">${getIcon(t.lucideIcon || 'star', 'w-4 h-4')}</div>
              <div class="tm-item-main">
                <div class="tm-item-name">${escapeHtml(open === 'module' ? t.name.split(' · ').pop() : t.name)}${t.files ? `<small>${fmt(u.files, { n: t.files })}</small>` : ''}</div>
                <div class="tm-chips">${chips}${Object.keys(t.params).length > 6 ? `<span>+${Object.keys(t.params).length - 6}</span>` : ''}</div>
              </div>
              <div class="tm-item-acts">
                ${t.source === 'mine'
                    ? `<button class="btn btn-ghost btn-sm btn-icon" data-export="${i}" title="${u.export}">${getIcon('upload', 'w-3.5 h-3.5')}</button>
                       <button class="btn btn-ghost btn-sm btn-icon" data-del="${i}" title="${u.del}">${getIcon('trash-2', 'w-3.5 h-3.5')}</button>`
                    : `<button class="btn btn-ghost btn-sm btn-icon" data-keep="${i}" title="${u.saveMine}">${getIcon('bookmark-plus', 'w-3.5 h-3.5')}</button>`}
                <button class="btn btn-primary btn-sm" data-apply="${i}">${getIcon('wand-2', 'w-3.5 h-3.5')} Apply</button>
              </div></div>`;
        }).join('');

        el.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => {
            const t = list[b.dataset.apply];
            const scope = scopeOf(ov);
            const n = scopeCount(scope);
            if (scope !== 'current' && !confirm(fmt(u.confirm, { t: t.name, n }))) return;
            hideModal();
            apply({ name: t.name, params: t.params }, scope === 'current' ? false : scope);
        }));
        el.querySelectorAll('[data-keep]').forEach(b => b.addEventListener('click', () => {
            const t = list[b.dataset.keep];
            saveSdefTemplate({ id: 'tpl_' + Date.now(), name: t.name, lucideIcon: t.lucideIcon, params: { ...t.params } });
            showToast(u.saved, 'success');
            render(ov);
        }));
        el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { deleteSdefTemplate(list[b.dataset.del].id); render(ov); }));
        el.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', () => exportSingleSdefTemplate(list[b.dataset.export].id)));
    }
}

/** Desktop: read every module SDEF of the user's DCS and rebuild the packs. */
async function rebuildFromDcs(dcsPath) {
    const files = [];
    for (const top of ['CoreMods', 'Mods']) {
        const root = `${dcsPath.replace(/[\\/]+$/, '')}/${top}`;
        const scanned = await window.nativeAPI.scanSdefs(root).catch(() => []);
        for (const f of scanned) {
            const m = /^[^/]+\/([^/]+)\/Sounds\/sdef\/(.+)$/i.exec(f.relPath);
            if (m) files.push({ module: m[1], path: m[2], text: f.content });
        }
    }
    if (!files.length) throw new Error('No module SDEF found under CoreMods / Mods');
    return buildTemplates(files, CATEGORY_RULES);
}
