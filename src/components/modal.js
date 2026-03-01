/**
 * modal.js — Modal dialog system
 */

import { renderIcons } from '../utils/icons.js';

let overlay = null;

export function showModal({ title, content, actions = [], onRender = null, onClose = null }) {
    overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const actionsHtml = actions.map(a =>
        `<button class="btn ${a.class || 'btn-secondary'}" data-action="${a.id}">${a.label}</button>`
    ).join('');

    overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-actions">${actionsHtml}</div>
    </div>
  `;

    overlay.classList.remove('hidden');

    if (onRender) onRender(overlay);
    renderIcons(overlay);

    // Action buttons
    return new Promise(resolve => {
        const cleanup = (val) => {
            if (onClose) onClose(overlay, val);
            hideModal();
            resolve(val);
        };

        // Close button
        overlay.querySelector('#modal-close-btn').addEventListener('click', () => cleanup(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(null);
        });

        overlay.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                cleanup(btn.dataset.action);
            });
        });
    });
}

export function hideModal() {
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
    }
}
