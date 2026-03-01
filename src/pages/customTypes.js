/**
 * customTypes.js — Custom Sound Types Management page
 * View default types, create custom types, assign SDEFs to types, share/import types
 */

import { getIcon, renderIcons } from '../utils/icons.js';
import { t, updateTranslations } from '../utils/i18n.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { SOUND_TYPES, ensureRulesLoaded, reloadRules, getTypeIconHtml } from '../utils/audio-analyzer.js';
import { getState } from '../state/store.js';

// Available Lucide icons for custom types
const AVAILABLE_ICONS = [
  'flame', 'key', 'headphones', 'toggle-left', 'megaphone', 'radio',
  'crosshair', 'cog', 'snowflake', 'circle-dot', 'shield', 'wind',
  'plane', 'radio-tower', 'bomb', 'hammer', 'user', 'globe',
  'mouse-pointer', 'volume-2', 'music', 'speaker', 'bell', 'zap',
  'sun', 'moon', 'cloud', 'droplet', 'thermometer', 'anchor',
  'compass', 'map', 'navigation', 'alert-triangle', 'alert-circle',
  'info', 'terminal', 'cpu', 'monitor', 'smartphone', 'tablet',
  'tv', 'camera', 'film', 'image', 'mic', 'mic-off',
  'phone', 'phone-off', 'wifi', 'bluetooth', 'battery', 'power',
  'activity', 'heart', 'target', 'flag', 'bookmark', 'tag',
  'hash', 'at-sign', 'link', 'paperclip', 'scissors', 'tool',
  'wrench', 'settings', 'sliders', 'filter', 'layers', 'grid',
  'list', 'layout', 'sidebar', 'menu', 'more-horizontal', 'more-vertical',
  'chevron-right', 'chevron-down', 'arrow-right', 'arrow-up', 'arrow-down',
  'rotate-cw', 'refresh-cw', 'play', 'pause', 'stop-circle', 'fast-forward',
  'rewind', 'skip-forward', 'skip-back', 'repeat', 'shuffle',
  'maximize', 'minimize', 'expand', 'shrink', 'move', 'copy',
  'trash-2', 'edit-2', 'edit-3', 'pen-tool', 'type', 'bold',
  'eye', 'eye-off', 'search', 'zoom-in', 'zoom-out',
  'lock', 'unlock', 'shield-off', 'check', 'x', 'plus', 'minus',
  'clock', 'calendar', 'inbox', 'send', 'mail', 'message-square',
  'server', 'database', 'hard-drive', 'cloud-lightning', 'aperture',
  'box', 'package', 'truck', 'briefcase', 'shopping-cart', 'gift',
  'award', 'trending-up', 'trending-down', 'bar-chart', 'pie-chart',
  'hexagon', 'octagon', 'triangle', 'square', 'circle', 'star',
  'feather', 'github', 'gitlab', 'chrome', 'figma',
  'volume', 'volume-1', 'volume-x', 'voicemail', 'rss',
  'file', 'file-text', 'file-plus', 'file-minus', 'folder', 'folder-plus',
  'download', 'upload', 'external-link', 'share-2', 'save',
  'home', 'users', 'user-plus', 'user-minus', 'user-check',
  'life-buoy', 'help-circle', 'book-open', 'book', 'command',
  'disc', 'radio-tower'
];

function getCustomTypesFromStorage() {
  try {
    const raw = localStorage.getItem('bsm-custom-types');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse custom types:', e);
  }
  return { types: {}, rules: [] };
}

function saveCustomTypesToStorage(data) {
  localStorage.setItem('bsm-custom-types', JSON.stringify(data));
}

export async function renderCustomTypes(container) {
  await ensureRulesLoaded();

  const customData = getCustomTypesFromStorage();
  const customTypeIds = Object.keys(customData.types);
  const defaultTypeIds = Object.keys(SOUND_TYPES).filter(id => !customData.types[id]);

  // Get list of SDEFs from library
  const state = getState();
  const libraryData = state.libraryData;
  const allSdefs = libraryData
    ? libraryData.sections.flatMap(s => s.assets).map(a => a.sdefPath)
    : [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${getIcon('tag', 'w-5 h-5')} ${t('customTypesPage.title')}</h1>
      <p class="page-description">${t('customTypesPage.desc')}</p>
    </div>

    <!-- Stats -->
    <div class="stats-bar" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-value">${defaultTypeIds.length}</div>
        <div class="stat-label">${t('customTypesPage.stats.default')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--accent-blue);">${customTypeIds.length}</div>
        <div class="stat-label">${t('customTypesPage.stats.custom')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${customData.rules.length}</div>
        <div class="stat-label">${t('customTypesPage.stats.rules')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${allSdefs.length.toLocaleString()}</div>
        <div class="stat-label">${t('customTypesPage.stats.sdefs')}</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex-between" style="margin-bottom: 20px;">
      <h2 style="font-size: 18px; font-weight: 600;">${getIcon('layers', 'w-5 h-5')} ${t('customTypesPage.allTypesTitle')}</h2>
      <div class="flex-gap">
        <button class="btn btn-primary btn-sm" id="create-type-btn">${getIcon('plus', 'w-4 h-4')} ${t('customTypesPage.createBtn')}</button>
        <button class="btn btn-secondary btn-sm" id="import-types-btn">${getIcon('download', 'w-4 h-4')} ${t('customTypesPage.importBtn')}</button>
        <button class="btn btn-secondary btn-sm" id="export-types-btn">${getIcon('upload', 'w-4 h-4')} ${t('customTypesPage.exportBtn')}</button>
      </div>
    </div>

    <!-- Default Types Grid -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 1px;">
        ${getIcon('shield', 'w-3 h-3')} ${t('customTypesPage.defaultGridTitle')}
      </div>
      <div class="types-grid" id="default-types-grid">
        ${defaultTypeIds.map(id => renderTypeCard(id, SOUND_TYPES[id], false)).join('')}
      </div>
    </div>

    <!-- Custom Types Grid -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent-blue); margin-bottom: 12px; letter-spacing: 1px;">
        ${getIcon('star', 'w-3 h-3')} ${t('customTypesPage.customGridTitle')}
      </div>
      ${customTypeIds.length === 0 ? `
        <div class="empty-state" style="padding: 40px;">
          <div class="empty-state-icon">${getIcon('tag', 'icon-xl')}</div>
          <div class="empty-state-title">${t('customTypesPage.emptyTitle')}</div>
          <div class="empty-state-text">${t('customTypesPage.emptyDesc')}</div>
        </div>
      ` : `
        <div class="types-grid" id="custom-types-grid">
          ${customTypeIds.map(id => renderTypeCard(id, customData.types[id], true)).join('')}
        </div>
      `}
    </div>

    <!-- SDEF Assignment Section -->
    <div style="margin-bottom: 28px;">
      <div class="flex-between" style="margin-bottom: 12px;">
        <h2 style="font-size: 18px; font-weight: 600;">${getIcon('link', 'w-5 h-5')} ${t('customTypesPage.rulesTitle')}</h2>
        <button class="btn btn-secondary btn-sm" id="add-rule-btn">${getIcon('plus', 'w-4 h-4')} ${t('customTypesPage.addRuleBtn')}</button>
      </div>
      <div class="card" style="padding: 0;">
        <table class="data-table" style="width: 100%;">
          <thead>
            <tr>
              <th style="width: 50%;">${t('customTypesPage.table.regex')}</th>
              <th>${t('customTypesPage.table.assigned')}</th>
              <th style="width: 60px; text-align: center;">${t('customTypesPage.table.source')}</th>
              <th style="width: 80px; text-align: center;">${t('customTypesPage.table.actions')}</th>
            </tr>
          </thead>
          <tbody id="rules-table-body">
            ${renderRulesTable(customData)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderIcons(container);

  // Event handlers
  container.querySelector('#create-type-btn')?.addEventListener('click', () => showCreateTypeModal(container));
  container.querySelector('#import-types-btn')?.addEventListener('click', () => importTypes(container));
  container.querySelector('#export-types-btn')?.addEventListener('click', () => exportTypes());
  container.querySelector('#add-rule-btn')?.addEventListener('click', () => showAddRuleModal(container));

  // Type card actions
  container.querySelectorAll('[data-edit-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditTypeModal(btn.dataset.editType, container);
    });
  });

  container.querySelectorAll('[data-delete-type]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteType;
      const result = await showModal({
        title: t('customTypesPage.modals.deleteTypeTitle'),
        content: `<p>${t('customTypesPage.modals.deleteTypeDesc').replace('{id}', id)}</p>`,
        actions: [
          { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
          { id: 'delete', label: t('common.delete'), class: 'btn-danger' }
        ]
      });
      if (result === 'delete') {
        const data = getCustomTypesFromStorage();
        delete data.types[id];
        data.rules = data.rules.filter(r => r.type !== id);
        saveCustomTypesToStorage(data);
        await reloadRules();
        showToast(t('customTypesPage.toasts.deleted').replace('{id}', id), 'info');
        renderCustomTypes(container);
      }
    });
  });

  // Rule actions
  container.querySelectorAll('[data-delete-rule]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.deleteRule);
      const data = getCustomTypesFromStorage();
      data.rules.splice(idx, 1);
      saveCustomTypesToStorage(data);
      await reloadRules();
      showToast(t('customTypesPage.toasts.ruleDeleted'), 'info');
      renderCustomTypes(container);
    });
  });

  container.querySelectorAll('[data-edit-rule]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.editRule);
      showEditRuleModal(idx, container);
    });
  });

  // Share type button
  container.querySelectorAll('[data-share-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareType(btn.dataset.shareType);
    });
  });
}

function renderTypeCard(id, typeInfo, isCustom) {
  const iconHtml = getTypeIconHtml(typeInfo, 'w-6 h-6');
  const accentColor = isCustom ? 'var(--accent-blue)' : 'var(--text-muted)';

  return `
    <div class="type-card ${isCustom ? 'type-card-custom' : ''}" data-type-id="${id}">
      <div class="type-card-icon" style="color: ${accentColor};">
        ${iconHtml}
      </div>
      <div class="type-card-info">
        <div class="type-card-label">${typeInfo.label}</div>
        <div class="type-card-id">${id}</div>
        <div class="type-card-desc">${typeInfo.description || ''}</div>
      </div>
      <div class="type-card-actions">
        ${isCustom ? `
          <button class="btn-icon" data-edit-type="${id}" title="${t('common.edit')}">${getIcon('edit-2', 'w-3 h-3')}</button>
          <button class="btn-icon" data-share-type="${id}" title="Share">${getIcon('share-2', 'w-3 h-3')}</button>
          <button class="btn-icon danger" data-delete-type="${id}" title="${t('common.delete')}">${getIcon('trash-2', 'w-3 h-3')}</button>
        ` : `
          <span class="tag" style="font-size: 9px; opacity: 0.5;">${t('customTypesPage.table.builtIn')}</span>
        `}
      </div>
    </div>
  `;
}

function renderRulesTable(customData) {
  if (customData.rules.length === 0) {
    return `<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">${t('customTypesPage.table.noRules')}</td></tr>`;
  }

  return customData.rules.map((rule, idx) => {
    const typeInfo = SOUND_TYPES[rule.type];
    const iconHtml = typeInfo ? getTypeIconHtml(typeInfo, 'w-3 h-3') : getIcon('help-circle', 'w-3 h-3');
    const label = typeInfo ? typeInfo.label : rule.type;

    return `
      <tr>
        <td><code style="font-size: 12px; background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">${rule.match}</code></td>
        <td><span class="tag" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">${iconHtml} ${label}</span></td>
        <td style="text-align: center;"><span class="tag tag-blue" style="font-size: 9px;">Custom</span></td>
        <td style="text-align: center;">
          <div class="flex-gap" style="justify-content: center; gap: 8px;">
            <button class="btn btn-secondary btn-sm" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--bg-card); transition: all 0.2s; border: 1px solid var(--border-subtle);" data-edit-rule="${idx}" title="Edit">${getIcon('edit-2', 'w-4 h-4')}</button>
            <button class="btn btn-danger btn-sm" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; transition: all 0.2s;" data-delete-rule="${idx}" title="Delete">${getIcon('trash-2', 'w-4 h-4')}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function showCreateTypeModal(container) {
  let selectedIcon = 'tag';

  const iconGridHtml = AVAILABLE_ICONS.map(iconName => `
    <button class="icon-picker-item ${iconName === selectedIcon ? 'selected' : ''}" data-icon="${iconName}" title="${iconName}"
      style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle); border-radius: 6px; background: var(--bg-surface); cursor: pointer; transition: all 0.15s;">
      ${getIcon(iconName, 'w-4 h-4')}
    </button>
  `).join('');

  let typeIdVal = '';
  let typeLabelVal = '';
  let typeDescVal = '';
  let typeRuleVal = '';

  const result = await showModal({
    title: `${getIcon('plus', 'w-5 h-5')} ${t('customTypesPage.modals.createTitle')}`,
    content: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.typeId')}</label>
          <input type="text" class="input-field" id="new-type-id" placeholder="${t('customTypesPage.modals.typeIdPh')}" pattern="[a-z0-9_]+" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.label')}</label>
          <input type="text" class="input-field" id="new-type-label" placeholder="${t('customTypesPage.modals.labelPh')}" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.description')}</label>
          <input type="text" class="input-field" id="new-type-desc" placeholder="${t('customTypesPage.modals.descPh')}" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.icon')}</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div id="icon-preview" style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 2px solid var(--accent-blue); border-radius: 10px; color: var(--accent-blue);">
              ${getIcon('tag', 'w-6 h-6')}
            </div>
            <span id="icon-name-display" style="font-size: 13px; color: var(--text-muted); font-family: monospace;">tag</span>
          </div>
          <div style="max-height: 180px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;" id="icon-grid">
            ${iconGridHtml}
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.rule')}</label>
          <input type="text" class="input-field" id="new-type-rule" placeholder="${t('customTypesPage.modals.rulePh')}" />
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${t('customTypesPage.modals.ruleTip')}</div>
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
      { id: 'create', label: `${getIcon('plus', 'w-4 h-4')} ${t('customTypesPage.modals.create')}`, class: 'btn-primary' }
    ],
    onRender: (modalEl) => {
      // Icon picker
      modalEl.querySelectorAll('.icon-picker-item').forEach(btn => {
        btn.addEventListener('click', () => {
          modalEl.querySelectorAll('.icon-picker-item').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedIcon = btn.dataset.icon;
          const preview = modalEl.querySelector('#icon-preview');
          const nameDisplay = modalEl.querySelector('#icon-name-display');
          if (preview) preview.innerHTML = getIcon(selectedIcon, 'w-6 h-6');
          if (nameDisplay) nameDisplay.textContent = selectedIcon;
          renderIcons(preview);
        });
      });
    },
    onClose: (modalEl) => {
      typeIdVal = modalEl.querySelector('#new-type-id')?.value || '';
      typeLabelVal = modalEl.querySelector('#new-type-label')?.value || '';
      typeDescVal = modalEl.querySelector('#new-type-desc')?.value || '';
      typeRuleVal = modalEl.querySelector('#new-type-rule')?.value || '';
    }
  });

  if (result === 'create') {
    const id = typeIdVal.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const label = typeLabelVal.trim();
    const desc = typeDescVal.trim();
    const rule = typeRuleVal.trim();

    if (!id || !label) {
      showToast(t('customTypesPage.toasts.req'), 'warning');
      return;
    }

    if (SOUND_TYPES[id] || getCustomTypesFromStorage().types[id]) {
      showToast(t('customTypesPage.toasts.exists').replace('{id}', id), 'warning');
      return;
    }

    const data = getCustomTypesFromStorage();
    data.types[id] = {
      label,
      lucideIcon: selectedIcon,
      description: desc
    };

    if (rule) {
      data.rules.push({ match: rule, type: id });
    }

    saveCustomTypesToStorage(data);
    await reloadRules();
    showToast(t('customTypesPage.toasts.created').replace('{label}', label), 'success');
    renderCustomTypes(container);
  }
}

async function showEditTypeModal(typeId, container) {
  const customData = getCustomTypesFromStorage();
  const typeInfo = customData.types[typeId];
  if (!typeInfo) return;

  let selectedIcon = typeInfo.lucideIcon || 'tag';

  const iconGridHtml = AVAILABLE_ICONS.map(iconName => `
    <button class="icon-picker-item ${iconName === selectedIcon ? 'selected' : ''}" data-icon="${iconName}" title="${iconName}"
      style="width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-subtle); border-radius: 6px; background: var(--bg-surface); cursor: pointer; transition: all 0.15s;">
      ${getIcon(iconName, 'w-4 h-4')}
    </button>
  `).join('');

  let labelVal = '';
  let descVal = '';

  const result = await showModal({
    title: `${getIcon('edit-2', 'w-5 h-5')} ${t('customTypesPage.modals.editTitle')}: ${typeInfo.label}`,
    content: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.typeId')}</label>
          <input type="text" class="input-field" value="${typeId}" disabled style="opacity: 0.5;" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.label')}</label>
          <input type="text" class="input-field" id="edit-type-label" value="${typeInfo.label}" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.description')}</label>
          <input type="text" class="input-field" id="edit-type-desc" value="${typeInfo.description || ''}" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.icon')}</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div id="icon-preview" style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 2px solid var(--accent-blue); border-radius: 10px; color: var(--accent-blue);">
              ${getIcon(selectedIcon, 'w-6 h-6')}
            </div>
            <span id="icon-name-display" style="font-size: 13px; color: var(--text-muted); font-family: monospace;">${selectedIcon}</span>
          </div>
          <div style="max-height: 180px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;" id="icon-grid">
            ${iconGridHtml}
          </div>
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
      { id: 'save', label: `${getIcon('save', 'w-4 h-4')} ${t('common.save')}`, class: 'btn-primary' }
    ],
    onRender: (modalEl) => {
      modalEl.querySelectorAll('.icon-picker-item').forEach(btn => {
        btn.addEventListener('click', () => {
          modalEl.querySelectorAll('.icon-picker-item').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedIcon = btn.dataset.icon;
          const preview = modalEl.querySelector('#icon-preview');
          const nameDisplay = modalEl.querySelector('#icon-name-display');
          if (preview) preview.innerHTML = getIcon(selectedIcon, 'w-6 h-6');
          if (nameDisplay) nameDisplay.textContent = selectedIcon;
          renderIcons(preview);
        });
      });
    },
    onClose: (modalEl) => {
      labelVal = modalEl.querySelector('#edit-type-label')?.value || '';
      descVal = modalEl.querySelector('#edit-type-desc')?.value || '';
    }
  });

  if (result === 'save') {
    const label = labelVal.trim();
    const desc = descVal.trim();

    if (!label) {
      showToast(t('customTypesPage.toasts.reqLabel'), 'warning');
      return;
    }

    const data = getCustomTypesFromStorage();
    data.types[typeId] = {
      label,
      lucideIcon: selectedIcon,
      description: desc || ''
    };

    saveCustomTypesToStorage(data);
    await reloadRules();
    showToast(t('customTypesPage.toasts.updated').replace('{label}', label), 'success');
    renderCustomTypes(container);
  }
}

async function showAddRuleModal(container) {
  const allTypes = { ...SOUND_TYPES, ...getCustomTypesFromStorage().types };
  const typeOptions = Object.entries(allTypes).map(([id, info]) => {
    const iconHtml = getTypeIconHtml(info, 'w-3 h-3');
    return `<option value="${id}">${id} — ${info.label}</option>`;
  }).join('');

  let patternVal = '';
  let typeVal = '';

  const result = await showModal({
    title: `${getIcon('plus', 'w-5 h-5')} ${t('customTypesPage.modals.addRuleTitle')}`,
    content: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.regexField')}</label>
          <input type="text" class="input-field" id="new-rule-pattern" placeholder="e.g. rotor|blade|prop" />
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${t('customTypesPage.modals.regexTip')}</div>
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.assignTo')}</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div id="rule-type-preview" style="width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--accent-blue);">
              ${getTypeIconHtml(allTypes[Object.keys(allTypes)[0]], 'w-6 h-6')}
            </div>
            <select class="input-field" id="new-rule-type" style="flex: 1;">
              ${typeOptions}
            </select>
          </div>
        </div>
        <div class="tip-box" style="border-left-color: var(--accent-amber);">
          ${getIcon('alert-triangle', 'w-4 h-4')} ${t('customTypesPage.modals.ruleWarning')}
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
      { id: 'add', label: `${getIcon('plus', 'w-4 h-4')} ${t('customTypesPage.addRuleBtn')}`, class: 'btn-primary' }
    ],
    onRender: (modalEl) => {
      const select = modalEl.querySelector('#new-rule-type');
      const preview = modalEl.querySelector('#rule-type-preview');
      if (select && preview) {
        select.addEventListener('change', () => {
          const id = select.value;
          const info = allTypes[id];
          if (info) {
            preview.innerHTML = getTypeIconHtml(info, 'w-6 h-6');
            renderIcons(preview);
          }
        });
      }
    },
    onClose: (modalEl) => {
      patternVal = modalEl.querySelector('#new-rule-pattern')?.value || '';
      typeVal = modalEl.querySelector('#new-rule-type')?.value;
    }
  });

  if (result === 'add') {
    const pattern = patternVal.trim();
    const type = typeVal;

    if (!pattern) {
      showToast(t('customTypesPage.toasts.reqPattern'), 'warning');
      return;
    }

    // Validate regex
    try {
      new RegExp(pattern, 'i');
    } catch (e) {
      showToast(t('customTypesPage.toasts.invalidRegex') + e.message, 'error');
      return;
    }

    const data = getCustomTypesFromStorage();
    data.rules.push({ match: pattern, type });
    saveCustomTypesToStorage(data);
    await reloadRules();
    showToast(t('customTypesPage.toasts.ruleAdded'), 'success');
    renderCustomTypes(container);
  }
}

async function showEditRuleModal(idx, container) {
  const data = getCustomTypesFromStorage();
  const rule = data.rules[idx];
  if (!rule) return;

  const allTypes = { ...SOUND_TYPES, ...data.types };
  const typeOptions = Object.entries(allTypes).map(([id, info]) => `
    <option value="${id}" ${id === rule.type ? 'selected' : ''}>${id} — ${info.label}</option>
  `).join('');

  let patternVal = '';
  let typeVal = '';

  const result = await showModal({
    title: `${getIcon('edit-2', 'w-5 h-5')} ${t('customTypesPage.modals.editRuleTitle')}`,
    content: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.regexField')}</label>
          <input type="text" class="input-field" id="edit-rule-pattern" value="${rule.match}" />
        </div>
        <div class="input-group">
          <label class="input-label">${t('customTypesPage.modals.assignTo')}</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div id="rule-type-preview-edit" style="width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--accent-blue);">
              ${getTypeIconHtml(allTypes[rule.type], 'w-6 h-6')}
            </div>
            <select class="input-field" id="edit-rule-type" style="flex: 1;">
              ${typeOptions}
            </select>
          </div>
        </div>
      </div>
    `,
    actions: [
      { id: 'cancel', label: t('common.cancel'), class: 'btn-secondary' },
      { id: 'save', label: `${getIcon('save', 'w-4 h-4')} ${t('common.save')}`, class: 'btn-primary' }
    ],
    onRender: (modalEl) => {
      const select = modalEl.querySelector('#edit-rule-type');
      const preview = modalEl.querySelector('#rule-type-preview-edit');
      if (select && preview) {
        select.addEventListener('change', () => {
          const id = select.value;
          const info = allTypes[id];
          if (info) {
            preview.innerHTML = getTypeIconHtml(info, 'w-6 h-6');
            renderIcons(preview);
          }
        });
      }
    },
    onClose: (modalEl) => {
      patternVal = modalEl.querySelector('#edit-rule-pattern')?.value || '';
      typeVal = modalEl.querySelector('#edit-rule-type')?.value;
    }
  });

  if (result === 'save') {
    const pattern = patternVal.trim();
    const type = typeVal;

    if (!pattern) {
      showToast(t('customTypesPage.toasts.reqPattern'), 'warning');
      return;
    }

    try {
      new RegExp(pattern, 'i');
    } catch (e) {
      showToast(t('customTypesPage.toasts.invalidRegex') + e.message, 'error');
      return;
    }

    data.rules[idx] = { match: pattern, type };
    saveCustomTypesToStorage(data);
    await reloadRules();
    showToast(t('customTypesPage.toasts.ruleUpdated'), 'success');
    renderCustomTypes(container);
  }
}

function exportTypes() {
  const data = getCustomTypesFromStorage();
  if (Object.keys(data.types).length === 0 && data.rules.length === 0) {
    showToast(t('customTypesPage.toasts.noExport'), 'warning');
    return;
  }

  const exportData = {
    _info: {
      name: 'Custom Sound Types',
      exported: new Date().toISOString(),
      version: '1.0.0'
    },
    ...data
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'custom-sound-types.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('customTypesPage.toasts.exported'), 'success');
}

async function importTypes(container) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!imported.types && !imported.rules) {
        showToast(t('customTypesPage.toasts.invalidFile'), 'error');
        return;
      }

      const data = getCustomTypesFromStorage();
      if (imported.types) {
        Object.assign(data.types, imported.types);
      }
      if (Array.isArray(imported.rules)) {
        // Deduplicate by pattern+type
        for (const rule of imported.rules) {
          if (!data.rules.find(r => r.match === rule.match && r.type === rule.type)) {
            data.rules.push(rule);
          }
        }
      }

      saveCustomTypesToStorage(data);
      await reloadRules();

      const importedTypesCount = Object.keys(imported.types || {}).length;
      const importedRulesCount = (imported.rules || []).length;
      let toastMsg = t('customTypesPage.toasts.imported')
        .replace('{types}', importedTypesCount)
        .replace('{rules}', importedRulesCount);

      showToast(toastMsg, 'success');
      renderCustomTypes(container);
    } catch (err) {
      showToast(t('customTypesPage.toasts.importFailed') + ': ' + err.message, 'error');
    }
  };
  input.click();
}

function shareType(typeId) {
  const data = getCustomTypesFromStorage();
  const typeInfo = data.types[typeId];
  if (!typeInfo) return;

  // Get any rules associated with this type
  const typeRules = data.rules.filter(r => r.type === typeId);

  const shareData = {
    _info: {
      name: `Shared Sound Type: ${typeInfo.label}`,
      exported: new Date().toISOString()
    },
    types: { [typeId]: typeInfo },
    rules: typeRules
  };

  const json = JSON.stringify(shareData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `type_${typeId}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('customTypesPage.toasts.shared').replace('{label}', typeInfo.label), 'success');
}
