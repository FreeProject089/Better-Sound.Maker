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
function init() {
    // Render sidebar
    const sidebar = document.getElementById('sidebar');
    renderNav(sidebar);

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
        container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Page not found</div></div>`;
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
