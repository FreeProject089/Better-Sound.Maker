/**
 * src/platform/native.js — Desktop bridge (Tauri v2)
 *
 * Exposes `window.nativeAPI` with the same surface the former Electron
 * preload offered. In the browser build it stays undefined, so every
 * `if (window.nativeAPI)` guard keeps working unchanged.
 *
 * Must be the first import of src/main.js: some modules read
 * `window.nativeAPI` at import time.
 */

import { invoke } from '@tauri-apps/api/core';
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

if (isTauri) {
    const api = {
        selectDirectory: () => invoke('select_directory'),
        writeFile: (path, content) => invoke('write_file', { path, content }),
        // Raw binary body; path travels in a header to skip JSON encoding of audio.
        writeBuffer: (path, arrayBuffer) =>
            invoke('write_buffer', new Uint8Array(arrayBuffer), {
                headers: { 'x-path': encodeURIComponent(path) },
            }),
        mkdir: (path) => invoke('mkdir', { path }),
        readFile: (path) => invoke('read_file', { path }).catch(() => null),
        readTextFile: (path) => invoke('read_text_file', { path }),
        readDir: (path) => invoke('read_dir', { path }),
        exists: (path) => invoke('exists', { path }),
        scanSdefs: (root) => invoke('scan_sdefs', { root }),
        getAppPath: () => invoke('get_app_path'),
        getUserHome: () => invoke('get_user_home'),
        openExternal: (path) => invoke('open_path', { path }),
        /** @param {Float32Array} planar channel after channel */
        encodeOgg: (planar, channels, rate, quality = 0.5) =>
            invoke('encode_ogg', new Uint8Array(planar.buffer, planar.byteOffset, planar.byteLength), {
                headers: { 'x-channels': String(channels), 'x-rate': String(rate), 'x-quality': String(quality) },
            }),
        findDcsWave: (dcsPath, wave) => invoke('find_dcs_wave', { dcsPath, wave }),
        detectDcsInstalls: () => invoke('detect_dcs_installs'),
        appInfo: () => invoke('app_info'),
        writeCrashLog: (content) => invoke('write_crash_log', { content }),
        readPanicLogs: () => invoke('read_panic_logs'),
        openLogsDir: () => invoke('open_logs_dir'),
        biCheckUpdate: () => invoke('bi_check_update'),
        biApplyUpdate: () => invoke('bi_apply_update'),
        openUrl: (url) => tauriOpenUrl(url),
    };
    api.pickFolder = api.selectDirectory;

    window.nativeAPI = Object.freeze(api);

    // The webview cannot open new windows: route external links to the system browser.
    document.addEventListener('click', (e) => {
        const a = e.target.closest?.('a[href]');
        if (!a || !/^https?:/i.test(a.href) || a.origin === location.origin) return;
        e.preventDefault();
        tauriOpenUrl(a.href);
    });
    window.open = (url) => {
        if (url) tauriOpenUrl(String(url));
        return null;
    };
}

/** Open a URL in the system browser (desktop) or a new tab (web). */
export function openUrl(url) {
    if (window.nativeAPI) return window.nativeAPI.openUrl(url);
    window.open(url, '_blank');
}
