/**
 * src/utils/modal.js — Older modal API, kept for its callers
 *
 * showModal({ title, content, buttons: [{ text, primary, onClick, preventClose }] })
 * is forwarded to the one modal shell in src/components/modal.js.
 */

import { showModal as showShellModal, hideModal } from '../components/modal.js';

export function showModal({ title, content, buttons = [], className = '', ...rest }) {
  return showShellModal({
    ...rest,
    title,
    content,
    className,
    actions: buttons.map((btn, i) => ({
      id: `btn-${i}`,
      label: btn.text,
      class: btn.primary ? 'btn-primary' : 'btn-secondary',
      onClick: btn.onClick,
      keepOpen: !!btn.preventClose,
    })),
  });
}

export function closeModal() {
  hideModal();
}
