/**
 * electron/main.js — Better Sound.Maker Electron main process
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
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
