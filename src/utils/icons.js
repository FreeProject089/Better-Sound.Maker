/**
 * icons.js — Lucide icons rendered as inline SVG
 *
 * getIcon() returns the finished <svg> string, so an icon is visible the
 * moment its template is inserted (no empty <i> waiting for renderIcons) and
 * gets the size its class asks for: the Tailwind-style size classes used
 * across the app (w-3 h-3 … w-12 h-12) map to pixel sizes below.
 * renderIcons() stays for markup that still carries data-lucide attributes.
 */

import { createIcons, icons } from 'lucide/dist/cjs/lucide.js';

const SIZES = { 3: 12, 3.5: 14, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };
const DEFAULT_SIZE = 18;
const FALLBACK = 'Circle';

const toPascal = (name) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const escAttr = (s) => String(s).replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);

const cache = new Map();

export function renderIcons(root = document) {
    createIcons({
        icons,
        nameAttr: 'data-lucide',
        attrs: { class: 'lucide-icon', 'stroke-width': 1.75 },
        root,
    });
}

export function getIcon(name, className = '') {
    const key = `${name}|${className}`;
    const hit = cache.get(key);
    if (hit) return hit;

    const node = icons[toPascal(String(name))] || icons[FALLBACK];
    const sizeMatch = /(?:^|\s)w-(\d+(?:\.\d+)?)(?:\s|$)/.exec(className);
    const size = (sizeMatch && SIZES[sizeMatch[1]]) || DEFAULT_SIZE;
    const extra = className.replace(/(?:^|\s)[wh]-\d+(?:\.\d+)?(?=\s|$)/g, '').trim();
    const children = node
        .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${escAttr(v)}"`).join(' ')}/>`)
        .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide-${escAttr(name)}${extra ? ' ' + escAttr(extra) : ''}" aria-hidden="true">${children}</svg>`;
    cache.set(key, svg);
    return svg;
}
