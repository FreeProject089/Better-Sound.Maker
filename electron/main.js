/**
 * electron/main.js — Better Sound.Maker Electron main process
 */

const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const { autoUpdater } = require('electron-updater');

function checkUpdate(quiet = true) {
    return new Promise((resolve) => {
        if (isDev) {
            console.log('Skipping auto-updater in development mode.');
            if (!quiet) {
                dialog.showMessageBox({ type: 'info', message: 'Auto-updater is disabled in development mode.' });
            }
            return resolve();
        }

        try {
            autoUpdater.autoDownload = true;
            autoUpdater.autoInstallOnAppQuit = true;

            // Remove previous listeners to prevent duplicates if called multiple times manually
            autoUpdater.removeAllListeners('update-downloaded');
            autoUpdater.removeAllListeners('error');
            autoUpdater.removeAllListeners('update-not-available');
            autoUpdater.removeAllListeners('update-available');

            autoUpdater.once('update-downloaded', (info) => {
                const choice = dialog.showMessageBoxSync({
                    type: 'info',
                    buttons: ['Restart to Update', 'Later'],
                    title: 'Update Downloaded',
                    message: `A new version (${info.version}) has been downloaded!`,
                    detail: `The update will be applied automatically when you quit the application, or you can restart now.`,
                    defaultId: 0,
                    cancelId: 1
                });

                if (choice === 0) {
                    autoUpdater.quitAndInstall();
                }
                resolve();
            });

            autoUpdater.once('error', (err) => {
                console.error('AutoUpdater Error:', err);
                if (!quiet) {
                    dialog.showErrorBox('Update Error', err == null ? 'unknown' : (err.stack || err).toString());
                }
                resolve();
            });

            autoUpdater.once('update-not-available', () => {
                if (!quiet) {
                    dialog.showMessageBoxSync({ type: 'info', title: 'Up to Date', message: 'You are already running the latest version.' });
                }
                resolve();
            });

            autoUpdater.once('update-available', () => {
                if (!quiet) {
                    dialog.showMessageBoxSync({ type: 'info', title: 'Update Available', message: 'A new version is available. Downloading in the background...' });
                }
                // No resolve here, wait for download or error
            });

            autoUpdater.checkForUpdates().catch((err) => {
                console.error('Check for updates failed:', err);
                if (!quiet) {
                    dialog.showErrorBox('Update Error', err == null ? 'unknown' : (err.stack || err).toString());
                }
                resolve();
            });

        } catch (err) {
            console.error('Update check setup failed:', err);
            resolve();
        }
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        title: 'Better Sound.Maker',
        icon: isDev
            ? path.join(__dirname, '../public/Bm.png')
            : path.join(__dirname, '../dist/Bm.png'),
        backgroundColor: '#0d1117',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // In dev: load Vite dev server; in prod: load built HTML
    if (isDev) {
        let retries = 0;
        const tryLoad = async (port) => {
            try {
                await win.loadURL(`http://localhost:${port}`);
            } catch (err) {
                if (port === 5173) {
                    console.log('Port 5173 failed, trying 5174...');
                    tryLoad(5174);
                } else {
                    retries++;
                    if (retries > 5) {
                        console.log('Could not connect to Vite dev server after multiple retries. Falling back to dist/index.html...');
                        win.loadFile(path.join(__dirname, '../dist/index.html'));
                        return;
                    }
                    console.log(`Port ${port} failed, retrying in 1s...`);
                    setTimeout(() => tryLoad(5173), 1000);
                }
            }
        };
        tryLoad(5173);
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    createWindow();

    // Check for updates on launch (slight delay)
    setTimeout(() => checkUpdate(true), 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Removed custom before-quit handler as electron-updater handles autoInstallOnAppQuit internally.

/* ── IPC handlers ─────────────────────────────────────────────────── */

// Open native folder picker, returns selected path or null
ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Choose Export Location',
        properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

// Write text file (creates intermediate dirs)
ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
});

// Write binary buffer
ipcMain.handle('fs:writeBuffer', async (_event, filePath, arrayBuffer) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const buf = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buf);
    return true;
});

// Create directory (recursive)
ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
});

// Read file (buffer)
ipcMain.handle('fs:readFile', async (_event, filePath) => {
    try {
        return fs.readFileSync(filePath);
    } catch (e) {
        if (e.code !== 'ENOENT') console.error('Failed to read file:', filePath, e);
        return null;
    }
});

// Read file as text
ipcMain.handle('fs:readTextFile', async (_event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        if (e.code !== 'ENOENT') console.error('Failed to read text file:', filePath, e);
        return null;
    }
});

// Read directory contents
ipcMain.handle('fs:readDir', async (_event, dirPath) => {
    try {
        return fs.readdirSync(dirPath);
    } catch (e) {
        return [];
    }
});

// Check if path exists
ipcMain.handle('fs:exists', async (_event, checkPath) => {
    return fs.existsSync(checkPath);
});

// Scan directory recursively for .sdef files and quick parse
ipcMain.handle('fs:scanSdefs', async (_event, rootPath) => {
    const results = [];
    try {
        const walk = (dir) => {
            if (!fs.existsSync(dir)) return;
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    walk(fullPath);
                } else if (item.name.toLowerCase().endsWith('.sdef')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const waves = [];
                        const lines = content.split(/\r?\n/);
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('wave') && trimmed.includes('"')) {
                                const match = trimmed.match(/"([^"]+)"/);
                                if (match) {
                                    let wPath = match[1].replace(/\\\\/g, '/');
                                    // Strip leading slash if any
                                    if (wPath.startsWith('/')) wPath = wPath.slice(1);
                                    waves.push(wPath);
                                }
                            }
                        }
                        // Make paths relative to the rootPath provided, uniformly using forward slashes
                        const relPath = path.relative(rootPath, fullPath).replace(/\\\\/g, '/');
                        results.push({
                            relPath,
                            content: content,
                            waves
                        });
                    } catch (e) {
                        // ignore unreadable files
                    }
                }
            }
        };
        walk(rootPath);
    } catch (e) {
        console.error('fs:scanSdefs error:', e);
    }
    return results;
});

// Get app root path
ipcMain.handle('app:getPath', () => app.getAppPath());

// Get user home path
ipcMain.handle('app:getUserHome', () => app.getPath('home'));

// Check for updates manually
ipcMain.handle('app:checkForUpdates', async () => {
    return checkUpdate(false);
});

// Open external path
ipcMain.handle('app:openExternal', async (_event, targetPath) => {
    return shell.openPath(targetPath);
});
