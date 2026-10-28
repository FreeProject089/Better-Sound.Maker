/**
 * docs.js — In-app Documentation (help centre)
 *
 * Left: search + articles grouped by section. Right: the open article, with
 * "Open in the app" / "Read the full page" actions. Two articles are built
 * from live data: the SDEF parameter table (SDEF_PARAMS) and the sound types
 * (the rules currently loaded). The text lives in src/data/help-content.js.
 */

import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { navigate } from '../state/store.js';
import { SDEF_PARAMS } from '../utils/sdef-generator.js';
import { DOCS_SITE, DOC_SECTIONS, DOC_ARTICLES } from '../data/help-content.js';
import './help.css';

const UI = {
    en: { title: 'Documentation', desc: 'Short guides for every step, the SDEF reference, and help when something goes wrong.', search: 'Search the documentation…', none: 'No article matches', open: 'Open in the app', full: 'Read the full page', site: 'Full documentation (website)', crash: 'Generate a crash log', key: 'Key', type: 'Type', def: 'Default', meaning: 'Meaning', rules: 'rule(s)' },
    fr: { title: 'Documentation', desc: 'Des guides courts pour chaque étape, la référence SDEF, et de l\'aide quand ça ne va pas.', search: 'Rechercher dans la documentation…', none: 'Aucun article ne correspond', open: 'Ouvrir dans l\'application', full: 'Lire la page complète', site: 'Documentation complète (site web)', crash: 'Générer un crash log', key: 'Clé', type: 'Type', def: 'Défaut', meaning: 'Rôle', rules: 'règle(s)' },
};

let current = 'what';
let query = '';

const lang = () => (getCurrentLanguage() === 'fr' ? 'fr' : 'en');
const L = (o) => (o ? o[lang()] ?? o.en : '');
const strip = (html) => html.replace(/<[^>]+>/g, ' ');

export function renderDocs(container) {
    const ui = UI[lang()];
    container.innerHTML = `
      <div class="page-header help-header">
        <div>
          <h1 class="page-title">${ui.title}</h1>
          <p class="page-description">${ui.desc}</p>
        </div>
        <a class="btn btn-secondary" href="${DOCS_SITE}${lang() === 'fr' ? 'fr/' : ''}" target="_blank" rel="noopener">${getIcon('book-open', 'w-4 h-4')} ${ui.site}</a>
      </div>
      <div class="help-layout">
        <aside class="help-nav">
          <label class="help-search">${getIcon('search', 'w-4 h-4')}
            <input type="search" id="docs-search" placeholder="${ui.search}" value="${escapeHtml(query)}" autocomplete="off" />
          </label>
          <div id="docs-list"></div>
        </aside>
        <article class="help-article card" id="docs-article"></article>
      </div>`;

    const search = container.querySelector('#docs-search');
    search.addEventListener('input', () => { query = search.value.trim(); renderList(container); });
    renderList(container);
    renderArticle(container);
}

function matches(a) {
    if (!query) return true;
    const q = query.toLowerCase();
    const body = a.generated === 'params' ? SDEF_PARAMS.map(p => p.key + ' ' + p.desc).join(' ') : strip(L(a.body));
    return `${L(a.title)} ${L(a.summary)} ${body}`.toLowerCase().includes(q);
}

function renderList(container) {
    const ui = UI[lang()];
    const list = container.querySelector('#docs-list');
    const html = DOC_SECTIONS.map(sec => {
        const items = DOC_ARTICLES.filter(a => a.section === sec.id && matches(a));
        if (!items.length) return '';
        return `<div class="help-group">
          <div class="help-group-title">${getIcon(sec.icon, 'w-3.5 h-3.5')} ${L(sec.title)}</div>
          ${items.map(a => `<button type="button" class="help-link ${a.id === current ? 'on' : ''}" data-doc="${a.id}">
              <span class="help-link-icon">${getIcon(a.icon, 'w-4 h-4')}</span>
              <span class="help-link-text"><b>${L(a.title)}</b><small>${L(a.summary)}</small></span>
            </button>`).join('')}
        </div>`;
    }).join('');
    list.innerHTML = html || `<p class="help-empty">${ui.none} « ${escapeHtml(query)} »</p>`;
    list.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => {
        current = b.dataset.doc;
        renderList(container);
        renderArticle(container);
        container.querySelector('#docs-article')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
}

async function renderArticle(container) {
    const ui = UI[lang()];
    const a = DOC_ARTICLES.find(x => x.id === current) || DOC_ARTICLES[0];
    const el = container.querySelector('#docs-article');
    const sec = DOC_SECTIONS.find(s => s.id === a.section);
    let body = L(a.body);
    if (a.generated === 'params') body = paramsTable(ui);
    if (a.generated === 'types') body = await typesTable(ui);

    el.innerHTML = `
      <div class="help-crumb">${getIcon(sec.icon, 'w-3.5 h-3.5')} ${L(sec.title)}</div>
      <h2 class="help-title"><span class="help-title-icon">${getIcon(a.icon, 'w-5 h-5')}</span>${L(a.title)}</h2>
      <p class="help-lead">${L(a.summary)}</p>
      <div class="help-body">${body}</div>
      <div class="help-actions">
        ${a.go ? `<button type="button" class="btn btn-primary btn-sm" data-go="${a.go}">${getIcon('arrow-right', 'w-3.5 h-3.5')} ${ui.open}</button>` : ''}
        ${a.action === 'crash' ? `<button type="button" class="btn btn-primary btn-sm" data-crash>${getIcon('bug', 'w-3.5 h-3.5')} ${ui.crash}</button>` : ''}
        <a class="btn btn-ghost btn-sm" href="${DOCS_SITE}${lang() === 'fr' ? 'fr/' : ''}${a.site}" target="_blank" rel="noopener">${getIcon('external-link', 'w-3.5 h-3.5')} ${ui.full}</a>
      </div>`;
    el.querySelector('[data-go]')?.addEventListener('click', () => navigate(a.go));
    el.querySelector('[data-crash]')?.addEventListener('click', async () => (await import('../components/crash-dialog.js')).openCrashLogDialog());
}

function paramsTable(ui) {
    const rows = SDEF_PARAMS.map(p => `<tr>
        <td><code>${p.key}</code>${p.undocumented ? ' <span class="sdef-badge">ED</span>' : ''}</td>
        <td>${p.type}${p.values ? `<br><small>${p.values.join(' · ')}</small>` : ''}</td>
        <td><code>${escapeHtml(Array.isArray(p.default) ? `{${p.default.join(', ')}}` : p.default ?? '—')}</code></td>
        <td>${escapeHtml(p.desc)}</td></tr>`).join('');
    return `<table class="help-table help-table--dense"><tr><th>${ui.key}</th><th>${ui.type}</th><th>${ui.def}</th><th>${ui.meaning}</th></tr>${rows}</table>`;
}

async function typesTable(ui) {
    const analyzer = await import('../utils/audio-analyzer.js');
    await analyzer.ensureRulesLoaded();
    const types = analyzer.SOUND_TYPES || {};
    return `<div class="help-types">${Object.entries(types).map(([id, ty]) => `
      <div class="help-type">${analyzer.getTypeIconHtml(ty, 'w-4 h-4')}
        <div><b>${escapeHtml(ty.label)}</b><small><code>${escapeHtml(id)}</code> · ${escapeHtml(ty.description || '')}</small></div></div>`).join('')}</div>`;
}
