<div align="center">

  <img src=".github/screenshots/sdef-editor.png" alt="Better Sound.Maker 1.1.0" width="100%" />

  # Better Sound.Maker

  **Create DCS World sound mods: pick the sounds, drop your audio, tune, listen, build.**

  ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg?style=flat-square)
  ![License](https://img.shields.io/badge/license-Apache--2.0-green.svg?style=flat-square)
  ![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-important?style=flat-square)
  ![Rust](https://img.shields.io/badge/built%20with-Rust-orange?style=flat-square&logo=rust)
  ![Tauri](https://img.shields.io/badge/framework-Tauri%20v2-24C8D8?style=flat-square&logo=tauri)

  [Download](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest) •
  [Documentation](https://freeproject089.github.io/Better-Sound.Maker/) •
  [Discord](https://discord.gg/CTaaEF9R75) •
  [Ko-fi](https://ko-fi.com/I2I31ZIPPG) •
  [Français](README_FR.md)

</div>

---

## What it is

DCS never plays an audio file directly: it plays a **sound definition** (`.sdef`) that says which
audio to use and how — volume, pitch, distance, cone, loop. A sound mod ships SDEFs with the
**same names** as the game's, plus your audio, and DCS uses yours instead.

Better Sound.Maker (BSM) builds all of that for you. The **Library** lists every DCS sound; you
tick the ones to replace, drop your `.wav` / `.ogg` in **Projects**, tune them in the
**SDEF editor** and press **Build**. Nothing in your DCS installation is ever modified: the mod
goes to `Saved Games\DCS\Mods\resource`, and removing that folder undoes everything.

## Screenshots

| | |
|---|---|
| ![Assets Library](.github/screenshots/library.png) **Assets Library**: every DCS sound, a folder tree, search, sound types and loop / one-shot tags. | ![SDEF editor](.github/screenshots/sdef-editor.png) **SDEF editor**: sound samples you can drop, play, edit and reorder; a live checker above. |
| ![Distance curve](.github/screenshots/curve.png) **Distance curve**: how loud the sound is at each distance, from DCS's own formula. | ![Listen and A/B](.github/screenshots/listen.png) **Listen & A/B**: hear it at 10 m, 100 m or 1 km; switch with the original in sync. |
| ![SDEF templates](.github/screenshots/templates.png) **Templates**: values used by Eagle Dynamics and module makers, by sound type or by module. | ![Mod Generator](.github/screenshots/build.png) **Mod Generator**: pre-build check, audio format, plain / OVGME / direct install. |

<p align="center"><img src=".github/screenshots/docs.png" alt="In-app documentation" width="70%" /><br/><sub>The in-app help centre: short guides, the SDEF reference and troubleshooting, in English and French.</sub></p>

## Features

- **Assets Library**: every sound listed in DCS's `sdef_and_wave_list.txt`, your CoreMods and installed mods; folder tree, search, filters, sound-type detection.
- **SDEF editor**: visual and raw modes kept in sync; every documented parameter plus the ones found in ED's own files (`gain_random`, `pitch_random`, `cone_inner_gain`, `preload`, `looping`).
- **Live checker**: typos with suggestions, radius order, cone and play-mode conflicts — click a problem to jump to the field.
- **Templates from DCS**: 15 by sound type and 44 by module, built from the 17,000+ module SDEFs of a DCS install; apply to one sound, an aircraft folder or the whole project.
- **Mini audio editor**: trim, fades, gain, normalise, mono, and a loop crossfade that removes the click at the loop point.
- **Listen & A/B**: distance simulation with the SDEF's gain curve, pitch and filter; instant A/B against the original for every module sound readable in your DCS.
- **Build**: pre-build check (missing audio, SDEF errors, stereo in 3D, clipping, loop clicks); WAV, original or real Ogg Vorbis; plain folder, **OVGME / Better Mods Manager** package, or direct install.
- **Presets & community catalog**: save selections, share them, install ready-made ones, get notified of updates.
- **GitHub collaboration**: one commit per push, the repository is itself a working mod, history with restore, team notes.
- **Quality of life**: undo / redo (Ctrl+Z / Ctrl+Y), command palette (Ctrl+K), Tasky's guided tour, crash logs (Ctrl+Shift+L), English and French.

## What's new in 1.1.0

The full list is in the [1.1.0 patch notes](Update/.md/PATCH_NOTES_v1.1.0.md) and the [changelog](CHANGELOG.md). The highlights:

- **New engine**: Tauri v2 instead of Electron — the installer is about ten times smaller and the app starts faster.
- **Listen like in game** and **A/B comparison** with the original sound.
- **Mini audio editor** and **SDEF templates generated from DCS** (by type and by module).
- **Ready for OVGME / Better Mods Manager**, or install straight into `Mods\resource`.
- **Live SDEF checker**, distance curve, pre-build check, real OGG export, undo / redo, command palette, crash logs.
- **New look** in the Better Mods Manager style, new start-up screen and tour, rebuilt documentation.
- **Fixed**: SDEFs saved from the visual editor turned Doppler on; several parsing and escaping bugs; GitHub pull without audio.

## Install

1. Download **`Better.Sound.Maker.Setup.1.1.0.exe`** from the [latest release](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest).
2. Run it. Windows may show SmartScreen the first time: **More info → Run anyway**.
3. Launch Better Sound.Maker and point it at your DCS folder (it finds it on its own on most PCs).

Requirements: Windows 10 or 11 with WebView2 (present on Windows 11 and up-to-date Windows 10).
The setup is built with [BetterInstaller](https://github.com/FreeProject089/BetterInstaller): it
checks the package's Ed25519 signature before writing anything, installs per user, and handles
updates with rollback. NSIS (`…_x64-nsis-setup.exe`) and MSI (`…_x64.msi`) installers are on the
same page if you prefer them.

**Updating**

| You have | What to do |
|---|---|
| 1.1.0 or later | Accept the update BSM offers; it installs and restarts on its own. |
| 1.0.x | That version can't update itself to 1.1.0: download the new setup once and run it. Your projects, presets and settings are kept. |

## Documentation and help

- **Documentation**: <https://freeproject089.github.io/Better-Sound.Maker/> (user guide, how it works, SDEF reference, in English and French)
- **In the app**: **Documentation** and **F.A.Q** in the Help section, and **Ctrl+K** to search everything
- **Discord**: <https://discord.gg/CTaaEF9R75>
- **Bug reports**: [GitHub Issues](https://github.com/FreeProject089/Better-Sound.Maker/issues) — attach a crash log (**Ctrl+Shift+L** in the app)
- **Contributing**: [Contributing](CONTRIBUTING.md) · [Catalog format](docs/reference/catalog-format.md)

## Build from source

You need Windows 10 or 11, [Node.js](https://nodejs.org/) 22+, the
[Rust](https://www.rust-lang.org/tools/install) stable toolchain and the
[Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/FreeProject089/Better-Sound.Maker.git
cd Better-Sound.Maker
npm install
npm run tauri:dev          # the desktop app in development mode
npm run dev                # the web version in a browser (fewer features)
npm run catalog:validate   # check the bundled catalog and sound types
```

Release builds (BetterInstaller setup, NSIS, MSI, signed update manifests) come from
`scripts/release.ps1`; see the [release checklist](docs/reference/release.md).
SDEF templates are regenerated from a DCS install with `npm run templates:build "<DCS folder>"`.

## License

Better Sound.Maker is open source under the **Apache License 2.0**. See [LICENSE](LICENSE).
DCS World is a trademark of Eagle Dynamics SA; this project is not affiliated with Eagle Dynamics.
