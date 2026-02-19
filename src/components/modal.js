/**
 * modal.js — Modal dialog system
 */

let overlay = null;

export function showModal({ title, content, actions = [] }) {
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

    // Close button
    overlay.querySelector('#modal-close-btn').addEventListener('click', hideModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
    });

    // Action buttons
    return new Promise(resolve => {
        overlay.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                resolve(btn.dataset.action);
                hideModal();
            });
        });

        overlay.querySelector('#modal-close-btn').addEventListener('click', () => {
            resolve(null);
        });
    });
}

export function hideModal() {
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
    }
}
