/**
 * main.js — App bootstrap and router
 * Better Sound.Maker
 */

import './style.css';
import { renderNav } from './components/nav.js';
import { renderLibrary } from './pages/library.js';
import { renderProject } from './pages/project.js';
import { renderSdefEditor } from './pages/sdef-editor.js';
import { renderTheme } from './pages/theme.js';
import { renderPresets } from './pages/presets.js';
import { renderBuild } from './pages/build.js';
import { renderDocs } from './pages/docs.js';
import { renderCredits } from './pages/credits.js';
import { renderCollaboration } from './pages/collaboration.js';
import { getState, subscribe, navigate } from './state/store.js';

// Page renderers map
const pages = {
    'library': renderLibrary,
    'project': renderProject,
    'sdef-editor': renderSdefEditor,
    'theme': renderTheme,
    'presets': renderPresets,
    'collaboration': renderCollaboration,
    'build': renderBuild,
    'docs': renderDocs,
    'credits': renderCredits
};

// Initialize app
async function init() {
    // Init i18n first
    const { initI18n, t } = await import('./utils/i18n.js');
    await initI18n();
    window.i18n_t = t; // Expose to scope if needed or just use imported t if we can.
    // Actually we can't import t at top level properly if we are using dynamic import for init? 
    // But i18n.js exports t.
    // The previous code was using import at top level for renderNav but inside init for i18n?
    // Let's stick to consistent strategy.

    // Render sidebar
    const sidebar = document.getElementById('sidebar');
    renderNav(sidebar);

    // Init onboarding
    const { initOnboarding } = await import('./pages/onboarding.js');
    initOnboarding();

    // Listen for page changes
    subscribe('currentPage', renderCurrentPage);

    // Initial render
    renderCurrentPage();
}

function renderCurrentPage() {
    const state = getState();
    const page = state.currentPage || 'library';
    const container = document.getElementById('page-container');

    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Add fade-in
    container.classList.remove('fade-in');
    void container.offsetWidth; // force reflow
    container.classList.add('fade-in');

    // Render page
    const renderer = pages[page];
    if (renderer) {
        renderer(container);
    } else {
        // Dynamic import workaround for t() if not available in module scope
        import('./utils/i18n.js').then(({ t }) => {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-title">${t('common.pageNotFound')}</div></div>`;
        });
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Listen for global language change event
window.addEventListener('languageChanged', () => {
    // Re-render current page to update translations
    renderCurrentPage();
});
