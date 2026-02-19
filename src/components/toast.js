/**
 * toast.js — Toast notification system
 */

let toastContainer = null;

export function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) {
        toastContainer = document.getElementById('toast-container');
    }
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
