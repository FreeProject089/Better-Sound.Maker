#!/usr/bin/env node
/**
 * scripts/catalog.mjs — Validate or generate a Better Sound.Maker catalog.
 *
 *   node scripts/catalog.mjs validate [catalog.json]     (default: public/catalog.json)
 *   node scripts/catalog.mjs build <dir> [--out file]    (writes <dir>/catalog.json)
 *
 * `validate` checks the manifest, every preset and sound-type pack it lists,
 * plus the bundled public/sound-types packs. Exit code 1 on any error.
 * `build` scans <dir> for preset_*.json and sound-types/*.json and writes a manifest,
 * so the community repo only needs to drop files in and run it.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeCatalog, normalizePreset, normalizeSoundTypes } from '../src/catalog/schema.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [cmd = 'validate', target, ...rest] = process.argv.slice(2);

const readJson = async (p) => {
    const text = (await readFile(p)).toString('utf8').replace(/^\uFEFF/, '');
    return JSON.parse(text);
};

async function loadJsonUrl(url) {
    if (url.startsWith('file:')) return readJson(fileURLToPath(url));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

let problems = 0;
const report = (label, errors, fatal) => {
    for (const e of errors) console.log(`  ${fatal ? '✗' : '!'} ${label}: ${e}`);
    if (fatal) problems++;
};

async function validate(file) {
    const manifestPath = resolve(file || join(root, 'public/catalog.json'));
    console.log(`Catalog ${relative(process.cwd(), manifestPath)}`);
    const { value: catalog, errors } = normalizeCatalog(await readJson(manifestPath), pathToFileURL(manifestPath).href);
    report('manifest', errors, !catalog);
    if (!catalog) return;

    const names = new Set();
    for (const entry of catalog.presets) {
        try {
            const { value, errors: e } = normalizePreset(await loadJsonUrl(entry.url));
            report(entry.id, e, !value);
            if (value) {
                if (names.has(value.name)) report(entry.id, [`duplicate preset name "${value.name}"`], true);
                names.add(value.name);
                console.log(`  ✓ preset ${entry.id} — ${value.name} v${value.version} (#${value.UpdateNumber}, ${value.assetPaths.length} assets)`);
            }
        } catch (e) { report(entry.id, [e.message], true); }
    }

    let known = await bundledTypes();
    for (const entry of catalog.soundTypes) {
        try {
            const { value, errors: e } = normalizeSoundTypes(await loadJsonUrl(entry.url), known);
            report(entry.id, e, !value || e.length > 0);
            if (value) {
                known = { ...known, ...value.types };
                console.log(`  ✓ sound types ${entry.id} — ${Object.keys(value.types).length} types, ${value.rules.length} rules`);
            }
        } catch (e) { report(entry.id, [e.message], true); }
    }
}

/** Validates public/sound-types and returns the types they define. */
async function bundledTypes() {
    const dir = join(root, 'public/sound-types');
    const { files } = await readJson(join(dir, 'index.json'));
    let known = {};
    console.log('Bundled sound types');
    for (const f of files) {
        const { value, errors } = normalizeSoundTypes(await readJson(join(dir, f)), known);
        report(f, errors, !value || errors.length > 0);
        if (value) {
            known = { ...known, ...value.types };
            console.log(`  ✓ ${f} — ${Object.keys(value.types).length} types, ${value.rules.length} rules`);
        }
    }
    return known;
}

async function build(dir) {
    if (!dir) throw new Error('usage: build <dir> [--out file]');
    dir = resolve(dir);
    const outIdx = rest.indexOf('--out');
    const out = outIdx >= 0 ? resolve(rest[outIdx + 1]) : join(dir, 'catalog.json');
    const rel = (p) => relative(dirname(out), p).replace(/\\/g, '/');

    const walk = async (d) => (await readdir(d, { withFileTypes: true }))
        .flatMap((e) => (e.isDirectory() && !e.name.startsWith('.') ? [] : [join(d, e.name)]));
    const presetFiles = [];
    for (const d of [dir, join(dir, 'presets')].filter(existsSync)) {
        presetFiles.push(...(await walk(d)).filter((p) => /preset_.*\.json$/i.test(p)));
    }
    const typeDir = join(dir, 'sound-types');
    const typeFiles = existsSync(typeDir) ? (await walk(typeDir)).filter((p) => p.endsWith('.json')) : [];

    const manifest = {
        $schema: 'https://raw.githubusercontent.com/FreeProject089/Better-Sound.Maker/main/schemas/catalog.schema.json',
        schemaVersion: 1,
        name: 'Better Sound.Maker Community Catalog',
        presets: presetFiles.sort().map((p) => ({ url: rel(p) })),
        soundTypes: typeFiles.sort().map((p) => ({ url: rel(p) })),
    };
    await writeFile(out, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Wrote ${out} (${manifest.presets.length} presets, ${manifest.soundTypes.length} sound-type packs)`);
    await validate(out);
}

try {
    if (cmd === 'validate') await validate(target);
    else if (cmd === 'build') await build(target);
    else throw new Error(`unknown command "${cmd}"`);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
if (problems) {
    console.error(`\n${problems} problem(s) found.`);
    process.exit(1);
}
console.log('\nCatalog OK.');
