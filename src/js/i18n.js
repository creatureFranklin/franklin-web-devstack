/**
 * i18n.js – runtime translation helper
 *
 * Translations are injected into the page as window.__i18n by build-i18n.mjs.
 * Import this module and call t('dot.notation.key') anywhere in your JS.
 *
 * @example
 *   import { t } from './i18n.js';
 *   button.textContent = t('hero.button');
 */

const translations = (typeof window !== 'undefined' && window.__i18n) ? window.__i18n : {};

/**
 * Resolve a dot-notation key against the current locale's translations.
 * Returns the key itself when not found (never throws).
 *
 * @param   {string} key  - e.g. "hero.button" or "devCommands.heading"
 * @returns {string}
 */
export function t(key) {
    const parts = key.split('.');
    let cur = translations;
    for (const part of parts) {
        if (cur === null || typeof cur !== 'object' || !(part in cur)) {
            console.warn(`[i18n] missing key: "${key}"`);
            return key;
        }
        cur = cur[part];
    }
    return String(cur);
}

/**
 * Returns the active locale code (e.g. "cs", "en").
 * Falls back to the <html lang="..."> attribute, then "en".
 *
 * @returns {string}
 */
export function locale() {
    if (translations.lang) return String(translations.lang);
    return document.documentElement.lang || 'en';
}
