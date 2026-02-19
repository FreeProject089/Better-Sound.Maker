import { createIcons, icons } from 'lucide/dist/cjs/lucide.js';

export function renderIcons(root = document) {
    createIcons({
        icons,
        nameAttr: 'data-lucide',
        attrs: {
            class: "lucide-icon"
        },
        root
    });
}

export function getIcon(name, className = '') {
    return `<i data-lucide="${name}" class="${className}"></i>`;
}
