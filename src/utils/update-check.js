/**
 * src/utils/update-check.js — Universal update checker
 */

import { showModal } from './modal.js';
import { showToast } from '../components/toast.js';
import { APP_VERSION, GITHUB_REPO } from './version.js';
import { t } from './i18n.js';

/**
 * Desktop update chain:
 *   1. BetterInstaller   — when this copy was installed by BetterInstaller (signed .bpkg, rollback)
 *   2. Tauri updater     — NSIS/MSI installs, or when BetterInstaller could not answer
 *   3. GitHub version check → releases page
 */

/**
 * Returns true when BetterInstaller answered (update offered or none available),
 * false when this is not a BetterInstaller install or its check failed.
 */
async function checkBetterInstallerUpdate(quiet) {
    let report;
    try {
        report = await window.nativeAPI.biCheckUpdate();
    } catch (e) {
        console.warn('BetterInstaller check failed:', e);
        return false;
    }
    if (!report) return false;
    if (report.error) {
        console.warn('BetterInstaller check failed, falling back to the Tauri updater:', report.error);
        return false;
    }
    if (!report.update_available) {
        if (!quiet) showToast(t('update.upToDate'), 'success');
        return true;
    }
    showModal({
        title: t('update.title'), icon: 'download-cloud', tone: 'success',
        content: `
            <div style="text-align:center; padding: 10px 0;">
                <p>${t('update.ready')}</p>
                <div style="font-size: 24px; font-weight: 800; margin: 15px 0;">
                    ${escapeText(report.current_version || APP_VERSION)} → <span style="color:var(--accent-green)">${escapeText(report.latest_version)}</span>
                </div>
                ${report.notes ? `<p style="font-size: 13px; white-space: pre-line;">${escapeText(report.notes)}</p>` : ''}
                <p style="color:var(--text-muted); font-size: 13px;">${t('update.biRestart')}</p>
            </div>
        `,
        buttons: [
            {
                text: t('update.now'),
                primary: true,
                onClick: async () => {
                    try {
                        await window.nativeAPI.biApplyUpdate();
                    } catch (e) {
                        console.warn('BetterInstaller update failed to start:', e);
                        showToast(t('update.biFailed'), 'error');
                        if (!(await checkNativeUpdate(false))) {
                            window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
                        }
                    }
                }
            },
            { text: t('update.later'), primary: false }
        ]
    });
    return true;
}

/**
 * Signed in-place update through the Tauri updater (NSIS/MSI).
 * Returns true when the updater answered (update installed or none available),
 * false when it could not be reached so the caller falls back to the GitHub check.
 */
async function checkNativeUpdate(quiet) {
    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (!update) {
            if (!quiet) showToast(t('update.upToDate'), 'success');
            return true;
        }
        showModal({
            title: t('update.title'), icon: 'download-cloud', tone: 'success',
            content: `
                <div style="text-align:center; padding: 10px 0;">
                    <p>${t('update.ready')}</p>
                    <div style="font-size: 24px; font-weight: 800; margin: 15px 0;">
                        ${APP_VERSION} → <span style="color:var(--accent-green)">${escapeText(update.version)}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size: 13px;">${t('update.nativeRestart')}</p>
                </div>
            `,
            buttons: [
                {
                    text: t('update.now'),
                    primary: true,
                    onClick: async () => {
                        try {
                            showToast(t('update.downloading'), 'info');
                            await update.downloadAndInstall();
                            const { relaunch } = await import('@tauri-apps/plugin-process');
                            await relaunch();
                        } catch (e) {
                            console.warn('Update install failed:', e);
                            showToast(t('update.failed'), 'error');
                            window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
                        }
                    }
                },
                { text: t('update.later'), primary: false }
            ]
        });
        return true;
    } catch (e) {
        console.warn('Native updater unavailable, falling back to GitHub check:', e);
        return false;
    }
}

function escapeText(s) {
    return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function checkUpdate(quiet = true) {
    if (window.nativeAPI) {
        if (!quiet) showToast(t('update.checking'), 'info');
        if (await checkBetterInstallerUpdate(quiet)) return;
        if (await checkNativeUpdate(quiet)) return;
    }

    try {
        if (!quiet) showToast(t('update.checking'), 'info');

        let resp;
        // Try various URL formats and branches
        const urls = [
            `https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`,
            `https://raw.githubusercontent.com/${GITHUB_REPO}/master/package.json`,
            `https://api.github.com/repos/${GITHUB_REPO}/contents/package.json` // API fallback
        ];

        for (const url of urls) {
            try {
                const isApi = url.includes('api.github.com');
                const fetchOpts = isApi ? {} : { cache: 'no-store' };

                resp = await fetch(url, fetchOpts);
                if (resp.ok) {
                    let remoteVersion;
                    if (isApi) {
                        const apiData = await resp.json();
                        const content = atob(apiData.content.replace(/\n/g, ''));
                        remoteVersion = JSON.parse(content).version;
                    } else {
                        const data = await resp.json();
                        remoteVersion = data.version;
                    }

                    if (remoteVersion) {
                        handleUpdate(remoteVersion, quiet);
                        return;
                    }
                }
            } catch (e) {
                console.warn(`Update check failed for ${url}:`, e);
            }
        }

        if (!quiet) showToast(t('update.unreachable'), 'error');
    } catch (err) {
        console.warn('Update check failed:', err);
        if (!quiet) showToast(t('update.checkFailed'), 'error');
    }
}

function handleUpdate(remoteVersion, quiet) {
    if (remoteVersion !== APP_VERSION) {
        showModal({
            title: t('update.title'), icon: 'download-cloud', tone: 'success',
            content: `
                <div style="text-align:center; padding: 10px 0;">
                    <p>${t('update.ready')}</p>
                    <div style="font-size: 24px; font-weight: 800; margin: 15px 0;">
                        ${APP_VERSION} → <span style="color:var(--accent-green)">${escapeText(remoteVersion)}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size: 13px;">
                        ${window.nativeAPI ? t('update.manualDesktop') : t('update.manualWeb')}
                    </p>
                </div>
            `,
            buttons: [
                {
                    text: t('update.now'),
                    primary: true,
                    onClick: () => {
                        window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
                        if (!window.nativeAPI) location.reload();
                    }
                },
                { text: t('update.later'), primary: false }
            ]
        });
    } else {
        if (!quiet) showToast(t('update.upToDate'), 'success');
    }
}
