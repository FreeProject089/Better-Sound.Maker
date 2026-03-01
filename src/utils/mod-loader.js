/**
 * mod-loader.js — Logic for importing existing DCS sound mods
 */

import JSZip from 'jszip';
import { parseSdef } from './sdef-generator.js';
import { analyzeAudioFile } from './audio-analyzer.js';

/**
 * Load a mod from a ZIP file
 * @param {File} zipFile
 * @returns {Promise<{assets: Object, config: Object, audioBlobs: Map}>}
 */
export async function loadModFromZip(zipFile) {
    const zip = await JSZip.loadAsync(zipFile);
    const result = {
        assets: {},
        config: {},
        audioBlobs: new Map() // sdefPath -> File/Blob
    };

    // 1. Find entry.lua for project config
    const entryFile = zip.file(/entry\.lua$/i)[0];
    if (entryFile) {
        const content = await entryFile.async('string');
        result.config = parseEntryLua(content);
    }

    // 2. Scan for SDEFs
    const sdefFiles = zip.file(/Sounds\/sdef\/.*\.sdef$/i);
    const audioFiles = zip.file(/Sounds\/Effects\/.*\.(wav|ogg)$/i);

    for (const sFile of sdefFiles) {
        // Path relative to Sounds/sdef/
        const sdefPath = sFile.name.replace(/^.*Sounds\/sdef\//i, '');
        const content = await sFile.async('string');
        const params = parseSdef(content);

        result.assets[sdefPath] = {
            sdefContent: content,
            customWaves: params.wave || [],
            audioFileName: null,
            audioMeta: null,
            note: 'Imported from ZIP'
        };

        // 3. Try to match with audio files
        if (params.wave && params.wave.length > 0) {
            // Use the first wave as the primary audio for now
            const firstWave = params.wave[0];
            const audioEntry = audioFiles.find(f => f.name.toLowerCase().endsWith(firstWave.toLowerCase() + '.wav') || f.name.toLowerCase().endsWith(firstWave.toLowerCase() + '.ogg'));

            if (audioEntry) {
                const blob = await audioEntry.async('blob');
                const fileName = audioEntry.name.split('/').pop();
                const file = new File([blob], fileName, { type: fileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/wav' });

                result.audioBlobs.set(sdefPath, file);
                result.assets[sdefPath].audioFileName = fileName;
                // Meta will be analyzed during store import
            }
        }
    }

    return result;
}

/**
 * Basic parser for entry.lua
 */
function parseEntryLua(content) {
    const config = {};
    const match = (regex) => {
        const m = content.match(regex);
        return m ? m[1].trim() : '';
    };

    config.modName = match(/name\s*=\s*"(.*?)"/);
    config.displayName = match(/displayName\s*=\s*"(.*?)"/);
    config.author = match(/author\s*=\s*"(.*?)"/);
    config.version = match(/version\s*=\s*"(.*?)"/);
    config.description = match(/description\s*=\s*"(.*?)"/);

    return config;
}

/**
 * Load a mod from an unzipped folder on disk (Electron Only).
 * @param {string} folderPath — absolute path to the mod root
 */
export async function loadModFromFolder(folderPath) {
    if (!window.electronAPI) throw new Error('Folder loading requires Electron');

    const result = {
        assets: {},
        config: {},
        audioBlobs: new Map()
    };

    // Helper: recursively collect files with a given extension
    async function collectFiles(dir, ext, collected = []) {
        let entries;
        try { entries = await window.electronAPI.readDir(dir); } catch { return collected; }
        for (const entry of entries) {
            const fullPath = `${dir}/${entry.name}`;
            if (entry.isDirectory) {
                await collectFiles(fullPath, ext, collected);
            } else if (entry.name.toLowerCase().endsWith(ext)) {
                collected.push(fullPath);
            }
        }
        return collected;
    }

    // 1. Parse entry.lua
    const entryPath = `${folderPath}/entry.lua`;
    if (await window.electronAPI.exists(entryPath)) {
        const content = await window.electronAPI.readTextFile(entryPath);
        if (content) result.config = parseEntryLua(content);
    }

    // 2. Scan SDEFs
    const sdefRoot = `${folderPath}/Sounds/sdef`;
    const sdefPaths = await collectFiles(sdefRoot, '.sdef');

    // 3. Build audio index from Effects folder
    const effectsRoot = `${folderPath}/Sounds/Effects`;
    const audioPaths = [
        ...await collectFiles(effectsRoot, '.wav'),
        ...await collectFiles(effectsRoot, '.ogg')
    ];

    for (const sFilePath of sdefPaths) {
        const sdefPathKey = sFilePath.replace(/^.*Sounds[/\\]sdef[/\\]/i, '').replace(/\\/g, '/');
        const content = await window.electronAPI.readTextFile(sFilePath);
        if (!content) continue;
        const params = parseSdef(content);

        result.assets[sdefPathKey] = {
            sdefContent: content,
            customWaves: params.wave || [],
            audioFileName: null,
            audioMeta: null,
            note: 'Imported from folder'
        };

        if (params.wave && params.wave.length > 0) {
            const firstWave = params.wave[0].toLowerCase();
            const audioEntry = audioPaths.find(p => p.replace(/\\/g, '/').toLowerCase().endsWith(firstWave + '.wav') || p.replace(/\\/g, '/').toLowerCase().endsWith(firstWave + '.ogg'));
            if (audioEntry) {
                const buffer = await window.electronAPI.readFile(audioEntry);
                if (buffer) {
                    const fileName = audioEntry.split(/[/\\]/).pop();
                    const blob = new Blob([buffer], { type: fileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/wav' });
                    const file = new File([blob], fileName, { type: blob.type });
                    result.audioBlobs.set(sdefPathKey, file);
                    result.assets[sdefPathKey].audioFileName = fileName;
                }
            }
        }
    }

    return result;
}
