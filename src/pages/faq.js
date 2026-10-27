/**
 * faq.js — F.A.Q: searchable questions grouped by category
 *
 * Text lives in src/data/help-content.js (FAQ, FAQ_CATEGORIES). An entry may
 * carry `go` (open an app page) or `action` ('crash' | 'tour').
 */

import { getCurrentLanguage } from '../utils/i18n.js';
import { navigate } from '../state/store.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { FAQ, FAQ_CATEGORIES } from '../data/help-content.js';
import './help.css';

const UI = {
    en: { title: 'F.A.Q', desc: 'Quick answers to the questions people ask most.', search: 'Search a question…', all: 'All', none: 'No question matches', open: 'Take me there', crash: 'Generate a crash log', tour: 'Replay the tutorial', more: 'Still stuck?', moreDesc: 'Read the documentation or open an issue on GitHub with a crash log.', docs: 'Documentation', issue: 'Open an issue', expand: 'Expand all', collapse: 'Collapse all' },
    fr: { title: 'F.A.Q', desc: 'Des réponses rapides aux questions les plus fréquentes.', search: 'Rechercher une question…', all: 'Toutes', none: 'Aucune question ne correspond', open: 'M\'y emmener', crash: 'Générer un crash log', tour: 'Relancer le tutoriel', more: 'Toujours bloqué ?', moreDesc: 'Lisez la documentation ou ouvrez une issue sur GitHub avec un crash log.', docs: 'Documentation', issue: 'Ouvrir une issue', expand: 'Tout déplier', collapse: 'Tout replier' },
};

let category = 'all';
let query = '';

const lang = () => (getCurrentLanguage() === 'fr' ? 'fr' : 'en');
const L = (o) => (o ? o[lang()] ?? o.en : '');

export function renderFaq(container) {
    const ui = UI[lang()];
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${ui.title}</h1>
        <p class="page-description">${ui.desc}</p>
      </div>
      <div class="faq-toolbar">
        <label class="help-search">${getIcon('search', 'w-4 h-4')}
          <input type="search" id="faq-search" placeholder="${ui.search}" value="${escapeHtml(query)}" autocomplete="off" />
        </label>
        <div class="faq-chips" role="tablist">
          ${[{ id: 'all', icon: 'layers', title: { en: ui.all, fr: ui.all } }, ...FAQ_CATEGORIES].map(c => `
            <button type="button" class="faq-chip ${c.id === category ? 'on' : ''}" data-cat="${c.id}">${getIcon(c.icon, 'w-3.5 h-3.5')} ${L(c.title)}
              <span>${c.id === 'all' ? FAQ.length : FAQ.filter(f => f.cat === c.id).length}</span></button>`).join('')}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="faq-toggle-all">${ui.expand}</button>
      </div>
      <div id="faq-list"></div>
      <div class="faq-more card">
        <div class="faq-more-icon">${getIcon('life-buoy', 'w-6 h-6')}</div>
        <div><b>${ui.more}</b><p>${ui.moreDesc}</p></div>
        <div class="faq-more-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-nav="docs">${getIcon('book-open', 'w-3.5 h-3.5')} ${ui.docs}</button>
          <a class="btn btn-primary btn-sm" href="https://github.com/FreeProject089/Better-Sound.Maker/issues/new/choose" target="_blank" rel="noopener">${getIcon('github', 'w-3.5 h-3.5')} ${ui.issue}</a>
        </div>
      </div>`;

    const search = container.querySelector('#faq-search');
    search.addEventListener('input', () => { query = search.value.trim(); renderList(container); });
    container.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
        category = b.dataset.cat;
        container.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b));
        renderList(container);
    }));
    container.querySelector('[data-nav="docs"]').addEventListener('click', () => navigate('docs'));
    container.querySelector('#faq-toggle-all').addEventListener('click', (e) => {
        const items = [...container.querySelectorAll('.faq-item')];
        const open = !items.every(d => d.open);
        items.forEach(d => { d.open = open; });
        e.currentTarget.textContent = open ? ui.collapse : ui.expand;
    });
    renderList(container);
}

function renderList(container) {
    const ui = UI[lang()];
    const q = query.toLowerCase();
    const items = FAQ.filter(f => (category === 'all' || f.cat === category)
        && (!q || `${L(f.q)} ${L(f.a)}`.replace(/<[^>]+>/g, ' ').toLowerCase().includes(q)));
    const list = container.querySelector('#faq-list');

    if (!items.length) {
        list.innerHTML = `<p class="help-empty">${ui.none} « ${escapeHtml(query)} »</p>`;
        return;
    }
    list.innerHTML = items.map(f => {
        const cat = FAQ_CATEGORIES.find(c => c.id === f.cat);
        return `<details class="faq-item" ${q ? 'open' : ''}>
          <summary><span class="faq-q-icon">${getIcon(cat.icon, 'w-4 h-4')}</span><span class="faq-q">${L(f.q)}</span>${getIcon('chevron-down', 'w-4 h-4 faq-chevron')}</summary>
          <div class="faq-a"><p>${L(f.a)}</p>
            ${f.go ? `<button type="button" class="btn btn-secondary btn-sm" data-go="${f.go}">${getIcon('arrow-right', 'w-3.5 h-3.5')} ${ui.open}</button>` : ''}
            ${f.action === 'crash' ? `<button type="button" class="btn btn-secondary btn-sm" data-act="crash">${getIcon('bug', 'w-3.5 h-3.5')} ${ui.crash}</button>` : ''}
            ${f.action === 'tour' ? `<button type="button" class="btn btn-secondary btn-sm" data-act="tour">${getIcon('play-circle', 'w-3.5 h-3.5')} ${ui.tour}</button>` : ''}
          </div></details>`;
    }).join('');

    list.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.go)));
    list.querySelectorAll('[data-act="crash"]').forEach(b => b.addEventListener('click', async () => (await import('../components/crash-dialog.js')).openCrashLogDialog()));
    list.querySelectorAll('[data-act="tour"]').forEach(b => b.addEventListener('click', async () => (await import('./onboarding.js')).startOnboarding()));
}
