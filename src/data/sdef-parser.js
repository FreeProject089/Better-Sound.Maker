/**
 * sdef-parser.js — Parse sdef_and_wave_list.txt into structured data
 *
 * Format of the file:
 *   SectionName:        (line ending with ":")
 *   =====              (underline — separator)
 *   <blank line>
 *   SdefPath.sdef       (no leading whitespace, ends with .sdef)
 *     wave:             (tab + "wave:")
 *       Effects/path    (tab tab + wave path)
 */

export function parseSdefList(text) {
    const lines = text.split(/\r?\n/);
    const sections = [];
    let currentSection = null;
    let currentAsset = null;
    let inWaveBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) {
            if (currentAsset && currentSection) {
                currentSection.assets.push(currentAsset);
                currentAsset = null;
            }
            inWaveBlock = false;
            continue;
        }

        // Section separator (===)
        if (/^=+$/.test(trimmed)) {
            continue;
        }

        // Section header (e.g., "DCS World:" or "Mods/terrains/Normandy:")
        if (trimmed.endsWith(':') && !line.startsWith('\t') && !trimmed.startsWith('wave')) {
            // Save previous asset if pending
            if (currentAsset && currentSection) {
                currentSection.assets.push(currentAsset);
                currentAsset = null;
            }
            currentSection = {
                name: trimmed.slice(0, -1),
                assets: []
            };
            sections.push(currentSection);
            inWaveBlock = false;
            continue;
        }

        // Wave label
        if (line.startsWith('\t') && trimmed === 'wave:') {
            inWaveBlock = true;
            continue;
        }

        // Wave path (double tab indented)
        if (line.startsWith('\t\t') && inWaveBlock && currentAsset) {
            currentAsset.waves.push(trimmed);
            continue;
        }

        // SDEF entry (no leading whitespace, typically ends with .sdef)
        if (!line.startsWith('\t') && currentSection) {
            // Save previous asset
            if (currentAsset) {
                currentSection.assets.push(currentAsset);
            }

            const sdefPath = trimmed;
            const parts = sdefPath.replace(/\.sdef$/, '').split('/');
            const name = parts[parts.length - 1];

            // Extract category hierarchy
            let category = '';
            let subcategory = '';
            let group = '';

            if (parts.length >= 2) {
                category = parts[0];
            }
            if (parts.length >= 3) {
                subcategory = parts[1];
            }
            if (parts.length >= 4) {
                group = parts.slice(2, -1).join('/');
            }

            currentAsset = {
                sdefPath,
                category,
                subcategory,
                group,
                name,
                waves: [],
                fullPath: parts.join('/')
            };
            inWaveBlock = false;
        }
    }

    // Don't forget last asset
    if (currentAsset && currentSection) {
        currentSection.assets.push(currentAsset);
    }

    return { sections };
}

/**
 * Build a category tree from assets for the sidebar
 */
export function buildCategoryTree(assets) {
    const tree = {};

    for (const asset of assets) {
        const cat = asset.category || 'Other';
        if (!tree[cat]) {
            tree[cat] = { count: 0, children: {} };
        }
        tree[cat].count++;

        if (asset.subcategory) {
            const subcat = asset.subcategory;
            if (!tree[cat].children[subcat]) {
                tree[cat].children[subcat] = { count: 0 };
            }
            tree[cat].children[subcat].count++;
        }
    }

    return tree;
}

/**
 * Filter assets by search query and category
 */
export function filterAssets(assets, { query = '', category = '', subcategory = '' } = {}) {
    let filtered = assets;

    if (category) {
        filtered = filtered.filter(a => a.category === category);
    }

    if (subcategory) {
        filtered = filtered.filter(a => a.subcategory === subcategory);
    }

    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(a =>
            a.sdefPath.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.waves.some(w => w.toLowerCase().includes(q))
        );
    }

    return filtered;
}
