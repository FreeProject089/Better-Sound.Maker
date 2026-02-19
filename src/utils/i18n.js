
/**
 * i18n.js — Internationalization utility
 * Handles loading locales, translating strings, and language switching.
 */

import { getState, subscribe } from '../state/store.js';

// State
let currentLang = localStorage.getItem('dcs-sound-mod-creator::language') || 'en';
let translations = {};
let availableLanguages = [];

/**
 * Initialize i18n system
 * Loads all locale files from src/locales/*.json
 */
export async function initI18n() {
    try {
        // Vite glob import to get all json files in locales
        const modules = import.meta.glob('../locales/*.json');

        // Process available languages
        availableLanguages = [];
        const loadPromises = [];

        for (const path in modules) {
            const match = path.match(/\/([\w-]+)\.json$/);
            if (match) {
                const langCode = match[1];
                availableLanguages.push({
                    code: langCode,
                    // We'll load the name from the file itself later if needed, 
                    // for now we can derive or map it.
                    // But let's load the content to get the "languageName" key if present
                });

                loadPromises.push(modules[path]().then(mod => {
                    translations[langCode] = mod.default || mod; // Handle default export or direct json
                }));
            }
        }

        await Promise.all(loadPromises);

        // Flag SVGs for platforms that don't support unicode flags (Windows Chrome/Electron)
        const FLAG_SVGS = {
            'en': `<svg viewBox="0 0 640 480" width="18" height="14" style="border-radius:2px"><path fill="#012169" d="M0 0h640v480H0z"/><path fill="#FFF" d="m75 0 245 180L565 0h75v55L400 240l240 175v65h-75L320 300 75 480H0v-55l240-175L0 75V0h75z"/><path fill="#C8102E" d="m424 286 216 154v40L394 316l30-30zM501 0 320 131 139 0h78l103 75L423 0h78zM0 440l216-154 30 30L30 480H0v-40zM0 0l239 174-30 30L0 55V0z"/><path fill="#FFF" d="M240 0v480h160V0H240zM0 160v160h640V160H0z"/><path fill="#C8102E" d="M0 192v96h640v-96H0zM272 0v480h96V0h-96z"/></svg>`,
            'fr': `<svg viewBox="0 0 640 480" width="18" height="14" style="border-radius:2px"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#002395" d="M0 0h213.3v480H0z"/><path fill="#ed2939" d="M426.7 0H640v480H426.7z"/></svg>`
        };

        // Determine info for available languages (like native name)
        availableLanguages = availableLanguages.map(lang => {
            const data = translations[lang.code];
            return {
                code: lang.code,
                name: data?._info?.name || lang.code.toUpperCase(),
                flag: FLAG_SVGS[lang.code] || data?._info?.flag || '🏳️'
            };
        });

        console.log('i18n initialized. Available:', availableLanguages);

        // Apply current language
        await changeLanguage(currentLang, false); // false = don't reload yet, just set data

    } catch (err) {
        console.error('Failed to initialize i18n:', err);
        // Fallback?
    }
}

/**
 * Get translation for a key
 * @param {string} key - Dot notation key (e.g. "home.title")
 * @param {object} params - Key-value pairs for interpolation
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
    const keys = key.split('.');
    let value = translations[currentLang];

    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            // Fallback to English if missing
            if (currentLang !== 'en' && translations['en']) {
                let fallback = translations['en'];
                for (const fbK of keys) {
                    if (fallback && fallback[fbK] !== undefined) {
                        fallback = fallback[fbK];
                    } else {
                        return key; // Not found in En either
                    }
                }
                value = fallback; // Found in fallback
                break; // Exit loop with fallback value
            } else {
                return key; // Not found
            }
        }
    }

    if (typeof value !== 'string') return key;

    // Interpolate
    return value.replace(/\{(\w+)\}/g, (_, v) => params[v] !== undefined ? params[v] : `{${v}}`);
}

/**
 * Change current language
 * @param {string} lang - Language code (e.g. 'en', 'fr')
 * @param {boolean} triggerUpdate - Whether to trigger DOM update
 */
export async function changeLanguage(lang, triggerUpdate = true) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not found.`);
        return;
    }

    currentLang = lang;
    localStorage.setItem('dcs-sound-mod-creator::language', lang);

    if (triggerUpdate) {
        updateTranslations();
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    // Set html lang attribute
    document.documentElement.lang = lang;
}

/**
 * Update all elements with data-i18n attribute
 */
export function updateTranslations(container = document) {
    container.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const params = el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : {};

        // Handle attributes (e.g. [placeholder]key)
        if (key.startsWith('[')) {
            const matches = key.match(/^\[([^\]]+)\](.*)$/);
            if (matches) {
                const attr = matches[1];
                const realKey = matches[2];
                el.setAttribute(attr, t(realKey, params));
            }
        } else {
            // Standard text content
            el.textContent = t(key, params);
        }
    });

    // Also update placeholders specifically marked if using simple key
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    container.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

/**
 * Get list of available languages
 */
export function getAvailableLanguages() {
    return availableLanguages;
}

/**
 * Get current language code
 */
export function getCurrentLanguage() {
    return currentLang;
}

// Auto-init on import (or call explicitly in main.js)
// initI18n(); 
