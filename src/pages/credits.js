/**
 * credits.js — Credits page (redesigned)
 */
import { t, updateTranslations } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';

export function renderCredits(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title" data-i18n="nav.credits">Credits</h1>
      <p class="page-description">${t('creditsPage.subtitle')}</p>
    </div>

    <div class="credits-hero card" style="max-width:720px;margin-bottom:28px;text-align:center;padding:36px 28px;background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(6,182,212,0.06));border-color:rgba(59,130,246,0.25);">
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <div class="credits-logo-wrap">
          <img src="icon.png" alt="Better Sound.Maker" class="credits-logo-img" />
        </div>
      </div>
      <h2 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">Better Sound.Maker</h2>
      <div class="credits-version-badge">v1.0.0</div>
      <div class="accent-line" style="max-width:180px;margin:18px auto;"></div>
      <p style="color:var(--text-secondary);max-width:480px;margin:0 auto;font-size:14px;line-height:1.7;">
        ${t('creditsPage.appDescription')}
      </p>
    </div>

    <div class="grid-2" style="max-width:720px;margin-bottom:24px;gap:16px;">
      <div class="card credits-info-card">
        <div class="credits-card-icon" style="background:transparent; padding:0; overflow:hidden;">
          <img src="pfp.png" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" alt="Author" />
        </div>
        <div class="credits-card-label">${t('creditsPage.author')}</div>
        <div class="credits-card-value">FreeProject089</div>
        <div class="credits-card-sub">${t('creditsPage.creator')}</div>
      </div>
      <div class="card credits-info-card">
        <div class="credits-card-icon" style="background:transparent; padding:0;">
          <img src="dcs.png" style="width:100%; height:100%; object-fit:contain;" alt="DCS World" />
        </div>
        <div class="credits-card-label">${t('creditsPage.builtFor')}</div>
        <div class="credits-card-value">DCS World 2.9+</div>
        <div class="credits-card-sub">Eagle Dynamics</div>
      </div>
    </div>

    <div class="card" style="max-width:720px;">
      <div class="card-title" style="margin-bottom:18px;">${t('creditsPage.linksTitle')}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">

        <a href="https://github.com/FreeProject089/Better-ModMaker" target="_blank" class="credits-link-card credits-link-github">
          <div class="credits-link-icon">
            ${getIcon('github', 'w-6 h-6')}
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.github.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.github.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

        <a href="https://discord.gg/CTaaEF9R75" target="_blank" class="credits-link-card credits-link-discord">
          <div class="credits-link-icon">
             ${getIcon('message-circle', 'w-6 h-6')}
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.discord.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.discord.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

        <a href="https://forums.eagle.ru/" target="_blank" class="credits-link-card credits-link-ed">
          <div class="credits-link-icon" style="background:transparent; padding:0; overflow:hidden;">
            <img src="ED.png" style="width:100%; height:100%; object-fit:cover;" alt="Eagle Dynamics" />
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.ed.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.ed.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

      </div>
    </div>
  `;

  injectCreditsStyles();
  renderIcons(container);
}

function injectCreditsStyles() {
  if (document.getElementById('credits-styles')) return;
  const style = document.createElement('style');
  style.id = 'credits-styles';
  style.textContent = `
    .credits-logo-wrap {
      width: 88px;
      height: 88px;
      border-radius: 22px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      box-shadow: 0 0 30px rgba(59,130,246,0.2);
    }
    .credits-logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }
    .credits-version-badge {
      display: inline-block;
      background: rgba(59,130,246,0.15);
      color: var(--accent-blue);
      border: 1px solid rgba(59,130,246,0.3);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      border-radius: 100px;
      margin-top: 6px;
    }
    .credits-info-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 20px;
    }
    .credits-card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .credits-card-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
    }
    .credits-card-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .credits-card-sub {
      font-size: 12px;
      color: var(--text-secondary);
    }
    .credits-link-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      transition: all var(--transition-default);
      background: rgba(255,255,255,0.02);
    }
    .credits-link-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .credits-link-github { color: var(--text-primary); }
    .credits-link-github:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.15); }
    .credits-link-discord { color: #7289da; }
    .credits-link-discord:hover { background: rgba(88,101,242,0.08); border-color: rgba(88,101,242,0.3); }
    .credits-link-ed { color: var(--accent-amber); }
    .credits-link-ed:hover { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.25); }
    .credits-link-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .credits-link-text { flex: 1; }
    .credits-link-title { font-size: 14px; font-weight: 600; }
    .credits-link-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .credits-link-arrow { font-size: 18px; color: var(--text-muted); font-weight: 300; }
    @media (max-width: 480px) {
      .credits-hero { padding: 24px 16px !important; }
    }
  `;
  document.head.appendChild(style);
}
