/**
 * mod-builder.js — Build the complete mod folder structure
 *
 * Priority order:
 *   1. Electron  → window.electronAPI (native IPC, no origin restrictions)
 *   2. Chrome    → showDirectoryPicker (write directly to disk)
 *   3. Firefox   → JSZip fallback (download .zip)
 *
 * Output structure:
 *
 * ModName/
 * ├── entry.lua
 * ├── Sounds/
 * │   ├── sdef/
 * │   │   └── Aircrafts/FA-18/...   (.sdef files)
 * │   └── Effects/
 * │       └── Aircrafts/FA-18/...   (.wav/.ogg files)
 * └── Theme/
 *     ├── icon.png
 *     └── ME/
 */

import JSZip from 'jszip';
import { getState, getAudioFile, getThemeFile } from '../state/store.js';
import { generateEntryLua } from './entry-generator.js';
import { generateSdef } from './sdef-generator.js';
import { detectSoundType, getTypeDefaults } from './audio-analyzer.js';

const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
const supportsDirectoryPicker = !isElectron && typeof window.showDirectoryPicker === 'function';

/**
 * Build and export the mod.
 * @param {Function} onProgress - (ratio, message) callback
 * @param {Object}   options    - { audioFormat: 'original'|'wav'|'ogg' }
 */
export async function buildMod(onProgress, options = {}) {
    const state = getState();
    const config = state.projectConfig;
    const selected = state.selectedAssets;
    const audioFormat = options.audioFormat || 'original';

    const modFolderName = config.modName
        ? config.modName.replace(/\s+/g, '')
        : 'SoundMod';

    const totalSteps = Object.keys(selected).length + 5;
    let step = 0;
    const report = (msg) => { step++; onProgress?.(step / totalSteps, msg); };

    try {
        if (isElectron) {
            return await buildToFolderElectron(modFolderName, config, selected, audioFormat, report);
        } else if (supportsDirectoryPicker) {
            return await buildToFolder(modFolderName, config, selected, audioFormat, report);
        } else {
            return await buildToZip(modFolderName, config, selected, audioFormat, report);
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            return { success: false, error: 'Export cancelled by user' };
        }
        console.error('Build failed:', e);
        return { success: false, error: e.message };
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Strategy 0 — Electron: native IPC
   ═══════════════════════════════════════════════════════════════════ */

async function buildToFolderElectron(modFolderName, config, selected, audioFormat, report) {
    const basePath = await window.electronAPI.selectDirectory();
    if (!basePath) return { success: false, error: 'Export cancelled by user' };

    const modPath = `${basePath}/${modFolderName}`;
    await window.electronAPI.mkdir(modPath);

    report('Writing entry.lua…');
    await window.electronAPI.writeFile(`${modPath}/entry.lua`, generateEntryLua(config));

    report('Creating Sounds/ directories…');
    const soundsPath = `${modPath}/Sounds`;
    const sdefPath = `${soundsPath}/sdef`;
    const effectsPath = `${soundsPath}/Effects`;
    await window.electronAPI.mkdir(soundsPath);
    await window.electronAPI.mkdir(sdefPath);
    await window.electronAPI.mkdir(effectsPath);

    for (const [assetKey, assetData] of Object.entries(selected)) {
        report(`Processing: ${assetKey}`);
        await processSdefToFolderElectron(sdefPath, effectsPath, assetKey, assetData, audioFormat);
    }

    if (config.themeEnabled) {
        report('Creating Theme/ directory…');
        const themePath = `${modPath}/Theme`;
        const mePath = `${themePath}/ME`;
        await window.electronAPI.mkdir(themePath);
        await window.electronAPI.mkdir(mePath);
        await writeThemeToFolderElectron(themePath, mePath, report);
    }

    report('Build complete!');
    return { success: true, folderName: modFolderName };
}

async function processSdefToFolderElectron(sdefBasePath, effectsBasePath, assetKey, assetData, audioFormat) {
    // Write sdef file
    const sdefContent = getSdefContent(assetKey, assetData);
    if (sdefContent) {
        const sdefFilePath = `${sdefBasePath}/${assetKey}`;
        const sdefDir = sdefFilePath.substring(0, sdefFilePath.lastIndexOf('/'));
        await window.electronAPI.mkdir(sdefDir);
        await window.electronAPI.writeFile(sdefFilePath, sdefContent);
    }

    // Write audio files
    const waves = assetData.customWaves || assetData.originalAsset?.waves || [];
    const audioFile = getAudioFile(assetKey);

    if (!audioFile || waves.length === 0) return;

    const converted = await convertAudioIfNeeded(audioFile, audioFormat);
    const ext = getOutExt(audioFile.name, audioFormat);
    const arrayBuf = await converted.arrayBuffer();

    for (const wavePath of waves) {
        // wavePath may look like "Effects/Aircrafts/FA-18/..." or "Aircrafts/FA-18/..."
        const parts = wavePath.split('/');
        if (parts[0] === 'Effects') parts.shift();
        // Strip any existing extension and replace
        const withoutExt = parts.join('/').replace(/\.[^.]+$/, '');
        const finalPath = `${effectsBasePath}/${withoutExt}.${ext}`;
        const finalDir = finalPath.substring(0, finalPath.lastIndexOf('/'));
        await window.electronAPI.mkdir(finalDir);
        await window.electronAPI.writeBuffer(finalPath, arrayBuf);
    }
}

async function writeThemeToFolderElectron(themePath, mePath, report) {
    const slots = {
        'icon.png': themePath,
        'MainMenulogo.png': mePath,
        'loading-window.png': mePath,
        'briefing-map-default.png': mePath,
        'base-menu-window.png': mePath,
    };
    for (const [name, targetPath] of Object.entries(slots)) {
        const file = getThemeFile(name);
        if (file) {
            report(`Writing theme: ${name}`);
            const buf = await file.arrayBuffer();
            await window.electronAPI.writeBuffer(`${targetPath}/${name}`, buf);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Strategy 1 — Chrome/Edge: showDirectoryPicker
   ═══════════════════════════════════════════════════════════════════ */

async function buildToFolder(modFolderName, config, selected, audioFormat, report) {
    const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });

    report('Creating mod folder…');
    const modDir = await rootDir.getDirectoryHandle(modFolderName, { create: true });

    report('Writing entry.lua…');
    await writeTextFS(modDir, 'entry.lua', generateEntryLua(config));

    report('Creating Sounds/ directories…');
    const soundsDir = await modDir.getDirectoryHandle('Sounds', { create: true });
    const sdefRootDir = await soundsDir.getDirectoryHandle('sdef', { create: true });
    const effectsDir = await soundsDir.getDirectoryHandle('Effects', { create: true });

    for (const [assetKey, assetData] of Object.entries(selected)) {
        report(`Processing: ${assetKey}`);
        await processSdefToFolder(sdefRootDir, effectsDir, assetKey, assetData, audioFormat);
    }

    if (config.themeEnabled) {
        report('Creating Theme/ directory…');
        const themeDir = await modDir.getDirectoryHandle('Theme', { create: true });
        const meDir = await themeDir.getDirectoryHandle('ME', { create: true });
        await writeThemeToFolder(themeDir, meDir, report);
    }

    report('Build complete!');
    return { success: true, folderName: modFolderName };
}

async function processSdefToFolder(sdefRootDir, effectsDir, assetKey, assetData, audioFormat) {
    // Navigate/create the sdef directory tree
    const sdefParts = assetKey.split('/');
    const sdefFileName = sdefParts.pop();
    let sdefDir = sdefRootDir;
    for (const part of sdefParts) {
        sdefDir = await sdefDir.getDirectoryHandle(part, { create: true });
    }

    const sdefContent = getSdefContent(assetKey, assetData);
    if (sdefContent) {
        await writeTextFS(sdefDir, sdefFileName, sdefContent);
    }

    // Write audio file for each wave path
    const waves = assetData.customWaves || assetData.originalAsset?.waves || [];
    const audioFile = getAudioFile(assetKey);

    if (!audioFile || waves.length === 0) return;

    const converted = await convertAudioIfNeeded(audioFile, audioFormat);
    const ext = getOutExt(audioFile.name, audioFormat);
    const arrayBuf = await converted.arrayBuffer();
    const convertedBlob = new Blob([arrayBuf]);

    for (const wavePath of waves) {
        const parts = wavePath.split('/');
        if (parts[0] === 'Effects') parts.shift();

        // Last element is the filename (may have extension or not)
        const rawFileName = parts.pop();
        const baseName = rawFileName.replace(/\.[^.]+$/, '');

        let efDir = effectsDir;
        for (const part of parts) {
            efDir = await efDir.getDirectoryHandle(part, { create: true });
        }
        await writeBlobFS(efDir, `${baseName}.${ext}`, convertedBlob);
    }
}

async function writeThemeToFolder(themeDir, meDir, report) {
    const slots = {
        'icon.png': themeDir,
        'MainMenulogo.png': meDir,
        'loading-window.png': meDir,
        'briefing-map-default.png': meDir,
        'base-menu-window.png': meDir,
    };
    for (const [name, targetDir] of Object.entries(slots)) {
        const file = getThemeFile(name);
        if (file) {
            report(`Writing theme: ${name}`);
            await writeBlobFS(targetDir, name, file);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Strategy 2 — Firefox/Safari: JSZip → download .zip
   ═══════════════════════════════════════════════════════════════════ */

async function buildToZip(modFolderName, config, selected, audioFormat, report) {
    const zip = new JSZip();
    const root = zip.folder(modFolderName);

    report('Writing entry.lua…');
    root.file('entry.lua', generateEntryLua(config));

    report('Creating Sounds/ directories…');
    const soundsFolder = root.folder('Sounds');
    const sdefFolder = soundsFolder.folder('sdef');
    const effectsFolder = soundsFolder.folder('Effects');

    for (const [assetKey, assetData] of Object.entries(selected)) {
        report(`Processing: ${assetKey}`);
        await processSdefToZip(sdefFolder, effectsFolder, assetKey, assetData, audioFormat);
    }

    if (config.themeEnabled) {
        report('Creating Theme/ directory…');
        const themeFolder = root.folder('Theme');
        const meFolder = themeFolder.folder('ME');
        await writeThemeToZip(themeFolder, meFolder, report);
    }

    report('Generating ZIP…');
    const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
        report(`Compressing: ${Math.round(meta.percent)}%`);
    });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${modFolderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    report('Build complete — ZIP downloaded!');
    return { success: true, folderName: `${modFolderName}.zip` };
}

async function processSdefToZip(sdefFolder, effectsFolder, assetKey, assetData, audioFormat) {
    const sdefContent = getSdefContent(assetKey, assetData);
    if (sdefContent) {
        sdefFolder.file(assetKey, sdefContent);
    }

    const waves = assetData.customWaves || assetData.originalAsset?.waves || [];
    const audioFile = getAudioFile(assetKey);

    if (!audioFile || waves.length === 0) return;

    const converted = await convertAudioIfNeeded(audioFile, audioFormat);
    const ext = getOutExt(audioFile.name, audioFormat);
    const arrayBuf = await converted.arrayBuffer();

    for (const wavePath of waves) {
        const parts = wavePath.split('/');
        if (parts[0] === 'Effects') parts.shift();

        const rawFileName = parts.pop();
        const baseName = rawFileName.replace(/\.[^.]+$/, '');
        const fullPath = [...parts, `${baseName}.${ext}`].join('/');

        effectsFolder.file(fullPath, arrayBuf);
    }
}

async function writeThemeToZip(themeFolder, meFolder, report) {
    const slots = {
        'icon.png': themeFolder,
        'MainMenulogo.png': meFolder,
        'loading-window.png': meFolder,
        'briefing-map-default.png': meFolder,
        'base-menu-window.png': meFolder,
    };
    for (const [name, targetFolder] of Object.entries(slots)) {
        const file = getThemeFile(name);
        if (file) {
            report(`Writing theme: ${name}`);
            const buf = await file.arrayBuffer();
            targetFolder.file(name, buf);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════════ */

function getSdefContent(assetKey, assetData) {
    let content = assetData.sdefContent;
    if (!content && assetData.customWaves?.length) {
        const soundType = detectSoundType(assetKey);
        const typeDefaults = getTypeDefaults(soundType);
        content = generateSdef({
            wave: assetData.customWaves,
            ...typeDefaults,
        });
    }
    return content;
}

function getOutExt(originalName, fmt) {
    if (fmt === 'original') return originalName.split('.').pop() || 'wav';
    return fmt;
}

async function convertAudioIfNeeded(file, targetFormat) {
    if (targetFormat === 'original') return file;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === targetFormat) return file;

    if (targetFormat === 'wav') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const buf = await ctx.decodeAudioData(await file.arrayBuffer());
            ctx.close();
            return new File([audioBufferToWav(buf)],
                file.name.replace(/\.[^.]+$/, '.wav'), { type: 'audio/wav' });
        } catch (e) {
            console.warn('WAV conversion failed, using original:', e);
        }
    }
    return file;
}

function audioBufferToWav(buf) {
    const nCh = buf.numberOfChannels;
    const sr = buf.sampleRate;
    const bps = 16;
    const chs = [];
    for (let i = 0; i < nCh; i++) chs.push(buf.getChannelData(i));

    const dLen = chs[0].length * nCh * 2;
    const ab = new ArrayBuffer(44 + dLen);
    const dv = new DataView(ab);

    const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };

    ws(0, 'RIFF');
    dv.setUint32(4, 36 + dLen, true);
    ws(8, 'WAVE');
    ws(12, 'fmt ');
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, nCh, true);
    dv.setUint32(24, sr, true);
    dv.setUint32(28, sr * nCh * 2, true);
    dv.setUint16(32, nCh * 2, true);
    dv.setUint16(34, bps, true);
    ws(36, 'data');
    dv.setUint32(40, dLen, true);

    let off = 44;
    for (let i = 0; i < chs[0].length; i++) {
        for (let c = 0; c < nCh; c++) {
            const s = Math.max(-1, Math.min(1, chs[c][i]));
            dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            off += 2;
        }
    }
    return new Blob([ab], { type: 'audio/wav' });
}

/* ── File System Access API helpers ──────────────────────────────── */

async function writeTextFS(dirHandle, fileName, text) {
    const fh = await dirHandle.getFileHandle(fileName, { create: true });
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
}

async function writeBlobFS(dirHandle, fileName, blob) {
    const fh = await dirHandle.getFileHandle(fileName, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
}
