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

const CURRENT_VERSION = '1.0.1';
const LAST_VERSION_KEY = 'bsm-last-run-version';

// Simple Markdown parser
function parseMarkdown(md) {
    if (!md) return '';
    return md
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/\n(<li>.*<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul><ul>/g, '')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

async function checkReleaseNotes() {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY);

    // Only show if version changed OR it's the very first time we track it and we are on 1.0.1
    if (lastVersion !== CURRENT_VERSION) {
        if (window.electronAPI) {
            try {
                const appPath = await window.electronAPI.getAppPath();
                // Depending on structure (dev vs prod), path might vary.
                // In dev, it's root. In prod, it might be resources/app.
                // We'll try to find the Update folder.
                const notePath = `${appPath}/Update/.md/v${CURRENT_VERSION}.md`;
                const content = await window.electronAPI.readTextFile(notePath);

                if (content) {
                    const { showModal } = await import('./utils/modal.js');
                    showModal({
                        title: `✨ What's New in v${CURRENT_VERSION}`,
                        content: `<div class="release-notes">${parseMarkdown(content)}</div>`,
                        buttons: [
                            { text: 'Awesome!', primary: true },
                            {
                                text: 'View All Notes',
                                onClick: () => {
                                    // Could navigate to a special 'Updates' page if we had one
                                    // For now just console log or toast
                                    import('./components/toast.js').then(({ showToast }) => {
                                        showToast('All release notes are in the /Update folder', 'info');
                                    });
                                }
                            }
                        ]
                    });
                }
            } catch (e) {
                console.warn('Could not load release notes:', e);
            }
        }
        localStorage.setItem(LAST_VERSION_KEY, CURRENT_VERSION);
    }
}

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

    // Check release notes (after a short delay to let app settle)
    setTimeout(checkReleaseNotes, 1000);

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
