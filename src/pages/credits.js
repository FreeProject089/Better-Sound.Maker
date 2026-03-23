/**
 * credits.js — Credits page (redesigned)
 */
import { t, updateTranslations } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { showModal } from '../components/modal.js';
import { GITHUB_REPO, APP_VERSION } from '../utils/version.js';

export function renderCredits(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title" data-i18n="nav.credits">Credits</h1>
      <p class="page-description">${t('creditsPage.subtitle')}</p>
    </div>

    <div class="credits-hero card" style="max-width:720px;margin-bottom:28px;text-align:center;padding:36px 28px;background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(6,182,212,0.06));border-color:rgba(59,130,246,0.25);">
      <div style="display:flex;justify-content:center;margin-bottom:18px;">
        <div class="credits-logo-wrap">
          <img src="Bm.png" alt="Better Sound.Maker" class="credits-logo-img" />
        </div>
      </div>
      <h2 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">Better Sound.Maker</h2>
      <div class="credits-version-badge">v${APP_VERSION}</div>
      <div class="accent-line" style="max-width:180px;margin:18px auto;"></div>
      <p style="color:var(--text-secondary);max-width:480px;margin:0 auto;font-size:14px;line-height:1.7;">
        ${t('creditsPage.appDescription')}
      </p>
    </div>

    <div class="grid-2" style="max-width:720px;margin-bottom:24px;gap:16px;">
      <div class="card credits-info-card">
        <div class="credits-card-icon" style="background:transparent; padding:0; overflow:hidden;">
          <img src="pfp.webp" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" alt="Author" />
        </div>
        <div class="credits-card-label">${t('creditsPage.author')}</div>
        <div class="credits-card-value">FreeProject089</div>
        <div class="credits-card-sub">${t('creditsPage.creator')}</div>
      </div>
      <div class="card credits-info-card">
        <div class="credits-card-icon" style="background:transparent; padding:0;">
          <img src="dcs.webp" style="width:100%; height:100%; object-fit:contain;" alt="DCS World" />
        </div>
        <div class="credits-card-label">${t('creditsPage.builtFor')}</div>
        <div class="credits-card-value">DCS World 2.9+</div>
        <div class="credits-card-sub">Eagle Dynamics</div>
      </div>
    </div>

    <div class="card" style="max-width:720px;">
      <div class="card-title" style="margin-bottom:18px;">${t('creditsPage.linksTitle')}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">

        <a href="https://github.com/FreeProject089/Better-Sound.Maker" target="_blank" class="credits-link-card credits-link-github">
          <div class="credits-link-icon">
            <svg viewBox="0 0 16 16" fill="currentColor" style="width:24px; height:24px;" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.github.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.github.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

        <a href="https://discord.gg/CTaaEF9R75" target="_blank" class="credits-link-card credits-link-discord">
          <div class="credits-link-icon">
             <svg viewBox="0 0 24 24" fill="currentColor" style="width:28px; height:28px;" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01 10.198 10.198 0 0 0 .372.292.077.077 0 0 1-.008.128 12.723 12.723 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
            </svg>
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.discord.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.discord.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

        <a href="https://forums.eagle.ru/" target="_blank" class="credits-link-card credits-link-ed">
          <div class="credits-link-icon" style="background:transparent; padding:0; overflow:hidden;">
            <img src="ED.webp" style="width:100%; height:100%; object-fit:cover;" alt="Eagle Dynamics" />
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title">${t('creditsPage.ed.title')}</div>
            <div class="credits-link-sub">${t('creditsPage.ed.sub')}</div>
          </div>
          <div class="credits-link-arrow">${getIcon('external-link', 'w-4 h-4')}</div>
        </a>

        <a href="#" id="credits-license-btn" class="credits-link-card" style="color: var(--text-primary);">
          <div class="credits-link-icon">
            ${getIcon('file-text', 'w-6 h-6')}
          </div>
          <div class="credits-link-text">
            <div class="credits-link-title" data-i18n="creditsPage.license.title">License</div>
            <div class="credits-link-sub" data-i18n="creditsPage.license.sub">View Apache-2.0 License</div>
          </div>
          <div class="credits-link-arrow"></div>
        </a>

      </div>
    </div>
  `;

  injectCreditsStyles();
  renderIcons(container);

  const licenseBtn = container.querySelector('#credits-license-btn');
  if (licenseBtn) {
    licenseBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        let text;
        if (window.APP_CONFIG?.LocalLicense === 'true') {
          if (window.electronAPI) {
            const appPath = await window.electronAPI.getAppPath();
            // Try public/LICENSE first, fallback to LICENSE if not found
            try {
              text = await window.electronAPI.readTextFile(`${appPath}/public/LICENSE`);
            } catch (e) {
              text = await window.electronAPI.readTextFile(`${appPath}/LICENSE`);
            }
          } else {
            // Load from local web server path
            const resp = await fetch('./LICENSE');
            text = await resp.text();
          }
        } else {
          // Load from Github
          let resp = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/LICENSE`);
    if (!resp.ok) {
      resp = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/master/LICENSE`);
    }
          if (resp.ok) {
            text = await resp.text();
          } else {
            throw new Error('Could not load license from GitHub');
          }
        }

        if (!text) throw new Error('No content');

        // BETTER FORMATTING: Convert plain text license to clean HTML
        const formattedText = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\r\n/g, '\n')
          // Split into paragraphs by double newlines
          .split(/\n\n+/)
          .map(para => {
            para = para.trim();
            if (!para) return '';
            // If it's a section header (all caps or numbered)
            if (/^([0-9]+\.|[A-Z\s]{5,})$/.test(para.split('\n')[0])) {
              return `<h3 style="color:var(--text-primary); font-size:14px; margin: 20px 0 10px; border-bottom:1px solid var(--border-subtle); padding-bottom:5px;">${para}</h3>`;
            }
            return `<p style="margin-bottom: 12px; text-align: justify;">${para.replace(/\n/g, ' ')}</p>`;
          })
          .join('');

        showModal({
          title: t('creditsPage.license.title') || 'License',
          content: `<div style="font-size: 13px; line-height: 1.6; max-height: 55vh; overflow-y: auto; padding: 24px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); color: var(--text-secondary); font-family: 'Inter', sans-serif;">${formattedText}</div>`,
          actions: [{ id: 'close', label: t('common.close') || 'Close', class: 'btn-secondary' }]
        });
      } catch (err) {
        console.warn('License fetch failed, falling back to GitHub page:', err);
        window.open(`https://github.com/${GITHUB_REPO}`, '_blank');
      }
    });
  }
}

function injectCreditsStyles() {
  if (document.getElementById('credits-styles')) return;
  const style = document.createElement('style');
  style.id = 'credits-styles';
  style.textContent = `
    .credits-logo-wrap { width: 88px; height: 88px; border-radius: 22px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; padding: 10px; box-shadow: 0 0 30px rgba(59, 130, 246, 0.2); }
    .credits-logo-img { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; }
    .credits-version-badge { display: inline-block; background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.3); font-size: 11px; font-weight: 700; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 100px; margin-top: 6px; }
    .credits-info-card { display: flex; flex-direction: column; gap: 4px; padding: 20px; }
    .credits-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
    .credits-card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); }
    .credits-card-value { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .credits-card-sub { font-size: 12px; color: var(--text-secondary); }
    .credits-link-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-decoration: none; transition: all var(--transition-default); background: rgba(255, 255, 255, 0.02); }
    .credits-link-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .credits-link-github { color: var(--text-primary); }
    .credits-link-github:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.15); }
    .credits-link-discord { color: #7289da; }
    .credits-link-discord:hover { background: rgba(88, 101, 242, 0.08); border-color: rgba(88, 101, 242, 0.3); }
    .credits-link-ed { color: var(--accent-amber); }
    .credits-link-ed:hover { background: rgba(245, 158, 11, 0.06); border-color: rgba(245, 158, 11, 0.25); }
    .credits-link-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .credits-link-text { flex: 1; }
    .credits-link-title { font-size: 14px; font-weight: 600; }
    .credits-link-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .credits-link-arrow { font-size: 18px; color: var(--text-muted); font-weight: 300; }
    @media (max-width: 480px) { .credits-hero { padding: 24px 16px !important; } }
  `;
  document.head.appendChild(style);
}
