import { t } from '../utils/i18n.js';
import { navigate } from '../state/store.js';
import { getIcon, renderIcons } from '../utils/icons.js';

export function renderFaq(container) {
  const faqs = [
    {
      q: t('faq.q1.title'),
      a: t('faq.q1.desc'),
    },
    {
      q: t('faq.q2.title'),
      a: t('faq.q2.desc'),
    },
    {
      q: t('faq.q3.title'),
      a: t('faq.q3.desc'),
    },
    {
      q: t('faq.q4.title'),
      a: `${t('faq.q4.desc')} <a href="#" id="faq-docs-link" style="color: var(--accent-blue); text-decoration: underline;">${t('nav.docs')}</a>.`,
    },
    {
      q: t('faq.q5.title'),
      a: t('faq.q5.desc'),
      extra: `<a href="https://github.com/better-dcs/Better-Sound.Maker" target="_blank" class="btn btn-secondary btn-sm" style="margin-top: 12px; display: inline-flex;">${getIcon('github', 'w-4 h-4')} ${t('creditsPage.github.title')}</a>`
    },
    {
      q: t('faq.q6.title'),
      a: t('faq.q6.desc'),
      extra: `<button id="faq-community-btn" class="btn btn-secondary btn-sm" style="margin-top: 12px;">${t('presetsPage.communityBtn')}</button>`
    },
    {
      q: t('faq.q7.title'),
      a: t('faq.q7.desc'),
    },
    {
      q: t('faq.q8.title'),
      a: t('faq.q8.desc'),
    },
    {
      q: t('faq.q9.title'),
      a: t('faq.q9.desc'),
    },
    {
      q: t('faq.q10.title'),
      a: t('faq.q10.desc'),
    },
    {
      q: t('faq.q11.title'),
      a: t('faq.q11.desc'),
    },
    {
      q: t('faq.q12.title'),
      a: t('faq.q12.desc'),
    },
    {
      q: t('faq.q13.title'),
      a: t('faq.q13.desc'),
    },
    {
      q: t('faq.q14.title'),
      a: t('faq.q14.desc'),
    },
  ];

  const cards = faqs.map((item, i) => `
    <div class="card faq-card" style="margin-bottom: 12px;">
      <button class="faq-toggle" data-faq="${i}" style="display:flex; width:100%; align-items:center; justify-content:space-between; background:none; border:none; cursor:pointer; padding:2px 0; text-align:left; gap:12px;">
        <h3 style="font-size: 15px; font-weight: 600; margin: 0; color: var(--text-primary);">${item.q}</h3>
        <span class="faq-arrow" data-faq-arrow="${i}" style="flex-shrink:0; transition:transform 0.2s; color:var(--text-muted);">${getIcon('chevron-down', 'w-4 h-4')}</span>
      </button>
      <div class="faq-body" id="faq-body-${i}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color);">
        <p style="color: var(--text-muted); line-height: 1.6; margin:0 0 8px 0;">${item.a}</p>
        ${item.extra || ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('faq.title')}</h1>
      <p class="page-description">${t('faq.description')}</p>
    </div>
    ${cards}
  `;

  renderIcons(container);

  // Accordion toggle
  container.querySelectorAll('.faq-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.faq;
      const body = document.getElementById(`faq-body-${idx}`);
      const arrow = container.querySelector(`[data-faq-arrow="${idx}"]`);
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
    });
  });

  document.getElementById('faq-docs-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('docs');
  });

  document.getElementById('faq-community-btn')?.addEventListener('click', () => {
    navigate('presets');
  });
}
