/**
 * theme.js — Theme support page
 * Upload and manage DCS theme images
 */

import { getState, subscribe, updateProjectConfig, setThemeImage, removeThemeImage } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { pickImageFile } from '../utils/file-picker.js';
import { t, updateTranslations } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';

const THEME_SLOTS = [
  {
    id: 'icon.png',
    nameKey: 'themePage.slots.icon.name',
    descKey: 'themePage.slots.icon.desc',
    recommended: '128 × 128 px',
    aspect: '1/1'
  },
  {
    id: 'MainMenulogo.png',
    nameKey: 'themePage.slots.mainMenu.name',
    descKey: 'themePage.slots.mainMenu.desc',
    recommended: 'PNG, transparent background',
    aspect: '16/9'
  },
  {
    id: 'loading-window.png',
    nameKey: 'themePage.slots.loading.name',
    descKey: 'themePage.slots.loading.desc',
    recommended: '1920 × 1080 px',
    aspect: '16/9'
  },
  {
    id: 'briefing-map-default.png',
    nameKey: 'themePage.slots.briefing.name',
    descKey: 'themePage.slots.briefing.desc',
    recommended: 'PNG format',
    aspect: '16/9'
  },
  {
    id: 'base-menu-window.png',
    nameKey: 'themePage.slots.baseMenu.name',
    descKey: 'themePage.slots.baseMenu.desc',
    recommended: '1920 × 1080 px',
    aspect: '16/9'
  }
];

export function renderTheme(container) {
  const state = getState();
  const config = state.projectConfig;
  const themeImages = state.themeImages;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('themePage.title')}</h1>
      <p class="page-description">${t('themePage.description')}</p>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="flex-between">
        <div>
          <div class="card-title">${t('themePage.enable')}</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            ${t('themePage.enableDesc')}
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="theme-toggle" ${config.themeEnabled ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <div id="theme-slots-container" class="${config.themeEnabled ? '' : 'hidden'}">
      <div class="theme-grid">
        ${THEME_SLOTS.map(slot => {
    const img = themeImages[slot.id];
    return `
            <div class="theme-slot">
              <div class="theme-slot-preview" data-slot="${slot.id}" style="aspect-ratio: ${slot.aspect};">
                ${img ? `<img src="${img.dataUrl}" alt="${t(slot.nameKey)}" />` : `
                  <div style="text-align: center; padding: 20px;">
                    <div style="margin-bottom: 8px; opacity: 0.4;">${getIcon('image', 'w-8 h-8')}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${t('themePage.clickToUpload')}</div>
                  </div>
                `}
              </div>
              <div class="theme-slot-name">${t(slot.nameKey)}</div>
              <div class="theme-slot-info">${t(slot.descKey)}</div>
              <div class="theme-slot-info" style="margin-top: 4px;">${slot.recommended}</div>
              ${img ? `
                <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center;">
                  <span class="tag tag-green">${img.fileName}</span>
                  <button class="btn btn-danger btn-sm" data-remove-theme="${slot.id}">${t('themePage.remove')}</button>
                </div>
              ` : ''}
            </div>
          `;
  }).join('')}
      </div>
    </div>

    <div id="theme-disabled-msg" class="${config.themeEnabled ? 'hidden' : ''}">
      <div class="empty-state" style="padding: 40px;">
        <div class="empty-state-icon">${getIcon('image', 'icon-xl')}</div>
        <div class="empty-state-title">${t('themePage.disabledTitle')}</div>
        <div class="empty-state-text">${t('themePage.disabledText')}</div>
      </div>
    </div>
  `;

  // Toggle
  document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
    updateProjectConfig({ themeEnabled: e.target.checked });
    document.getElementById('theme-slots-container')?.classList.toggle('hidden', !e.target.checked);
    document.getElementById('theme-disabled-msg')?.classList.toggle('hidden', e.target.checked);
  });

  // Remove buttons
  container.querySelectorAll('[data-remove-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeThemeImage(btn.dataset.removeTheme);
      renderTheme(container);
      showToast('Image removed', 'info');
    });
  });

  // Upload zones
  container.querySelectorAll('.theme-slot-preview').forEach(el => {
    el.addEventListener('click', () => {
      if (document.getElementById('theme-slots-container').classList.contains('hidden')) return;
      pickThemeImage(el.dataset.slot, container);
    });
  });

  updateTranslations();
}

async function pickThemeImage(slot, container) {
  try {
    const file = await pickImageFile();
    await handleThemeUpload(slot, file, container);
  } catch (e) {
    if (e.name !== 'AbortError') {
      showToast('Failed to open file: ' + e.message, 'error');
    }
  }
}

async function handleThemeUpload(slot, file, container) {
  const reader = new FileReader();
  reader.onload = () => {
    setThemeImage(slot, file, reader.result);
    renderTheme(container);
    showToast(`Theme image set: ${slot}`, 'success');
  };
  reader.readAsDataURL(file);
}
