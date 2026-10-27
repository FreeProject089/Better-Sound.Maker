/**
 * sync.js — Project sync with a GitHub repository (Git Data API)
 *
 * One push = ONE commit, whatever the number of files: blobs → tree (on top
 * of the current one) → commit → move the branch. The repository is laid out
 * as a working DCS mod, so cloning it into Mods/resource just works:
 *
 *   entry.lua
 *   Sounds/sdef/<sdef path>
 *   Sounds/Effects/<wave path>.<ext>
 *   project.json          ← BSM project (config, selection, audio map)
 *   .bsm/notes/*.json     ← team notes (github-api.js)
 *
 * project.json carries `audioMap`: { "<sdef>::<wave>": "Sounds/Effects/…" },
 * which is what pull uses to bring the audio back.
 *
 * Status: the last synced commit and a hash of the synced project are kept
 * per repo, so the page can say "you have local changes" and "the team pushed
 * something new" without downloading anything.
 */

import {
    getState, setState, updateProjectConfig, getAudioFile, getWaveAudioFile,
    setAudioFile, setWaveAudioFile,
} from '../state/store.js';
import { generateEntryLua } from '../utils/entry-generator.js';
import { generateSdef } from '../utils/sdef-generator.js';
import { detectSoundType, getTypeDefaults } from '../utils/audio-analyzer.js';

const GH = 'https://api.github.com';
const CFG_KEY = 'bsm-collab';
const SYNC_KEY = 'bsm-collab-sync';

/* ── Config ─────────────────────────────────────────────────────── */

export function loadCollabConfig() {
    try { return { branch: 'main', ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') }; } catch { return { branch: 'main' }; }
}
export function saveCollabConfig(cfg) {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('bsm-collab-changed'));
}
export const isConfigured = (c = loadCollabConfig()) => !!(c.pat && c.repo);

function syncRecord(repo) {
    try { return JSON.parse(localStorage.getItem(SYNC_KEY) || '{}')[repo] || null; } catch { return null; }
}
function saveSyncRecord(repo, rec) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}'); } catch { /* reset */ }
    all[repo] = rec;
    localStorage.setItem(SYNC_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('bsm-collab-changed'));
}

/* ── HTTP ───────────────────────────────────────────────────────── */

async function gh(cfg, path, { method = 'GET', body } = {}) {
    const res = await fetch(`${GH}/repos/${cfg.repo}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${cfg.pat}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404 || res.status === 409) return { status: res.status, data: null };
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ? `GitHub: ${err.message} (${res.status})` : `GitHub error ${res.status}`);
    }
    return { status: res.status, data: res.status === 204 ? null : await res.json() };
}

function toBase64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
}
function fromBase64(b64) {
    const bin = atob(b64.replace(/\n/g, ''));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
const utf8 = (s) => new TextEncoder().encode(s);

export async function hashProject(state = getState()) {
    const data = utf8(JSON.stringify(projectPayload(state)));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

function projectPayload(state) {
    return {
        projectConfig: state.projectConfig,
        selectedAssets: state.selectedAssets,
        presets: state.presets,
        themeImages: state.themeImages,
    };
}

/* ── Status ─────────────────────────────────────────────────────── */

/** @returns {Promise<{ user, repo, branch, head, local: boolean, remote: boolean, lastSync }>} */
export async function getSyncStatus(cfg = loadCollabConfig()) {
    const [userRes, ref] = await Promise.all([
        fetch(`${GH}/user`, { headers: { Authorization: `Bearer ${cfg.pat}` } }),
        gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`),
    ]);
    if (!userRes.ok) throw new Error(`Token refused by GitHub (${userRes.status})`);
    const repoInfo = await gh(cfg, '');
    if (!repoInfo.data) throw new Error(`Repository ${cfg.repo} not found or not accessible with this token`);
    const user = (await userRes.json()).login;
    const head = ref.data?.object?.sha || null;
    const rec = syncRecord(cfg.repo);
    const localHash = await hashProject();
    return {
        user,
        repo: repoInfo.data.full_name,
        private: repoInfo.data.private,
        canPush: !!repoInfo.data.permissions?.push,
        branch: cfg.branch,
        head,
        lastSync: rec,
        local: !rec || rec.hash !== localHash,
        remote: !!head && (!rec || rec.sha !== head),
    };
}

/* ── Push ───────────────────────────────────────────────────────── */

/**
 * Push the whole project in one commit.
 * @param {(msg: string, done?: number, total?: number) => void} progress
 */
export async function pushProject(message, progress = () => {}, cfg = loadCollabConfig()) {
    const state = getState();
    const files = [];               // { path, bytes }
    const audioMap = {};

    progress('Preparing files…');
    files.push({ path: 'entry.lua', bytes: utf8(generateEntryLua(state.projectConfig || {})) });

    for (const [key, asset] of Object.entries(state.selectedAssets || {})) {
        let sdef = state.unsavedSdefs?.[key] || asset.sdefContent;
        const waves = asset.customWaves || asset.originalAsset?.waves || [];
        if (!sdef && waves.length) sdef = generateSdef({ wave: waves, ...getTypeDefaults(detectSoundType(key)) });
        if (sdef) files.push({ path: `Sounds/sdef/${key}`, bytes: utf8(sdef) });

        for (const wave of waves) {
            const file = getWaveAudioFile(key, wave) || getAudioFile(key);
            if (!file) continue;
            const bytes = new Uint8Array(await readAudio(file, asset, wave));
            const ext = (file.name.split('.').pop() || 'wav').toLowerCase();
            const rel = wave.replace(/^\/?(Effects\/)?/i, '').replace(/\.[^./]+$/, '');
            const path = `Sounds/Effects/${rel}.${ext}`;
            audioMap[`${key}::${wave}`] = { path, name: file.name };
            if (!files.some(f => f.path === path)) files.push({ path, bytes });
        }
    }
    const payload = { ...projectPayload(state), audioMap, savedBy: 'Better Sound.Maker', savedAt: new Date().toISOString() };
    files.push({ path: 'project.json', bytes: utf8(JSON.stringify(payload, null, 2)) });

    // Current branch head (an empty repo has none: seed it with a README)
    let ref = await gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
    if (!ref.data) {
        progress('Initialising the repository…');
        await gh(cfg, '/contents/README.md', {
            method: 'PUT',
            body: { message: 'Initialise Better Sound.Maker project', branch: cfg.branch, content: toBase64(utf8(`# ${state.projectConfig?.modName || 'Sound mod'}\n\nA DCS sound mod made with Better Sound.Maker. Clone or download this repository into \`Saved Games/DCS/Mods/resource\`.\n`)) },
        });
        ref = await gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`);
    }
    const parentSha = ref.data.object.sha;
    const parent = (await gh(cfg, `/git/commits/${parentSha}`)).data;

    // Upload only what changed: compare with the blob SHAs already in the tree
    const remoteTree = (await gh(cfg, `/git/trees/${parent.tree.sha}?recursive=1`)).data;
    const remoteSha = new Map((remoteTree?.tree || []).map(e => [e.path, e.sha]));
    const entries = [];
    let done = 0;
    for (const f of files) {
        done++;
        const sha = await gitBlobSha(f.bytes);
        if (remoteSha.get(f.path) === sha) continue;
        progress(`Uploading ${f.path}`, done, files.length);
        const blob = (await gh(cfg, '/git/blobs', { method: 'POST', body: { content: toBase64(f.bytes), encoding: 'base64' } })).data;
        entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    // Files of this project that were removed locally
    const wanted = new Set(files.map(f => f.path));
    for (const path of remoteSha.keys()) {
        if ((path.startsWith('Sounds/sdef/') || path.startsWith('Sounds/Effects/')) && !wanted.has(path)) {
            entries.push({ path, mode: '100644', type: 'blob', sha: null });
        }
    }

    if (!entries.length) {
        saveSyncRecord(cfg.repo, { sha: parentSha, hash: await hashProject(), at: Date.now() });
        return { sha: parentSha, changed: 0, nothing: true };
    }

    progress('Creating the commit…');
    const tree = (await gh(cfg, '/git/trees', { method: 'POST', body: { base_tree: parent.tree.sha, tree: entries } })).data;
    const commit = (await gh(cfg, '/git/commits', { method: 'POST', body: { message: message || 'Update sound mod', tree: tree.sha, parents: [parentSha] } })).data;
    const moved = await gh(cfg, `/git/refs/heads/${encodeURIComponent(cfg.branch)}`, { method: 'PATCH', body: { sha: commit.sha } });
    if (!moved.data) throw new Error('The branch moved while pushing (someone else pushed). Pull first, then push again.');

    saveSyncRecord(cfg.repo, { sha: commit.sha, hash: await hashProject(), at: Date.now() });
    return { sha: commit.sha, changed: entries.length };
}

async function readAudio(file, asset, wave) {
    const path = asset.waveAudioFiles?.[wave]?.audioPath || asset.audioPath;
    if (path && window.nativeAPI) {
        const buf = await window.nativeAPI.readFile(path);
        if (buf) return buf;
    }
    return file.arrayBuffer();
}

/** Git's blob id: sha1("blob <len>\0" + data). Lets push skip unchanged files. */
async function gitBlobSha(bytes) {
    const head = utf8(`blob ${bytes.length}\0`);
    const all = new Uint8Array(head.length + bytes.length);
    all.set(head);
    all.set(bytes, head.length);
    const d = await crypto.subtle.digest('SHA-1', all);
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Pull ───────────────────────────────────────────────────────── */

/** Read project.json at `sha` (default: branch head) and apply it, audio included. */
export async function pullProject(progress = () => {}, cfg = loadCollabConfig(), sha = null) {
    const ref = sha || (await gh(cfg, `/git/ref/heads/${encodeURIComponent(cfg.branch)}`)).data?.object?.sha;
    if (!ref) throw new Error('The branch is empty: nothing to pull yet.');
    const commit = (await gh(cfg, `/git/commits/${ref}`)).data;
    const tree = (await gh(cfg, `/git/trees/${commit.tree.sha}?recursive=1`)).data;
    const byPath = new Map(tree.tree.map(e => [e.path, e.sha]));
    const projectSha = byPath.get('project.json');
    if (!projectSha) throw new Error('No project.json in this repository: push from Better Sound.Maker first.');

    progress('Reading project.json…');
    const project = JSON.parse(new TextDecoder().decode(fromBase64((await gh(cfg, `/git/blobs/${projectSha}`)).data.content)));
    if (project.projectConfig) updateProjectConfig(project.projectConfig);
    if (project.selectedAssets) setState('selectedAssets', project.selectedAssets);
    if (project.presets) setState('presets', project.presets);
    if (project.themeImages) setState('themeImages', project.themeImages);

    const entries = Object.entries(project.audioMap || {});
    let got = 0;
    for (const [i, [k, info]] of entries.entries()) {
        const blobSha = byPath.get(info.path);
        if (!blobSha) continue;
        progress(`Downloading ${info.path}`, i + 1, entries.length);
        const bytes = fromBase64((await gh(cfg, `/git/blobs/${blobSha}`)).data.content);
        const [sdef, wave] = k.split('::');
        const file = new File([bytes], info.name || info.path.split('/').pop(), { type: info.path.endsWith('.ogg') ? 'audio/ogg' : 'audio/wav' });
        const asset = getState().selectedAssets[sdef];
        const waves = asset?.customWaves || asset?.originalAsset?.waves || [];
        if (waves.length <= 1) await setAudioFile(sdef, file, { name: file.name, size: file.size });
        else await setWaveAudioFile(sdef, wave, file, { name: file.name, size: file.size });
        got++;
    }

    if (!sha) saveSyncRecord(cfg.repo, { sha: ref, hash: await hashProject(), at: Date.now() });
    return { sha: ref, audio: got, assets: Object.keys(project.selectedAssets || {}).length };
}

/* ── History ────────────────────────────────────────────────────── */

export async function listCommits(cfg = loadCollabConfig(), n = 30) {
    const r = await gh(cfg, `/commits?sha=${encodeURIComponent(cfg.branch)}&per_page=${n}`);
    return (r.data || []).map(c => ({
        sha: c.sha, message: c.commit.message.split('\n')[0], author: c.author?.login || c.commit.author.name,
        avatar: c.author?.avatar_url || '', date: c.commit.author.date, url: c.html_url,
    }));
}
