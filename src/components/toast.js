/**
 * toast.js — Toast notification system
 *
 * showToast(message, type?, duration?, { action?: { label, onClick } })
 * An action adds a button to the toast (e.g. "Save crash log").
 */

import { escapeHtml } from '../utils/html.js';
import { getIcon } from '../utils/icons.js';

let toastContainer = null;

const ICONS = { success: 'check-circle-2', error: 'x-circle', warning: 'alert-triangle', info: 'info' };

export function showToast(message, type = 'info', duration = 3000, { action = null } = {}) {
    if (!toastContainer) {
        toastContainer = document.getElementById('toast-container');
    }
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    // Messages frequently embed untrusted values (filenames, error text from
    // imported mods, etc.) — escape before writing into innerHTML (CWE-79).
    toast.innerHTML = `
        <span class="toast-icon">${getIcon(ICONS[type] || ICONS.info, 'w-4 h-4')}</span>
        <span class="toast-text">${escapeHtml(message)}</span>
        ${action ? `<button type="button" class="btn btn-sm btn-secondary toast-action">${escapeHtml(action.label)}</button>` : ''}`;

    const dismiss = () => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    };
    toast.querySelector('.toast-action')?.addEventListener('click', () => {
        dismiss();
        action.onClick();
    });

    toastContainer.appendChild(toast);
    setTimeout(dismiss, action ? Math.max(duration, 8000) : duration);
}
