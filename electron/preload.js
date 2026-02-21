/**
 * electron/preload.js — Context bridge for Better Sound.Maker
 * Exposes safe Electron APIs to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Open a native folder picker and return the chosen path.
     * @returns {Promise<string|null>}
     */
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

    /**
     * Write a text file at the given absolute path.
     * @param {string} filePath
     * @param {string} content
     * @returns {Promise<boolean>}
     */
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),

    /**
     * Write a binary ArrayBuffer to the given path.
     * @param {string} filePath
     * @param {ArrayBuffer} arrayBuffer
     * @returns {Promise<boolean>}
     */
    writeBuffer: (filePath, arrayBuffer) => ipcRenderer.invoke('fs:writeBuffer', filePath, arrayBuffer),

    /**
     * Create a directory (and all parents) at the given path.
     * @param {string} dirPath
     * @returns {Promise<boolean>}
     */
    mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),

    /**
     * Read a file as buffer from the given absolute path.
     * @param {string} filePath
     * @returns {Promise<ArrayBuffer|null>}
     */
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),

    /**
     * Read a file as UTF-8 text.
     */
    readTextFile: (filePath) => ipcRenderer.invoke('fs:readTextFile', filePath),

    /**
     * Get app root path
     */
    getAppPath: () => ipcRenderer.invoke('app:getPath'),

    /**
     * Trigger the native autoUpdater to check for updates.
     */
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),

    /**
     * Read directory contents.
     */
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),

    /**
     * Open a file or folder in OS default handler.
     */
    openExternal: (targetPath) => ipcRenderer.invoke('app:openExternal', targetPath),
});
