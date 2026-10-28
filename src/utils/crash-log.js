/**
 * crash-log.js — Error capture and crash reports
 *
 * installCrashLog() (called first thing in main.js) records, in memory:
 *   - the last console lines (log / info / warn / error / debug),
 *   - every uncaught error and unhandled promise rejection, with its stack,
 *   - breadcrumbs: page changes and toasts.
 *
 * generateCrashLog() turns that into one plain-text report with the app,
 * system, config and state context, and saves it: desktop → the app's logs
 * folder (Rust also writes panic-*.log there), web → a downloaded .log file.
 * An uncaught error saves a report automatically on desktop (once a minute
 * at most) and offers a button to do it by hand.
 *
 * Privacy: secrets are never written. localStorage is listed by key and size
 * only; GitHub tokens and bearer headers are masked everywhere; the user's
 * home folder is shortened to ~.
 */

import { APP_VERSION } from './version.js';

const MAX_LOG_LINES = 400;
const MAX_ERRORS = 50;
const MAX_CRUMBS = 80;
const AUTO_SAVE_INTERVAL_MS = 60_000;

const logLines = [];
const errors = [];
const crumbs = [];
const startedAt = Date.now();
let installed = false;
let lastAutoSave = 0;
let lastErrorToast = 0;
let homeDir = '';

/* ── Capture ──────────────────────────────────────────────────────── */

export function installCrashLog() {
    if (installed) return;
    installed = true;

    for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
        const original = console[level].bind(console);
        console[level] = (...args) => {
            const msg = args.map(formatArg).join(' ');
            push(logLines, { t: Date.now(), level, msg: msg.length > 800 ? msg.slice(0, 800) + ' …[truncated]' : msg }, MAX_LOG_LINES);
            original(...args);
        };
    }

    window.addEventListener('error', (e) => {
        // Resource load failures (img/script) have no `error` object
        const err = e.error || { message: e.message || `Failed to load ${e.target?.src || e.target?.href || 'resource'}` };
        recordError('uncaught', err, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : '');
    }, true);

    window.addEventListener('unhandledrejection', (e) => {
        recordError('unhandled rejection', e.reason);
    });

    window.nativeAPI?.appInfo?.().then(info => {
        const m = /^([A-Za-z]:\/Users\/[^/]+|\/home\/[^/]+|\/Users\/[^/]+)/.exec(info.exePath || '');
        if (m) homeDir = m[1];
    }).catch(() => {});
}

/** Add a breadcrumb (page change, user action…) to the next report. */
export function breadcrumb(message) {
    push(crumbs, { t: Date.now(), msg: String(message) }, MAX_CRUMBS);
}

function recordError(kind, err, where = '') {
    const entry = {
        t: Date.now(),
        kind,
        message: err?.message || formatArg(err),
        stack: err?.stack || '',
        where,
        page: window.__bsmCurrentPage || '',
    };
    push(errors, entry, MAX_ERRORS);
    onUncaught(entry);
}

async function onUncaught(entry) {
    // Ignore errors raised while building a report, to avoid loops
    if (entry.stack.includes('crash-log')) return;
    const { showToast } = await import('../components/toast.js');
    const { t } = await import('./i18n.js');

    if (window.nativeAPI && Date.now() - lastAutoSave > AUTO_SAVE_INTERVAL_MS) {
        lastAutoSave = Date.now();
        try {
            const { path } = await generateCrashLog({ reason: `automatic: ${entry.kind}`, notify: false });
            showToast(t('crash.autoSaved'), 'error', 9000, {
                action: { label: t('crash.openFolder'), onClick: () => window.nativeAPI.openLogsDir() },
            });
            console.info('[crash-log] saved', path);
            return;
        } catch { /* fall through to the manual offer */ }
    }
    // One offer per burst of errors
    if (Date.now() - lastErrorToast < 10_000) return;
    lastErrorToast = Date.now();
    showToast(t('crash.errorOccurred'), 'error', 9000, {
        action: { label: t('crash.generate'), onClick: () => generateCrashLog({ reason: 'after an error' }) },
    });
}

/* ── Report ───────────────────────────────────────────────────────── */

/**
 * Build and save a crash log.
 * @returns {Promise<{ path: string|null, text: string }>}
 */
export async function generateCrashLog({ reason = 'manual', notify = true, note = '' } = {}) {
    const text = await buildReport(reason, note);
    let path = null;

    if (window.nativeAPI?.writeCrashLog) {
        path = await window.nativeAPI.writeCrashLog(text);
    } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
        a.download = `bsm-crash-${fileStamp()}.log`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    if (notify) {
        const { showToast } = await import('../components/toast.js');
        const { t } = await import('./i18n.js');
        showToast(path ? t('crash.savedTo', { path: shortenPath(path) }) : t('crash.downloaded'), 'success', 6000,
            path ? { action: { label: t('crash.openFolder'), onClick: () => window.nativeAPI.openLogsDir() } } : {});
    }
    return { path, text };
}

async function buildReport(reason, note) {
    const sections = [];
    const add = (title, body) => sections.push(`## ${title}\n${body}`.trimEnd());
    const now = new Date();

    add('Better Sound.Maker crash log', kv({
        Reason: reason,
        'Generated (local)': now.toString(),
        'Generated (UTC)': now.toISOString(),
        'App version': APP_VERSION,
        Mode: window.nativeAPI ? 'desktop (Tauri)' : 'web',
        'Session uptime': formatDuration(Date.now() - startedAt),
        'Current page': window.__bsmCurrentPage || '?',
        ...(note ? { 'User note': note } : {}),
    }));

    if (window.nativeAPI?.appInfo) {
        try { add('Desktop', kv(await window.nativeAPI.appInfo())); }
        catch (e) { add('Desktop', `app_info failed: ${formatArg(e)}`); }
    }

    add('Environment', kv({
        'User agent': navigator.userAgent,
        Platform: navigator.userAgentData?.platform || navigator.platform,
        Languages: (navigator.languages || [navigator.language]).join(', '),
        'Time zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        Screen: `${screen.width}x${screen.height} @${window.devicePixelRatio}x`,
        Viewport: `${innerWidth}x${innerHeight}`,
        'CPU threads': navigator.hardwareConcurrency,
        'Device memory (GB)': navigator.deviceMemory ?? 'n/a',
        'JS heap': performance.memory
            ? `${mb(performance.memory.usedJSHeapSize)} used / ${mb(performance.memory.jsHeapSizeLimit)} limit`
            : 'n/a',
        Online: navigator.onLine,
    }));

    add('Load.cfg', kv(window.APP_CONFIG || {}));

    try {
        const { getState } = await import('../state/store.js');
        const s = getState();
        add('Settings', kv(s.globalSettings || {}));
        add('State summary', kv({
            'Selected assets': Object.keys(s.selectedAssets || {}).length,
            'Unsaved SDEFs': Object.keys(s.unsavedSdefs || {}).length,
            Presets: (s.presets || []).length,
            'SDEF templates': (s.sdefTemplates || []).length,
            'Library sections': s.libraryData?.sections?.length ?? 'not loaded',
            'Library assets': s.libraryData?.sections?.reduce((n, sec) => n + (sec.assets?.length || 0), 0) ?? 'n/a',
            'Current SDEF': s.currentSdef || '-',
            'Project name': s.projectConfig?.modName || '-',
        }));
    } catch (e) {
        add('State', `unavailable: ${formatArg(e)}`);
    }

    try {
        const { loadCommunityCatalog } = await import('../catalog/catalog.js');
        const c = await Promise.race([loadCommunityCatalog(), new Promise(r => setTimeout(() => r(null), 3000))]);
        add('Community catalog', c ? kv({
            Source: c.source, Presets: c.presets.length, 'Sound-type packs': c.soundTypes.length,
            Problems: c.errors.length ? '\n  - ' + c.errors.slice(0, 10).join('\n  - ') : 'none',
        }) : 'timed out');
    } catch (e) {
        add('Community catalog', `unavailable: ${formatArg(e)}`);
    }

    add('Local storage (keys and sizes only)', storageSummary());

    add(`Errors (${errors.length})`, errors.length
        ? errors.map(e => `[${clock(e.t)}] ${e.kind}${e.page ? ` on ${e.page}` : ''}: ${e.message}${e.where ? `\n  at ${e.where}` : ''}${e.stack ? '\n' + indent(e.stack) : ''}`).join('\n\n')
        : 'none recorded this session');

    if (window.nativeAPI?.readPanicLogs) {
        try {
            const panics = await window.nativeAPI.readPanicLogs();
            add(`Rust panics from earlier runs (${panics.length})`,
                panics.length ? panics.map(([name, body]) => `--- ${name}\n${body}`).join('\n') : 'none');
        } catch { /* optional */ }
    }

    add(`Breadcrumbs (last ${crumbs.length})`, crumbs.map(c => `[${clock(c.t)}] ${c.msg}`).join('\n') || 'none');
    add(`Console (last ${logLines.length} lines)`,
        logLines.map(l => `[${clock(l.t)}] ${l.level.toUpperCase().padEnd(5)} ${l.msg}`).join('\n') || 'empty');

    return redact(sections.join('\n\n')) + '\n';
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function push(list, item, max) {
    list.push(item);
    if (list.length > max) list.splice(0, list.length - max);
}

function formatArg(a) {
    if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack : ''}`;
    if (typeof a === 'string') return a;
    try {
        const s = JSON.stringify(a, (_, v) => (v instanceof Map ? Object.fromEntries(v) : v));
        return s && s.length > 2000 ? s.slice(0, 2000) + '…' : String(s);
    } catch {
        return String(a);
    }
}

function kv(obj) {
    return Object.entries(obj).map(([k, v]) => `${k}: ${typeof v === 'object' && v !== null ? formatArg(v) : v}`).join('\n');
}

function storageSummary() {
    try {
        const rows = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            rows.push(`${k}: ${(localStorage.getItem(k) || '').length} chars`);
        }
        return rows.sort().join('\n') || 'empty';
    } catch (e) {
        return `unavailable: ${e.message}`;
    }
}

/** Mask secrets and shorten the home folder. */
function redact(text) {
    let out = text
        .replace(/\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, '[redacted token]')
        .replace(/(Bearer|token)\s+[A-Za-z0-9._-]{16,}/gi, '$1 [redacted]')
        .replace(/("?(?:pat|token|password|secret)"?\s*[:=]\s*")[^"]+"/gi, '$1[redacted]"');
    if (homeDir) out = out.split(homeDir).join('~');
    return out.replace(/[A-Za-z]:[\\/]Users[\\/][^\\/\s"']+/g, '~');
}

function indent(s) { return s.split('\n').map(l => '    ' + l).join('\n'); }
function clock(t) { return new Date(t).toISOString().slice(11, 23); }
function mb(n) { return `${(n / 1048576).toFixed(0)} MB`; }
function fileStamp() { return new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19); }
function shortenPath(p) { return homeDir ? p.replace(homeDir, '~') : p; }
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m ${s % 60}s`;
}
