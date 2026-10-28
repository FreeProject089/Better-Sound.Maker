# Changelog

All notable changes to Better Sound.Maker. The full, user-facing notes for each
version are in [`Update/.md/`](Update/.md/) (shown in the app under *What's New*).

## [1.1.0] — 2026-10-28

Full notes: [PATCH_NOTES_v1.1.0.md](Update/.md/PATCH_NOTES_v1.1.0.md)

### Changed
- Desktop shell moved from Electron to **Tauri v2** (Rust backend); installers drop from ~80 MB to ~8 MB.
- **BetterInstaller** is the main installer (signed `.bpkg`, update with rollback); NSIS and MSI kept as backups. Update chain: BetterInstaller → Tauri updater (NSIS/MSI) → GitHub releases page.
- New UI in the Better Mods Manager style: design tokens, one modal shell, inline SVG icons at their real size, toasts with actions.
- Start-up screen and Tasky's tour rebuilt (spotlight tour, EN/FR, resumable).
- Documentation and F.A.Q pages rebuilt; new documentation website (MkDocs, EN/FR) with technical docs.
- GitHub collaboration rewritten on the Git Data API: one commit per push, changed files only, repo = working mod, sync status, history, notes.
- Community catalog loaded from a remote `catalog.json` (setting + `Load.cfg`), with offline cache and bundled fallback; normalised JSON schemas and `scripts/catalog.mjs`.
- Dev server on port 1430.

### Added
- SDEF editor: sound samples list, live checker, attenuation curve, ED parameters (`gain_random`, `pitch_random`, `cone_inner_gain`, `preload`, `looping`).
- SDEF templates generated from DCS module files (15 by type, 44 by module) — `npm run templates:build "<DCS>"`, or *Rebuild from my DCS* in the app.
- Template manager redesign; apply to current SDEF, a module folder, or all.
- Mini audio editor (trim, fades, gain, normalise, mono, loop crossfade).
- *Listen* window: distance simulation and A/B against readable DCS originals (index of module sounds; `Sounds.edce` is not read).
- Pre-build check; OVGME / Better Mods Manager package layout; direct install to `Mods\resource`.
- Real Ogg Vorbis encoding (Rust, libvorbis).
- Undo / redo (Ctrl+Z / Ctrl+Y), command palette (Ctrl+K).
- Crash logs: console/error capture, Rust panic hook, report generator (Ctrl+Shift+L, sidebar, Settings → Diagnostics).
- DCS install detection on every drive; bundled `sdef_and_wave_list.txt` updated.
- `TypeDetection = false` in `Load.cfg` now disables smart sound-type labels.

### Fixed
- Unset `auto_width` / `nodoppler` written as `false` (Doppler turned on).
- `1.0`-style numbers parsed as strings; Lua block comments parsed as keys; unknown SDEF keys dropped on save.
- `entry.lua` escaping (backslashes, newlines, version).
- GitHub pull never restored audio.
- Settings folder picker kept only the first character of the path.
- UTF-16 `sound-types/index.json` silently ignored.
- Missing translation keys shown raw; hard-coded FR/EN dialogs; unescaped community preset names.

## [1.0.10]
- SDEF export path fix (`Sounds/sdef/Effects/`), XSS and Electron sandbox hardening. See [PATCH_NOTES_v1.0.10.md](Update/.md/PATCH_NOTES_v1.0.10.md).
