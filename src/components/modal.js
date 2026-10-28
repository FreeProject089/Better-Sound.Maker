/**
 * modal.js — THE modal dialog (see the anatomy in src/styles/shell.css)
 *
 * showModal({
 *   title, subtitle?, icon?, tone?: 'danger'|'warning'|'success',
 *   size?: 'sm'|'md'|'lg'|'xl', content, className?,
 *   actions?: [{ id, label, class?, start?, onClick?, keepOpen? }],
 *   onRender?(overlay), onClose?(overlay, value), dismissible = true,
 * }) → Promise<action id | null>
 *
 * A title that starts with an icon (`${getIcon(...)} Title`) gets that icon
 * moved into the header tile. Esc, the ✕ and a click on the backdrop close
 * the dialog with null unless dismissible is false.
 */

import { getIcon, renderIcons } from '../utils/icons.js';

let overlay = null;
let closeCurrent = null;
let returnFocus = null;

const LEADING_SVG = /^\s*(<svg[\s\S]*?<\/svg>)\s*/;

export function showModal({
    title = '', subtitle = '', icon = '', tone = '', size = '', content = '', className = '',
    actions = [], onRender = null, onClose = null, dismissible = true,
}) {
    overlay = document.getElementById('modal-overlay');
    if (!overlay) return Promise.resolve(null);

    // A dialog replacing another one resolves the first as dismissed
    if (closeCurrent) closeCurrent(null, { silent: true });
    returnFocus = document.activeElement;

    let titleHtml = String(title);
    let iconHtml = icon ? getIcon(icon, 'w-5 h-5') : '';
    const lead = LEADING_SVG.exec(titleHtml);
    if (lead) {
        if (!iconHtml) iconHtml = lead[1].replace(/width="\d+" height="\d+"/, 'width="20" height="20"');
        titleHtml = titleHtml.slice(lead[0].length);
    }

    const button = (a) =>
        `<button type="button" class="btn ${a.class || 'btn-secondary'}" data-action="${a.id}">${a.label}</button>`;
    const startActions = actions.filter(a => a.start);
    const endActions = actions.filter(a => !a.start);

    overlay.innerHTML = `
    <div class="modal ${size ? `modal--${size}` : ''} ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        ${iconHtml ? `<div class="modal-icon ${tone ? `modal-icon--${tone}` : ''}">${iconHtml}</div>` : ''}
        <div class="modal-titles">
          <h3 class="modal-title" id="modal-title">${titleHtml}</h3>
          ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
        </div>
        ${dismissible ? `<button type="button" class="modal-close" id="modal-close-btn" aria-label="Close">${getIcon('x', 'w-4 h-4')}</button>` : ''}
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer modal-actions">${startActions.length ? `<div class="modal-footer-start">${startActions.map(button).join('')}</div>` : ''}${endActions.map(button).join('')}</div>
    </div>
  `;
    overlay.classList.remove('hidden');

    if (onRender) onRender(overlay);
    renderIcons(overlay);

    return new Promise(resolve => {
        const onKey = (e) => {
            if (e.key === 'Escape' && dismissible) { e.stopPropagation(); finish(null); }
        };
        const finish = (val, { silent = false } = {}) => {
            if (closeCurrent !== finish) return;
            closeCurrent = null;
            document.removeEventListener('keydown', onKey, true);
            if (onClose) onClose(overlay, val);
            if (!silent) {
                hideModal();
                if (returnFocus && document.contains(returnFocus)) returnFocus.focus?.();
            }
            resolve(val);
        };
        closeCurrent = finish;
        document.addEventListener('keydown', onKey, true);

        overlay.querySelector('#modal-close-btn')?.addEventListener('click', () => finish(null));
        overlay.onclick = (e) => { if (e.target === overlay && dismissible) finish(null); };

        overlay.querySelectorAll('[data-action]').forEach(btn => {
            const action = actions.find(a => String(a.id) === btn.dataset.action);
            btn.addEventListener('click', async () => {
                if (action?.onClick) await action.onClick();
                if (!action?.keepOpen) finish(btn.dataset.action);
            });
        });

        // Focus the first field, else the primary (last) button
        const target = overlay.querySelector('.modal-body input, .modal-body select, .modal-body textarea')
            || overlay.querySelector('.modal-footer .btn:last-child');
        target?.focus({ preventScroll: true });
    });
}

export function hideModal() {
    if (closeCurrent) { closeCurrent(null, { silent: true }); }
    const el = overlay || document.getElementById('modal-overlay');
    if (el) {
        el.classList.add('hidden');
        el.innerHTML = '';
    }
}
