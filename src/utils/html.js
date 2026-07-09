/**
 * html.js — Shared HTML-escaping helper
 *
 * Any value that originates outside our own static templates (user-typed
 * notes, file/folder names from imported mods or uploaded audio, etc.)
 * must be escaped before being interpolated into an innerHTML template
 * string, otherwise it can inject markup/script (CWE-79).
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
