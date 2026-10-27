/**
 * history.js — Undo / redo for the project (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
 *
 * Snapshots the editable parts of the state (selection + SDEF contents,
 * unsaved SDEF edits, project config, presets, templates) after every change,
 * grouped: changes within 600 ms make one step (typing in a field = one undo).
 * Audio files are not copied: undoing a selection keeps the File objects, so
 * a re-selected sound gets its audio back.
 *
 * Inside a text field Ctrl+Z is left to the field's own undo.
 */

import { getState, setState, subscribe } from './store.js';

const KEYS = ['selectedAssets', 'unsavedSdefs', 'projectConfig', 'presets', 'sdefTemplates'];
const LIMIT = 100;
const GROUP_MS = 600;

const past = [];
const future = [];
let current = null;
let restoring = false;
let timer = 0;

const snap = () => JSON.stringify(Object.fromEntries(KEYS.map(k => [k, getState()[k]])));

function record() {
    if (restoring) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
        const next = snap();
        if (next === current) return;
        if (current !== null) {
            past.push(current);
            if (past.length > LIMIT) past.shift();
            future.length = 0;
        }
        current = next;
        emit();
    }, GROUP_MS);
}

function apply(json) {
    restoring = true;
    const data = JSON.parse(json);
    for (const k of KEYS) if (k in data) setState(k, data[k]);
    current = json;
    restoring = false;
    emit();
}

export function undo() {
    clearTimeout(timer);
    const pending = snap();
    if (pending !== current) { past.push(current); current = pending; }   // flush a step still grouping
    if (!past.length) return false;
    future.push(current);
    apply(past.pop());
    return true;
}

export function redo() {
    if (!future.length) return false;
    past.push(current);
    apply(future.pop());
    return true;
}

export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;

function emit() {
    window.dispatchEvent(new CustomEvent('bsm-history', { detail: { undo: past.length, redo: future.length } }));
}

export function initHistory() {
    current = snap();
    for (const k of KEYS) subscribe(k, record);

    document.addEventListener('keydown', async (e) => {
        if (!e.ctrlKey || e.altKey) return;
        const key = e.key.toLowerCase();
        const isUndo = key === 'z' && !e.shiftKey;
        const isRedo = key === 'y' || (key === 'z' && e.shiftKey);
        if (!isUndo && !isRedo) return;
        if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        e.preventDefault();
        const ok = isUndo ? undo() : redo();
        const { showToast } = await import('../components/toast.js');
        const fr = (await import('../utils/i18n.js')).getCurrentLanguage() === 'fr';
        if (ok) {
            showToast(isUndo ? (fr ? 'Annulé' : 'Undone') : (fr ? 'Rétabli' : 'Redone'), 'info', 1200);
            window.dispatchEvent(new CustomEvent('bsm-history-applied'));
        } else {
            showToast(isUndo ? (fr ? 'Rien à annuler' : 'Nothing to undo') : (fr ? 'Rien à rétablir' : 'Nothing to redo'), 'info', 1200);
        }
    });
}
