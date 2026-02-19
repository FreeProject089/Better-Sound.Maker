/**
 * src/utils/update-check.js — Universal update checker
 */

import { showModal } from './modal.js';
import { showToast } from '../components/toast.js';
import { APP_VERSION, GITHUB_REPO } from './version.js';

export async function checkUpdate(quiet = true) {
    if (window.electronAPI && window.electronAPI.checkForUpdates) {
        // In the Electron app, `electron-updater` handles the process natively in the background.
        if (!quiet) {
            showToast('Checking for updates...', 'info');
            await window.electronAPI.checkForUpdates();
        }
        return;
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
                        ${APP_VERSION} → <span style="color:var(--accent-green)">${remoteVersion}</span>
                    </div>
                    <p style="color:var(--text-muted); font-size: 13px;">
                        ${window.electronAPI ? 'Update your local installation.' : 'The online version will refresh with new features.'}
                    </p>
                </div>
            `,
            buttons: [
                {
                    text: 'Update Now',
                    primary: true,
                    onClick: async () => {
                        if (window.electronAPI) {
                            try {
                                const appPath = await window.electronAPI.getAppPath();
                                const pkgPath = `${appPath}/package.json`;
                                const pkgContentStr = await window.electronAPI.readTextFile(pkgPath);
                                if (pkgContentStr) {
                                    const pkg = JSON.parse(pkgContentStr);
                                    pkg.version = remoteVersion;
                                    await window.electronAPI.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
                                    showToast('package.json updated! Restart the app.', 'success');
                                }
                            } catch (e) {
                                window.open(`https://github.com/${GITHUB_REPO}/releases`, '_blank');
                            }
                        } else {
                            window.open(`https://github.com/${GITHUB_REPO}/releases`, '_blank');
                            location.reload();
                        }
                    }
                },
                { text: 'Later', primary: false }
            ]
        });
    } else {
        if (!quiet) showToast('You are running the latest version!', 'success');
    }
}
