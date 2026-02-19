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
 *
 * A section can be a module path like "CoreMods/aircraft/C130J:"
 * In those cases, we keep the sdef path as-is (contextual to the mod).
 * Wave paths with a leading "/" are normalized (slash stripped).
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

        // Skip empty lines — push pending asset
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

        // Section header (e.g., "DCS World:" or "CoreMods/aircraft/C130J:")
        if (trimmed.endsWith(':') && !line.startsWith('\t') && !trimmed.startsWith('wave')) {
            // Save previous asset if pending
            if (currentAsset && currentSection) {
                currentSection.assets.push(currentAsset);
                currentAsset = null;
            }
            const sectionName = trimmed.slice(0, -1);
            currentSection = {
                name: sectionName,
                // Extract module prefix for disambiguation (e.g. "CoreMods/aircraft/C130J" → "C130J")
                modPrefix: sectionName.includes('/') ? sectionName : '',
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

        // Wave path (double-tab indented) — normalize leading slash
        if (line.startsWith('\t\t') && inWaveBlock && currentAsset) {
            // Remove leading "/" if present (some mod entries use "/Effects/...")
            const wavePath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
            currentAsset.waves.push(wavePath);
            continue;
        }

        // SDEF entry (no leading whitespace)
        if (!line.startsWith('\t') && currentSection) {
            // Save previous asset
            if (currentAsset) {
                currentSection.assets.push(currentAsset);
            }

            // sdefPath as written in the file
            let sdefPath = trimmed;

            // For mod sections, qualify the sdef path with the section name so it's unique searchable
            // e.g. "CoreMods/aircraft/C130J" + "Aircrafts/apu_run.sdef"
            let displaySection = '';
            if (currentSection.modPrefix) {
                // Last part of section path is the mod name (C130J, FA-18C, etc.)
                const parts = currentSection.modPrefix.split('/');
                displaySection = parts[parts.length - 1];
            }

            const pathParts = sdefPath.replace(/\.sdef$/, '').split('/');
            const name = pathParts[pathParts.length - 1];

            // Category hierarchy
            let category = '';
            let subcategory = '';
            let group = '';

            if (displaySection) {
                // For mods: category = module name, subcategory = first path segment
                category = displaySection;
                if (pathParts.length >= 2) {
                    subcategory = pathParts[0];
                }
                if (pathParts.length >= 3) {
                    group = pathParts.slice(1, -1).join('/');
                }
            } else {
                if (pathParts.length >= 2) {
                    category = pathParts[0];
                }
                if (pathParts.length >= 3) {
                    subcategory = pathParts[1];
                }
                if (pathParts.length >= 4) {
                    group = pathParts.slice(2, -1).join('/');
                }
            }

            currentAsset = {
                sdefPath,
                sectionName: currentSection.name,
                displaySection,
                category,
                subcategory,
                group,
                name,
                waves: [],
                fullPath: pathParts.join('/')
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
            a.sectionName?.toLowerCase().includes(q) ||
            a.displaySection?.toLowerCase().includes(q) ||
            a.waves.some(w => w.toLowerCase().includes(q))
        );
    }

    return filtered;
}
