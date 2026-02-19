/**
 * theme.js — Theme support page
 * Upload and manage DCS theme images
 */

import { getState, subscribe, updateProjectConfig, setThemeImage, removeThemeImage } from '../state/store.js';
import { showToast } from '../components/toast.js';
import { pickImageFile } from '../utils/file-picker.js';

const THEME_SLOTS = [
  {
    id: 'icon.png',
    name: 'Mod Icon',
    desc: 'The mod icon shown in DCS mod manager',
    recommended: '128 × 128 px',
    aspect: '1/1'
  },
  {
    id: 'MainMenulogo.png',
    name: 'Main Menu Logo',
    desc: 'Logo displayed on the DCS main menu',
    recommended: 'PNG, transparent background',
    aspect: '16/9'
  },
  {
    id: 'loading-window.png',
    name: 'Loading Screen',
    desc: 'Background image during DCS loading',
    recommended: '1920 × 1080 px',
    aspect: '16/9'
  },
  {
    id: 'briefing-map-default.png',
    name: 'Briefing Map Background',
    desc: 'Background for the mission briefing map',
    recommended: 'PNG format',
    aspect: '16/9'
  },
  {
    id: 'base-menu-window.png',
    name: 'Base Menu Window',
    desc: 'Background for the base menu window',
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
      <h1 class="page-title">Theme Support</h1>
      <p class="page-description">Optionally customize the DCS UI with your own images. These will be included in the Theme/ folder of your mod.</p>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <div class="flex-between">
        <div>
          <div class="card-title">Enable Theme</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            When enabled, the mod will include a Theme/ directory with your custom images and the entry.lua will mount theme textures.
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
                ${img ? `<img src="${img.dataUrl}" alt="${slot.name}" />` : `
                  <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.4;">🖼️</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Click to upload</div>
                  </div>
                `}
              </div>
              <div class="theme-slot-name">${slot.name}</div>
              <div class="theme-slot-info">${slot.desc}</div>
              <div class="theme-slot-info" style="margin-top: 4px;">${slot.recommended}</div>
              ${img ? `
                <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center;">
                  <span class="tag tag-green">${img.fileName}</span>
                  <button class="btn btn-danger btn-sm" data-remove-theme="${slot.id}">Remove</button>
                </div>
              ` : ''}
            </div>
          `;
  }).join('')}
      </div>
    </div>

    <div id="theme-disabled-msg" class="${config.themeEnabled ? 'hidden' : ''}">
      <div class="empty-state" style="padding: 40px;">
        <div class="empty-state-icon">🎨</div>
        <div class="empty-state-title">Theme Disabled</div>
        <div class="empty-state-text">Enable the theme toggle above to configure custom DCS UI images.</div>
      </div>
    </div>
  `;

  // Toggle
  document.getElementById('theme-toggle')?.addEventListener('change', (e) => {
    updateProjectConfig({ themeEnabled: e.target.checked });
    document.getElementById('theme-slots-container')?.classList.toggle('hidden', !e.target.checked);
    document.getElementById('theme-disabled-msg')?.classList.toggle('hidden', e.target.checked);
  });

  // Upload slots
  container.querySelectorAll('[data-slot]').forEach(el => {
    el.addEventListener('click', () => pickThemeImage(el.dataset.slot, container));
    // Drag & drop
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.style.borderColor = 'var(--accent-blue)'; });
    el.addEventListener('dragleave', () => { el.style.borderColor = ''; });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) handleThemeUpload(el.dataset.slot, file, container);
    });
  });

  // Remove buttons
  container.querySelectorAll('[data-remove-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeThemeImage(btn.dataset.removeTheme);
      renderTheme(container);
      showToast('Image removed', 'info');
    });
  });
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
