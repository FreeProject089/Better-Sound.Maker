/**
 * nav.js — Sidebar navigation component
 * Better Sound.Maker
 */

import { getState, subscribe, navigate, getSelectedCount } from '../state/store.js';
import { getAvailableLanguages, getCurrentLanguage, changeLanguage, t } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';
import { APP_VERSION } from '../utils/version.js';

const NAV_ITEMS = [
  { id: 'library', icon: 'library', label: 'nav.library', section: 'nav.section.workspace' },
  { id: 'project', icon: 'folder', label: 'nav.projects', section: 'nav.section.workspace', badge: true },
  { id: 'sdef-editor', icon: 'sliders', label: 'nav.sdef', section: 'nav.section.workspace' },
  { id: 'theme', icon: 'palette', label: 'nav.theme', section: 'nav.section.customization' },
  { id: 'presets', icon: 'save', label: 'nav.presets', section: 'nav.section.customization' },
  { id: 'custom-types', icon: 'tag', label: 'nav.soundTypes', section: 'nav.section.customization' },
  { id: 'collaboration', icon: 'users', label: 'nav.collab', section: 'nav.section.team' },
  { id: 'build', icon: 'rocket', label: 'nav.builder', section: 'nav.section.export' },
  { id: 'settings', icon: 'settings', label: 'nav.settings', section: 'nav.section.help' },
  { id: 'docs', icon: 'book-open', label: 'nav.docs', section: 'nav.section.help' },
  { id: 'faq', icon: 'help-circle', label: 'nav.faq', section: 'nav.section.help' },
  { id: 'credits', icon: 'star', label: 'nav.credits', section: 'nav.section.help' },
  { id: 'tutorial', icon: 'play-circle', label: 'nav.tutorial', section: 'nav.section.help' }
];
export function renderNav(container) {
  const languages = getAvailableLanguages();
  // ... (omitted unchanging lines)
  // ...
  // ...

  const currentLang = getCurrentLanguage();
  const currentLangObj = languages.find(l => l.code === currentLang) || languages[0];

  const langOptions = languages.map(lang => `
    <div class="lang-option ${lang.code === currentLang ? 'selected' : ''}" data-lang="${lang.code}">
      <span class="option-flag">${lang.flag}</span>
      <span>${lang.name}</span>
      ${lang.code === currentLang ? getIcon('check', 'w-3 h-3 ml-auto') : ''}
    </div>
  `).join('');

  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <img src="./BetterSoundMod.webp " alt="Better Sound.Maker" class="sidebar-brand-img" />
      </div>
    </div>
    
    <div class="sidebar-nav" id="nav-items"></div>
    
    <div class="sidebar-lang">
        <div class="lang-dropdown">
            <button class="lang-dropdown-btn" id="lang-dropdown-btn">
                <span class="option-flag">${currentLangObj.flag}</span>
                <span>${currentLangObj.name}</span> 
                <span class="lang-chevron">${getIcon('chevron-down', 'w-4 h-4')}</span>
            </button>
            <div class="lang-dropdown-menu" id="lang-dropdown-menu">
                ${langOptions}
            </div>
        </div>
    </div>

    <div style="padding: 14px 18px; border-top: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
        <span>DCS 2.9 & More</span>
        <div id="sidebar-version-tag" class="version-badge-clickable" style="padding: 2px 8px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-subtle); border-radius: 10px; opacity: 0.8; cursor: pointer; transition: all 0.2s ease;">v${APP_VERSION}</div>
      </div>
      <button id="sidebar-update-btn" class="btn btn-secondary btn-sm" style="width: 100%; border-radius: 8px; font-size: 10px; padding: 6px; background: rgba(100,255,218,0.05); color: var(--accent-green); border: 1px solid rgba(100,255,218,0.2);">
        ${getIcon('refresh-cw', 'w-3 h-3 mr-2')}
        Check for Updates
      </button>
    </div>
  `;

  renderNavItems();

  // Language Dropdown Handlers
  const btn = container.querySelector('#lang-dropdown-btn');
  const menu = container.querySelector('#lang-dropdown-menu');

  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
      btn.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
        btn.classList.remove('active');
      }
    });

    menu.querySelectorAll('.lang-option').forEach(el => {
      el.addEventListener('click', () => {
        const code = el.dataset.lang;
        changeLanguage(code);
        renderNav(container);
      });
    });
  }

  const updateBtn = container.querySelector('#sidebar-update-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', async () => {
      if (window.APP_CONFIG?.DisableAutoUpdate === 'true') {
        const { showModal } = await import('../utils/modal.js');
        showModal({
          title: 'Updates Disabled',
          content: '<p>The auto-update feature has been disabled via the configuration file (Load.cfg).</p><p style="margin-top: 10px; color: var(--text-muted); font-size: 13px;">Please check the official repository manually for new versions.</p>',
          buttons: [{ text: 'OK', primary: true }]
        });
        return;
      }
      const { checkUpdate } = await import('../utils/update-check.js');
      checkUpdate(false); // quiet = false to show feedback if up to date
    });
  }

  const versionTag = container.querySelector('#sidebar-version-tag');
  if (versionTag) {
    versionTag.addEventListener('click', () => {
      if (window.showAllReleaseNotes) {
        window.showAllReleaseNotes();
      }
    });
  }


  // Render initial icons in static parts (lang selector)
  renderIcons(container);

  subscribe('currentPage', renderNavItems);
  subscribe('selectedAssets', renderNavItems);
}

function renderNavItems() {
  const navContainer = document.getElementById('nav-items');
  if (!navContainer) return;

  const state = getState();
  const currentPage = state.currentPage;
  const selectedCount = getSelectedCount();

  let html = '';
  let lastSection = '';

  for (const item of NAV_ITEMS) {
    if (item.section !== lastSection) {
      lastSection = item.section;
      html += `<div class="nav-section-label">${t(item.section)}</div>`;
    }

    const active = currentPage === item.id ? 'active' : '';
    const badge = item.badge && selectedCount > 0
      ? `<span class="nav-badge">${selectedCount}</span>`
      : '';

    // Translate label
    const label = t(item.label);

    html += `
      <div class="nav-item ${active}" data-page="${item.id}">
        <span class="nav-icon">${getIcon(item.icon)}</span>
        <span>${label}</span>
        ${badge}
      </div>
    `;
  }

  navContainer.innerHTML = html;

  // Add click handlers
  navContainer.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.page === 'tutorial') {
        import('../pages/onboarding.js').then(m => m.restartTutorial());
      } else {
        navigate(el.dataset.page);
      }
    });
  });

  // Render icons (Lucide)
  renderIcons(navContainer);
}
