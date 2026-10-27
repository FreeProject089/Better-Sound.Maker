# Build

**Build** (*Mod Generator* in the sidebar) turns your project into a DCS mod: a folder with
`entry.lua`, the SDEFs and your audio, laid out the way DCS expects, ready to drop into
`Saved Games\DCS\Mods\resource\`.

<!-- screenshot: the Build page with the configuration form and the two previews -->

## The counters

At the top: number of **Assets**, **Audio Files** assigned, **SDEF Edited**, and whether the
**Theme** is on. A quick check before you build.

## Mod Configuration

These fields fill `entry.lua`, the file that introduces the mod to DCS.

| Field | Used for | Required |
|---|---|---|
| **Mod Name** | The mod's ID in `entry.lua`, and the folder name (spaces removed). | Yes |
| **Display Name** | The name shown in DCS. Defaults to the mod name. | |
| **Author / Team** | The developer shown in DCS. | Yes |
| **Short Name** | A short label. Defaults to the first four letters of the mod name, in capitals. | |
| **Version** | Your mod's version, for example `1.0.0`. | |
| **Description** | Shown in DCS's mod list. | |
| **URL (optional)** | A link to the mod's page. | |
| **Credits** | Written at the top of `entry.lua`. | |
| **Enable Theme** | Adds the `Theme/` folder. Same switch as on the [Theme](theme.md) page. | |

**Save Configuration** keeps these values with the project. Building saves them too.

## Audio Format

| Option | Result |
|---|---|
| **Original (keep as-is)** | Your files are copied unchanged. |
| **Convert all to WAV (PCM 16-bit)** | Everything becomes `.wav`. Best quality, larger files. |
| **Convert all to OGG (smaller files)** | Everything becomes `.ogg`. Smaller mod. |

DCS reads both `.wav` and `.ogg`.

## The previews

- **entry.lua Preview** shows the exact `entry.lua` that will be written.
- **Output Structure Preview** shows the folder tree:

```text
YourMod/
├── entry.lua
├── Theme/                 (only with Enable Theme)
│   ├── icon.png
│   └── ME/…
└── Sounds/
    ├── sdef/Effects/…     your .sdef files, at their original paths
    └── Effects/…          your audio files
```

Why the SDEFs sit under `Sounds/sdef/Effects/`: [Mod build](../how-it-works/mod-build.md).

## Unsaved SDEF changes

If some SDEFs have changes you did not save in the [SDEF editor](sdef-editor.md), an *Unsaved SDEF
changes* box appears. **The build ignores unsaved changes.** Press **Save All** to save them, or
pick one in the list to open it in the editor.

## Build & Export Mod

Press **Build & Export Mod**. A progress bar shows each step, then *Export complete* with the
mod's name.

| Where BSM runs | What you get |
|---|---|
| Desktop app | You choose a folder; BSM creates the mod folder inside it. |
| Browser with folder access (Chrome, Edge) | Same, through the browser's folder picker. |
| Other browsers | A `YourMod.zip` download. |

## Install the result

Copy the mod folder into `C:\Users\<you>\Saved Games\DCS\Mods\resource\` (create `Mods\resource`
if needed), start DCS, and check the mod in the Mods section of the options. A `.zip` must be
extracted first. Mod managers such as OVGME also work with the folder.

Something wrong in game? [Troubleshooting](../reference/troubleshooting.md).
