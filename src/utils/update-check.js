/**
 * src/utils/update-check.js — Universal update checker
 */

import { showModal } from './modal.js';
import { showToast } from '../components/toast.js';
import { APP_VERSION, GITHUB_REPO } from './version.js';

/**
 * Desktop: signed in-place update through the Tauri updater (NSIS/MSI).
 * Returns true when the updater answered (update installed or none available),
 * false when it could not be reached so the caller falls back to the GitHub check.
 */
async function checkNativeUpdate(quiet) {
    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (!update) {
            if (!quiet) showToast('You are running the latest version!', 'success');
            return true;
        }
        showModal({
            title: '🚀 Update Available!',
            content: `
                <div style="text-align:center; padding: 10px 0;">
                    <p>A new version of <strong>Better Sound.Maker</strong> is ready!</p>
                    <div style="font-size: 24px; font-weight: 800; margin: 15px 0;">
                        ${APP_VERSION} → <span style="color:var(--accent-green)">${escapeText(update.version)}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size: 13px;">The app will restart once the update is installed.</p>
                </div>
            `,
            buttons: [
                {
                    text: 'Update Now',
                    primary: true,
                    onClick: async () => {
                        try {
                            showToast('Downloading update...', 'info');
                            await update.downloadAndInstall();
                            const { relaunch } = await import('@tauri-apps/plugin-process');
                            await relaunch();
                        } catch (e) {
                            console.warn('Update install failed:', e);
                            showToast('Update failed, opening the releases page.', 'error');
                            window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
                        }
                    }
                },
                { text: 'Later', primary: false }
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
        if (!quiet) showToast('Checking for updates...', 'info');
        if (await checkNativeUpdate(quiet)) return;
    }

    try {
        if (!quiet) showToast('Checking for updates...', 'info');

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

        if (!quiet) showToast('Could not reach update server. The repo might be private or renamed.', 'error');
    } catch (err) {
        console.warn('Update check failed:', err);
        if (!quiet) showToast('Update check failed', 'error');
    }
}

function handleUpdate(remoteVersion, quiet) {
    if (remoteVersion !== APP_VERSION) {
        showModal({
            title: '🚀 Update Available!',
            content: `
                <div style="text-align:center; padding: 10px 0;">
                    <p>A new version of <strong>Better Sound.Maker</strong> is ready!</p>
                    <div style="font-size: 24px; font-weight: 800; margin: 15px 0;">
                        ${APP_VERSION} → <span style="color:var(--accent-green)">${escapeText(remoteVersion)}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size: 13px;">
                        ${window.nativeAPI ? 'Download the new installer from the releases page.' : 'The online version will refresh with new features.'}
                    </p>
                </div>
            `,
            buttons: [
                {
                    text: 'Update Now',
                    primary: true,
                    onClick: () => {
                        window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
                        if (!window.nativeAPI) location.reload();
                    }
                },
                { text: 'Later', primary: false }
            ]
        });
    } else {
        if (!quiet) showToast('You are running the latest version!', 'success');
    }
}
