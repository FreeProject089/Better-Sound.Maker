#!/usr/bin/env node
/**
 * Build public/templates/dcs-templates.json from a DCS install, and refresh
 * public/sdef_and_wave_list.txt with that install's copy.
 *
 *   node scripts/build-sdef-templates.mjs "E:/DCS World"
 *
 * Reads every .sdef under <DCS>/CoreMods/<cat>/<module>/Sounds/sdef and
 * <DCS>/Mods/<cat>/<module>/Sounds/sdef (base-game SDEFs are packed in
 * Sounds.edce and can't be read). Only parameter values are kept.
 */

import { readFile, readdir, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTemplates, CATEGORY_RULES } from '../src/utils/sdef-stats.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dcs = process.argv[2];
if (!dcs || !existsSync(dcs)) { console.error('usage: build-sdef-templates.mjs <DCS install folder>'); process.exit(1); }


async function* walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* walk(p);
        else if (e.name.toLowerCase().endsWith('.sdef')) yield p;
    }
}

const files = [];
for (const top of ['CoreMods', 'Mods']) {
    const base = join(dcs, top);
    if (!existsSync(base)) continue;
    for (const cat of await readdir(base, { withFileTypes: true })) {
        if (!cat.isDirectory()) continue;
        for (const mod of await readdir(join(base, cat.name), { withFileTypes: true })) {
            const sdefDir = join(base, cat.name, mod.name, 'Sounds', 'sdef');
            if (!mod.isDirectory() || !existsSync(sdefDir)) continue;
            for await (const f of walk(sdefDir)) {
                files.push({ module: mod.name, path: relative(sdefDir, f).replace(/\\/g, '/'), text: await readFile(f, 'utf8') });
            }
        }
    }
}

const pack = buildTemplates(files, CATEGORY_RULES);
await mkdir(join(root, 'public/templates'), { recursive: true });
await writeFile(join(root, 'public/templates/dcs-templates.json'), JSON.stringify(pack, null, 1) + '\n');
console.log(`${files.length} SDEFs → ${pack.byType.length} type templates, ${pack.byModule.length} module templates`);

const list = join(dcs, 'Doc/Sounds/sdef_and_wave_list.txt');
if (existsSync(list)) {
    await copyFile(list, join(root, 'public/sdef_and_wave_list.txt'));
    console.log(`sdef_and_wave_list.txt updated (${((await stat(list)).size / 1048576).toFixed(1)} MB)`);
}
