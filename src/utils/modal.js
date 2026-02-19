/**
 * src/utils/modal.js — Generic modal utility
 */

export function showModal({ title, content, buttons = [] }) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" id="modal-close">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer">
        ${buttons.map((btn, i) => `
          <button class="btn ${btn.primary ? 'btn-primary' : 'btn-secondary'}" id="modal-btn-${i}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;

    // Bind close
    const closeBtn = document.getElementById('modal-close');
    closeBtn?.addEventListener('click', closeModal);

    // Bind buttons
    buttons.forEach((btn, i) => {
        const el = document.getElementById(`modal-btn-${i}`);
        el?.addEventListener('click', () => {
            if (btn.onClick) btn.onClick();
            if (!btn.preventClose) closeModal();
        });
    });
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
}
