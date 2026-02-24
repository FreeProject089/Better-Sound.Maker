/**
 * main.js — App bootstrap and router
 * Better Sound.Maker
 */

import './style.css';
import rawCfg from './Load.cfg?raw';
import { renderNav } from './components/nav.js';
import { renderLibrary } from './pages/library.js';
import { renderProject } from './pages/project.js';
import { renderSdefEditor } from './pages/sdef-editor.js';
import { renderTheme } from './pages/theme.js';
import { renderPresets } from './pages/presets.js';
import { renderBuild } from './pages/build.js';
import { renderSettings } from './pages/settings.js';
import { renderDocs } from './pages/docs.js';
import { renderFaq } from './pages/faq.js';
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
    'settings': renderSettings,
    'docs': renderDocs,
    'faq': renderFaq,
    'credits': renderCredits
};

const CURRENT_VERSION = '1.0.4';
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
        .replace(/__(.*)__/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/_(.*)_/g, '<em>$1</em>')
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/^---$/gm, '<hr>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px; margin:10px 0;" />')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/\n\n/g, '<p></p>')
        .replace(/\n/g, '<br>');
}

async function checkReleaseNotes() {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY);

    if (lastVersion !== CURRENT_VERSION) {
        if (window.electronAPI) {
            try {
                const appPath = await window.electronAPI.getAppPath();
                // Release notes are kept for v1.0.1+
                const notePath = `${appPath}/Update/.md/PATCH_NOTES_v${CURRENT_VERSION}.md`;
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
                                onClick: () => showAllReleaseNotes()
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

async function showAllReleaseNotes() {
    try {
        const { showModal } = await import('./utils/modal.js');
        const isElectron = !!window.electronAPI;
        let mdFiles = [];
        let otherFiles = [];
        let appPath = '';

        if (isElectron) {
            appPath = await window.electronAPI.getAppPath();
            mdFiles = await window.electronAPI.readDir(`${appPath}/Update/.md`).catch(() => []);
            otherFiles = await window.electronAPI.readDir(`${appPath}/Update/Other`).catch(() => []);
        } else {
            // Fallback for browser: hardcoded list of major versions
            mdFiles = ['PATCH_NOTES_v1.0.3.md', 'PATCH_NOTES_v1.0.4.md'];
            otherFiles = ['WHATS_NEW_v1.0.3.md', 'WHATS_NEW_v1.0.4.md', 'v1.0.1.md', 'v1.0.2.md'];
        }

        const allFiles = [
            ...mdFiles.map(f => ({ name: f, path: `Update/.md/${f}`, group: 'Patch Notes' })),
            ...otherFiles.map(f => ({ name: f, path: `Update/Other/${f}`, group: 'What\'s New / Other' }))
        ].filter(f => f.name.endsWith('.md'));

        if (allFiles.length === 0) {
            const { showToast } = await import('./components/toast.js');
            showToast('No release notes found in Update folder', 'info');
            return;
        }

        const renderFileList = () => {
            return `
                <div class="release-notes-list" style="max-height: 400px; overflow-y: auto; padding: 10px;">
                    <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">Select a file to view its content:</p>
                    ${['Patch Notes', 'What\'s New / Other'].map(group => {
                const groupFiles = allFiles.filter(f => f.group === group);
                if (groupFiles.length === 0) return '';
                return `
                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-blue); margin-bottom: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px;">${group}</div>
                                <div style="display: grid; gap: 4px;">
                                    ${groupFiles.map(f => `
                                        <button class="btn btn-secondary btn-sm" style="text-align: left; justify-content: flex-start; padding: 8px 12px;" data-note-path="${f.path}">
                                            ${f.name}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        };

        const modal = showModal({
            title: '📜 Release Notes Archive',
            content: renderFileList(),
            buttons: [{ text: 'Close', primary: false }]
        });

        // Attach listeners after a short delay for modal to render
        setTimeout(() => {
            document.querySelectorAll('[data-note-path]').forEach(btn => {
                btn.onclick = async () => {
                    const path = btn.dataset.notePath;
                    try {
                        let content = '';
                        if (isElectron) {
                            content = await window.electronAPI.readTextFile(`${appPath}/${path}`);
                        } else {
                            const resp = await fetch(`./${path}`);
                            content = await resp.text();
                        }

                        showModal({
                            title: `📄 ${path.split('/').pop()}`,
                            content: `<div class="release-notes">${parseMarkdown(content)}</div>`,
                            buttons: [
                                { text: 'Back to List', onClick: () => showAllReleaseNotes() },
                                { text: 'Close', primary: true }
                            ]
                        });
                    } catch (e) {
                        const { showToast } = await import('./components/toast.js');
                        showToast('Failed to read file', 'error');
                    }
                };
            });
        }, 100);

    } catch (e) {
        console.error('Error showing release notes archive:', e);
    }
}

// Initialize app
async function init() {
    // Start Loader Image swapping
    let spinImg = document.getElementById('loader-img-spin');
    let useYeux = false;
    const spinInterval = setInterval(() => {
        if (spinImg) {
            useYeux = !useYeux;
            spinImg.src = useYeux ? '/Tasky_yeux1.webp' : '/Tasky.webp';
        }
    }, 400); // Swap every 400ms

    // Init i18n first
    const { initI18n, t } = await import('./utils/i18n.js');
    await initI18n();
    window.i18n_t = t;

    const loaderText = document.getElementById('loader-text');
    if (loaderText) loaderText.textContent = t('common.loading') || 'Loading Better Sound.Maker...';

    // Render sidebar
    const sidebar = document.getElementById('sidebar');
    renderNav(sidebar);

    // Check for updates
    const { checkUpdate } = await import('./utils/update-check.js');
    if (window.APP_CONFIG?.DisableAutoUpdate !== 'true') {
        setTimeout(() => checkUpdate(true), 1500);
    }

    // Check release notes (after a short delay to let app settle)
    setTimeout(checkReleaseNotes, 1000);

    // Auto-scan library if enabled
    setTimeout(async () => {
        const state = getState();
        if (state.globalSettings?.autoScan && state.globalSettings.dcsPath && window.electronAPI) {
            try {
                // Determine sdef path
                let dcsPath = state.globalSettings.dcsPath.replace(/\\/g, '/');
                if (dcsPath.endsWith('/')) dcsPath = dcsPath.slice(0, -1);
                const sdefPath = `${dcsPath}/Doc/Sounds/sdef_and_wave_list.txt`;

                const text = await window.electronAPI.readTextFile(sdefPath);
                if (text) {
                    const { parseSdefList } = await import('./data/sdef-parser.js');
                    const { setLibraryData, saveLibraryToStorage } = await import('./state/store.js');
                    const data = parseSdefList(text);

                    // If keep mods is enabled, merge existing "Mod:" sections
                    if (state.globalSettings?.autoScanKeepMods) {
                        const existingData = state.libraryData;
                        if (existingData && existingData.sections) {
                            const modSections = existingData.sections.filter(s => s.name.startsWith('Mod:'));
                            data.sections.push(...modSections);
                        }
                    }

                    setLibraryData(data);
                    await saveLibraryToStorage(data);

                    const { showToast } = await import('./components/toast.js');
                    showToast('Assets Library auto-synced with DCS directory.', 'success');

                    if (getState().currentPage === 'library') {
                        renderCurrentPage();
                    }
                }
            } catch (e) {
                console.warn('Auto-scan failed:', e);
            }
        }
    }, 2000);

    // Init onboarding
    const { initOnboarding } = await import('./pages/onboarding.js');
    initOnboarding();

    // Expose utility globally
    window.showAllReleaseNotes = showAllReleaseNotes;

    // Listen for page changes
    subscribe('currentPage', renderCurrentPage);

    // Listen for global language change event
    window.addEventListener('languageChanged', () => {
        renderCurrentPage();
        renderNav(document.getElementById('sidebar'));
    });

    // Initial render
    await renderCurrentPage();

    // Loader Finish Sequence
    clearInterval(spinInterval);
    if (spinImg) spinImg.style.display = 'none';
    const happyImg = document.getElementById('loader-img-happy');
    if (happyImg) happyImg.style.opacity = '1';
    if (loaderText) {
        loaderText.textContent = t('common.ready') || 'Ready!';
        loaderText.style.animation = 'none';
        loaderText.style.opacity = '1';
    }

    // Hide loader after a moment of happiness
    setTimeout(() => {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500); // remove after fade
        }
    }, 1200);

    // Initialise Debug Panel
    initDebugPanel();
}

function initDebugPanel() {
    // Parse Load.cfg
    const cfg = {};
    rawCfg.split('\n').forEach(line => {
        if (line.includes('=')) {
            const [k, v] = line.split('=');
            cfg[k.trim()] = v.trim();
        }
    });

    window.APP_CONFIG = cfg;

    if (cfg['ProdMode'] === 'false') {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.bottom = '10px';
        panel.style.right = '10px';
        panel.style.background = 'rgba(0,0,0,0.85)';
        panel.style.border = '1px solid var(--accent-orange)';
        panel.style.padding = '10px';
        panel.style.borderRadius = '8px';
        panel.style.zIndex = '999999';
        panel.style.color = '#fff';
        panel.style.fontSize = '12px';
        panel.style.fontFamily = 'monospace';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '8px';

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="color: var(--accent-orange); font-weight: bold; font-size: 14px;">🛠 DEV PANEL</div>
                <button id="dev-close" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">&times;</button>
            </div>
            
            <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">PAGES / NAVIGATION</div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" id="dev-load-tuto">Start Onboard</button>
            </div>
            
            <div style="font-size: 10px; color: #aaa; margin-top: 6px; margin-bottom: 4px;">I18N LANGUAGE</div>
            <div style="display: flex; gap: 4px;">
                <button class="btn btn-secondary btn-sm" style="flex: 1;" id="dev-lang-en">🇺🇸 EN</button>
                <button class="btn btn-secondary btn-sm" style="flex: 1;" id="dev-lang-fr">🇫🇷 FR</button>
            </div>
            
            <div style="font-size: 10px; color: #aaa; margin-top: 6px; margin-bottom: 4px;">SYSTEM ACTIONS</div>
            <button class="btn btn-secondary btn-sm" id="dev-log-state">Log State to Console</button>
            <div style="display: flex; gap: 4px;">
                <button class="btn btn-warning btn-sm" style="flex: 1;" id="dev-clear-storage">Clear Storage</button>
                <button class="btn btn-danger btn-sm" style="flex: 1;" id="dev-reload-app">Reload App</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('dev-close').addEventListener('click', () => {
            panel.style.display = 'none';
            const btn = document.createElement('button');
            btn.innerHTML = '🛠️';
            btn.style.position = 'fixed';
            btn.style.bottom = '10px';
            btn.style.right = '10px';
            btn.style.zIndex = '999999';
            btn.style.fontSize = '20px';
            btn.style.background = 'rgba(0,0,0,0.7)';
            btn.style.border = '1px solid var(--accent-orange)';
            btn.style.borderRadius = '50%';
            btn.style.width = '42px';
            btn.style.height = '42px';
            btn.style.cursor = 'pointer';
            document.body.appendChild(btn);
            btn.onclick = () => {
                panel.style.display = 'flex';
                btn.remove();
            };
        });
        document.getElementById('dev-load-tuto').addEventListener('click', async () => {
            const { startOnboarding } = await import('./pages/onboarding.js');
            startOnboarding();
        });
        document.getElementById('dev-lang-en').addEventListener('click', async () => {
            const { changeLanguage } = await import('./utils/i18n.js');
            await changeLanguage('en', true);
        });
        document.getElementById('dev-lang-fr').addEventListener('click', async () => {
            const { changeLanguage } = await import('./utils/i18n.js');
            await changeLanguage('fr', true);
        });
        document.getElementById('dev-log-state').addEventListener('click', async () => {
            const { getState } = await import('./state/store.js');
            console.log('--- GLOBAL STATE DUMP ---');
            console.log(getState());
            alert('State logged to console. Check Developer Tools (F12)');
        });
        document.getElementById('dev-clear-storage').addEventListener('click', () => {
            if (confirm("Are you sure? This will wipe all user data!")) {
                localStorage.clear();
                alert('Local storage cleared. Reloading in 1s...');
                setTimeout(() => location.reload(), 1000);
            }
        });
        document.getElementById('dev-reload-app').addEventListener('click', () => {
            location.reload();
        });
    }
}

async function renderCurrentPage() {
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

    const loaderSub = document.getElementById('loader-subtext');
    if (loaderSub && page === 'library') {
        import('./utils/i18n.js').then(({ t }) => {
            loaderSub.textContent = t('nav.library') ? `Loading ${t('nav.library')}...` : "Loading Assets Library...";
        });
    }

    // Render page
    const renderer = pages[page];
    if (renderer) {
        await renderer(container);
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
    // Re-render nav to update sidebar translations
    import('./components/nav.js').then(({ renderNav }) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) renderNav(sidebar);
    });
});
