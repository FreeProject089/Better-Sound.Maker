# Troubleshooting

Real failure modes, taken from the messages and fallbacks in the code. Messages are quoted as the app
shows them (English UI).

## Library

| Symptom | Cause | Fix |
|---|---|---|
| *Could not find base list in Doc/Sounds/sdef_and_wave_list.txt* | the DCS path is wrong or empty. When empty, the scanner only tries `C:/Program Files/Eagle Dynamics/DCS World` | set the DCS install folder in *Settings* (the folder that contains `Doc/` and `CoreMods/`); the CoreMods scan still continues |
| Auto-scan at start does nothing | auto-scan needs *Auto scan* on, a DCS path, and the desktop app; failures are only logged to the console (`Auto-scan failed`) | check the path, then scan manually from the Library |
| The library shows a generic list, not my install | you are in the browser build: it loads the bundled `public/sdef_and_wave_list.txt` | use the desktop app to read your own install |
| *Failed to load asset library: …* | the library could not be fetched or parsed | reload; in the browser, check the page is served (not opened as a file) |
| *No valid .sdef files found in this mod zip* | the imported zip has no `.sdef` files | check the archive contains `Sounds/sdef/…` |

## Audio

| Symptom | Cause | Fix |
|---|---|---|
| An asset lost its audio after restart (desktop) | the original file was moved or deleted; the app only keeps its path | re-assign the file |
| An asset lost its audio (browser) | site data / IndexedDB was cleared | re-assign the file |
| You chose *ogg* but got `.wav` files | the web build has no Vorbis encoder (or the native encoder failed: see the console); WAV is written instead, under a `.wav` name | build from the desktop app |
| *WAV conversion failed, using original* (console) | the browser could not decode the source | convert the file yourself |

## Build

| Symptom | Cause | Fix |
|---|---|---|
| *Export cancelled by user* | the folder picker was closed | pick a folder |
| The browser downloads a `.zip` instead of writing a folder | the browser lacks the File System Access API (Firefox, Safari) | unzip it in `Saved Games/DCS/Mods/…`, or use Chrome/Edge or the desktop app |
| DCS lists the mod but the sound does not change | SDEF not under `Sounds/sdef/Effects/`, wrong wave path, or a silent SDEF | rebuild with BSM; check the lint panel for `No wave and no inherit` and wave path warnings |

See [Mod build](../how-it-works/mod-build.md) for the exact layout.

## SDEF editor

Lint errors and warnings are listed with their meaning in the
[parameter reference](sdef-parameters.md#lint-messages). Two common surprises:

- **Sound heard far too far away**: only `inner_radius` is set, so DCS derives `outer_radius = inner_radius / 0.001`. Set `outer_radius` too.
- **Cone has no effect**: `direction` is `{0, 0, 0}`.

## Community catalog

| Symptom | Cause | Fix |
|---|---|---|
| Presets are old, or come from a "cache" | the remote catalog was unreachable; the app used the last good copy, or the bundled one | check your connection; *Settings → Test* reports the errors |
| No community presets at all | `DisableCommunityPresets = true` at build time, or remote, cache and bundled catalogs all failed | see the `[Catalog]` warnings in the console |
| A preset or pack is missing | it failed validation and was skipped | run `node scripts/catalog.mjs validate <catalog.json>` |
| My custom catalog URL is ignored offline | the legacy GitHub fallback only applies to the default URL; a custom URL falls back to the cache, then the bundled catalog | — |

## Updates

| Symptom | Cause | Fix |
|---|---|---|
| *Could not reach update server. The repo might be private or renamed.* | all three GitHub URLs failed (offline, rate-limited) | retry later |
| BetterInstaller install updates through the "standard updater" | `--check-update` failed (for example an expired `update.json`), so the Tauri updater was used | maintainers: re-sign `update.json` ([Release](release.md)) |
| *Update failed, trying the standard updater...* | `uninstall.exe --update` could not start | the app falls back automatically; otherwise download the installer from the releases page |
| *Update failed, opening the releases page.* | the Tauri updater could not download or install | install the new version manually |
| Clicking *update* shows *Updates Disabled* | `DisableAutoUpdate = true` in `Load.cfg` | check the releases page manually |

## Browser vs desktop

The browser build cannot read your DCS install, scan CoreMods or Saved Games, keep audio by path,
write a folder in Firefox/Safari, or update itself. See the table in
[Desktop bridge](../how-it-works/desktop-bridge.md#in-the-browser).
