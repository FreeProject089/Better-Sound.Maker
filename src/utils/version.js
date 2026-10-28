/**
 * src/utils/version.js — Version source of truth
 *
 * The version comes from package.json at build time (Vite inlines the JSON
 * import), the same file tauri.conf.json and scripts/release.ps1 read, so a
 * release only bumps package.json.
 */

import pkg from '../../package.json';

export const APP_VERSION = pkg.version;
export const GITHUB_REPO = 'FreeProject089/Better-Sound.Maker';
