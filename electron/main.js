/**
 * electron/main.js — Better Sound.Maker Electron main process
 */

const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function checkUpdate(quiet = true) {
    const GITHUB_REPO = 'FreeProject089/Better-ModMaker';
    const GITHUB_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/package.json`;

    try {
        const request = net.request(GITHUB_URL);
        request.on('response', (response) => {
            let body = '';
            response.on('data', (chunk) => body += chunk);
            response.on('end', () => {
                try {
                    if (response.statusCode !== 200) return;
                    const data = JSON.parse(body);
                    const currentVersion = app.getVersion();

                    // Simple version comparison
                    if (data.version !== currentVersion) {
                        const choice = dialog.showMessageBoxSync({
                            type: 'info',
                            buttons: ['Update Now', 'Later'],
                            title: 'Update Available',
                            message: `A new version (${data.version}) of Better Sound.Maker is available!`,
                            detail: `Current: ${currentVersion} → New: ${data.version}\n\nWould you like to visit the release page to download it?`,
                            defaultId: 0,
                            cancelId: 1
                        });
                        if (choice === 0) {
                            shell.openExternal(`https://github.com/${GITHUB_REPO}/releases`);
                        }
                    }
                } catch (e) {
                    console.error('Update check parse error:', e);
                }
            });
        });
        request.on('error', (err) => console.error('Update check request error:', err));
        request.end();
    } catch (err) {
        console.error('Update check failed:', err);
    }
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

let isQuitting = false;
app.on('before-quit', (event) => {
    if (!isQuitting) {
        // Only check if not already quitting
        event.preventDefault();
        isQuitting = true;

        // Perform a quick check on closure
        // We use a timeout to ensure app quits even if network is slow
        const quitTimeout = setTimeout(() => {
            app.quit();
        }, 3000);

        checkUpdate(true).finally(() => {
            clearTimeout(quitTimeout);
            app.quit();
        });
    }
});

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
