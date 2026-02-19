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
            return resolve();
        }

        try {
            autoUpdater.autoDownload = true;
            autoUpdater.autoInstallOnAppQuit = true;

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
                resolve();
            });

            autoUpdater.once('update-not-available', () => {
                resolve();
            });

            autoUpdater.checkForUpdates().catch((err) => {
                console.error('Check for updates failed:', err);
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
        win.loadURL('http://localhost:5173');
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
        console.error('Failed to read file:', filePath, e);
        return null;
    }
});

// Read file as text
ipcMain.handle('fs:readTextFile', async (_event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        console.error('Failed to read text file:', filePath, e);
        return null;
    }
});

// Get app root path
ipcMain.handle('app:getPath', () => app.getAppPath());
