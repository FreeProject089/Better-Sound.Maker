/**
 * crash-dialog.js — "Generate a crash log" dialog
 *
 * Opened from Settings → Diagnostics, the bug button in the sidebar footer,
 * or Ctrl+Shift+L. The user may describe what they were doing; the note goes
 * at the top of the report.
 */

import { showModal } from './modal.js';
import { showToast } from './toast.js';
import { generateCrashLog } from '../utils/crash-log.js';
import { t } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';

export function openCrashLogDialog() {
    const desktop = !!window.nativeAPI;
    let note = '';

    return showModal({
        title: t('crash.title'),
        subtitle: t('crash.subtitle'),
        icon: 'bug',
        size: 'md',
        content: `
          <p>${desktop ? t('crash.descDesktop') : t('crash.descWeb')}</p>
          <div class="input-group" style="margin-top: var(--space-4);">
            <label class="input-label" for="crash-note">${t('crash.noteLabel')}</label>
            <textarea id="crash-note" class="input-field" rows="3" style="font-family: var(--font-sans); min-height: 76px;"
              placeholder="${t('crash.notePlaceholder')}"></textarea>
          </div>
          <p class="crash-privacy">${getIcon('shield-check', 'w-4 h-4')} <span>${t('crash.privacy')}</span></p>
        `,
        onRender: (overlay) => {
            overlay.querySelector('#crash-note').addEventListener('input', (e) => { note = e.target.value.trim(); });
        },
        actions: [
            ...(desktop ? [{ id: 'folder', label: `${getIcon('folder-open', 'w-4 h-4')} ${t('crash.openFolder')}`, class: 'btn-ghost', start: true, onClick: () => window.nativeAPI.openLogsDir(), keepOpen: true }] : []),
            { id: 'copy', label: `${getIcon('clipboard-copy', 'w-4 h-4')} ${t('crash.copy')}`, keepOpen: true, onClick: async () => {
                const { text } = await generateCrashLog({ reason: 'manual (copied)', notify: false, note });
                try {
                    await navigator.clipboard.writeText(text);
                    showToast(t('crash.copied'), 'success');
                } catch {
                    showToast(t('crash.copyFailed'), 'error');
                }
            } },
            { id: 'save', label: `${getIcon('file-down', 'w-4 h-4')} ${t('crash.generate')}`, class: 'btn-primary', onClick: () => generateCrashLog({ reason: 'manual', note }) },
        ],
    });
}
