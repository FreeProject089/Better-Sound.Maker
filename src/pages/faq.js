import { t } from '../utils/i18n.js';
import { navigate } from '../state/store.js';

export function renderFaq(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('faq.title')}</h1>
      <p class="page-description">${t('faq.description')}</p>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q1.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q1.desc')}</p>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q2.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q2.desc')}</p>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q3.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q3.desc')}</p>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q4.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q4.desc')} <a href="#" id="faq-docs-link" style="color: var(--accent-blue); text-decoration: underline;">${t('nav.docs')}</a>.</p>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q5.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q5.desc')}</p>
      <a href="https://github.com/FreeProject089/Better-ModMaker" target="_blank" class="btn btn-secondary btn-sm" style="margin-top: 12px; display: inline-flex;">GitHub Repository</a>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${t('faq.q6.title')}</h3>
      <p style="color: var(--text-muted); line-height: 1.5;">${t('faq.q6.desc')}</p>
      <button id="faq-community-btn" class="btn btn-secondary btn-sm" style="margin-top: 12px;">${t('presetsPage.communityBtn')}</button>
    </div>
  `;

  document.getElementById('faq-docs-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('docs');
  });

  document.getElementById('faq-community-btn')?.addEventListener('click', () => {
    navigate('presets');
  });
}
