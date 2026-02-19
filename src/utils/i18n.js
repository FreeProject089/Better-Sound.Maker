
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

        // Determine info for available languages (like native name)
        availableLanguages = availableLanguages.map(lang => {
            const data = translations[lang.code];
            return {
                code: lang.code,
                name: data?._info?.name || lang.code.toUpperCase(),
                flag: data?._info?.flag || '🏳️'
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
