# Update 1.1.0 — New engine, new tools

Better Sound.Maker now runs on Tauri instead of Electron: the installer is about ten times smaller, the app starts faster, and a long list of new tools makes building a sound mod quicker and safer.

> **Updating from 1.0.x:** the old Electron version can't update itself to this one. Download and run the new installer once; your projects, presets and settings are kept.

## Highlights

* **Listen like in game**: a *Listen* window plays your sound through its SDEF at any distance (cockpit, 10 m, 100 m, 1 km…), with the gain curve, pitch and filter applied.
* **A/B comparison**: switch instantly between your sound and the original, in sync. Works for every module sound readable in your DCS install (marked with a headphones icon in the Library).
* **Mini audio editor**: trim, fade in/out, gain, normalise, convert to mono and a loop crossfade that removes the click at the loop point — no need to leave BSM.
* **SDEF templates from DCS itself**: 15 templates by sound type and 44 by module (F-14, F-4E, AJS37, Mirage, MiG-21…), built from the values Eagle Dynamics and module makers really use. Apply one to a sound, to a whole aircraft folder, or to everything.
* **Ready for OVGME / Better Mods Manager**: build your mod as a package that mirrors Saved Games\DCS, or install it straight into your Mods\resource folder.

## New

* **Sound samples list** in the SDEF editor: drop audio files to add samples, play, attach, edit, reorder; library paths are suggested as you type.
* **Live SDEF checker**: typos (with suggestions), radius order, cone and play-mode conflicts are flagged as you edit; click a problem to jump to the field.
* **Distance curve** under the Radius parameters shows how loud the sound is at each distance.
* **New SDEF parameters** found in DCS's own files: `gain_random`, `pitch_random`, `cone_inner_gain`, `preload`, `looping`.
* **Pre-build check**: missing name, unsaved edits, SDEF errors, stereo sounds placed in 3D, and (on demand) clipping, silence and loop clicks in your audio.
* **Real OGG export** (desktop app): audio is now encoded to Ogg Vorbis instead of being renamed.
* **Undo / redo** with Ctrl+Z and Ctrl+Y for the selection, SDEFs, project and presets.
* **Command palette** (Ctrl+K): jump to any page, action, project sound or help article.
* **Crash logs**: one file with everything needed to debug a problem — Ctrl+Shift+L, the bug button in the sidebar, or Settings → Diagnostics. Errors are saved automatically in the desktop app. No secrets are ever written.
* **Community catalog** loaded from a `catalog.json` link (configurable in Settings), with an offline copy and the bundled catalog as fallbacks.
* **GitHub collaboration rebuilt**: one commit per push, only changed files sent, the repository is itself a working mod, live status (local / team changes), history with restore, team notes.
* **DCS auto-detection** on every drive (the newest install is picked) and an updated sound list (June 2026).

## Improved

* **New look** in the style of Better Mods Manager: one consistent dialog design, crisp icons at the right size, refreshed buttons, fields, cards and notifications.
* **Start-up screen** and **Tasky's tour** redone: the tour spotlights each part of the app, in English or French, and can be replayed from Help.
* **Documentation and F.A.Q** rebuilt: searchable help centre with 13 articles and 22 questions, plus a full documentation website.
* **Template manager** redesigned: tabs (mine / by type / by module), search, and a clear "apply to" choice.
* **Updates**: installed with the new installer, BSM updates itself (signed, with rollback); NSIS and MSI installers are also available.

## Fixed

* Unset `auto_width` / `nodoppler` were written as `false`, turning Doppler on for every SDEF saved from the visual editor.
* Numbers like `gain = 1.0` were read as text; Lua block comments `--[[ … ]]` were read as parameters; unknown keys were dropped on save.
* `entry.lua` text was not fully escaped (backslashes, line breaks).
* Pulling a project from GitHub never brought the audio back.
* The Settings folder picker kept only the first letter of the path.
* Several raw translation keys and untranslated dialogs (template manager, updates).
* Library loop / one-shot badges wrapped on two lines.
