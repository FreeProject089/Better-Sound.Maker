/**
 * nav.js — Sidebar navigation component
 * Better Sound.Maker
 */

import { getState, subscribe, navigate, getSelectedCount } from '../state/store.js';

const NAV_ITEMS = [
  { id: 'library', icon: '📚', label: 'Assets Library', section: 'WORKSPACE' },
  { id: 'project', icon: '📁', label: 'Project', section: 'WORKSPACE', badge: true },
  { id: 'sdef-editor', icon: '🎛️', label: 'SDEF Editor', section: 'WORKSPACE' },
  { id: 'theme', icon: '🎨', label: 'Theme', section: 'CUSTOMIZATION' },
  { id: 'presets', icon: '💾', label: 'Presets', section: 'CUSTOMIZATION' },
  { id: 'collaboration', icon: '🤝', label: 'Collaboration', section: 'TEAM' },
  { id: 'build', icon: '🚀', label: 'Build Mod', section: 'EXPORT' },
  { id: 'docs', icon: '📖', label: 'Documentation', section: 'HELP' },
  { id: 'credits', icon: '⭐', label: 'Credits', section: 'HELP' }
];

export function renderNav(container) {
  container.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <img src="/BetterSoundMod.png" alt="Better Sound.Maker" class="sidebar-brand-img" />
      </div>
      <!-- sidebar-logo removed as requested -->
    </div>
    <div class="sidebar-nav" id="nav-items"></div>
    <div style="padding: 14px 18px; border-top: 1px solid var(--border-subtle);">
      <div style="font-size: 11px; color: var(--text-muted);">DCS 2.9.8.1214</div>
    </div>
  `;

  renderNavItems();

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
      html += `<div class="nav-section-label">${item.section}</div>`;
    }

    const active = currentPage === item.id ? 'active' : '';
    const badge = item.badge && selectedCount > 0
      ? `<span class="nav-badge">${selectedCount}</span>`
      : '';

    html += `
      <div class="nav-item ${active}" data-page="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${badge}
      </div>
    `;
  }

  navContainer.innerHTML = html;

  // Add click handlers
  navContainer.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigate(el.dataset.page);
    });
  });
}
