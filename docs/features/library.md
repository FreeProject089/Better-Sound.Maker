# Assets Library

!!! tip "Prefer it step by step?"

    The task version of this page is [Make your first mod](../guide/first-mod.md).

The **Assets Library** lists every sound DCS knows about: one row per SDEF, with the wave files it
plays. It is where every mod starts: you find the sounds you want to replace here and select them.
The selection becomes your [Project](project.md).

<!-- screenshot: the Library with the folder tree, a filtered list and the detail panel -->

## Filling the library: the scanner

The library is built from your DCS installation. **Reload Library** (top right) opens the **DCS
Assets Scanner**, which also opens by itself on a first run.

| Field | What it does |
|---|---|
| **DCS Installation Path** | Your DCS World folder. BSM reads `Doc/Sounds/sdef_and_wave_list.txt` and your `CoreMods` folder. |
| **Saved Games Path (Optional)** | Your `Saved Games\DCS` folder. Adds the sounds of mods installed there, so you can mod a mod. |
| **Start Scan** | Runs the scan. |
| **Manual File** | Loads a sound list text file you choose, instead of scanning. |

!!! warning "Scan a clean game folder"

    Mods copied into the DCS folder itself would be read as if they were the game's own sounds.
    Keep the game folder free of mods and put mods in `Saved Games`.

The library is kept between sessions. Rescan after a DCS update or a new module, or turn on
**Auto-scan Assets Library** in [Settings](settings.md) to rescan at every start.

## Finding a sound

- **Folder tree.** The left column mirrors the SDEF folders (`Aircrafts`, `Weapons`, `GndTech`…).
  Click a folder to show only what is inside.
- **Search.** The search box matches SDEF paths and wave paths.
- **Filters.** **Filters** opens advanced options: assets *With notes*, assets *With audio
  replacement*, and a filter by **sound type**. **Clear** resets them.
- **Sound type.** Each row shows a type (engine, weapon, radio…) detected from its path. You can
  add your own types and rules in [Sound types](sound-types.md).

## Selecting sounds

Tick a row's check box to add it to your project. **Select All Visible** selects everything the
current folder, search and filters show; **Clear Selection** empties the selection. The
*Selected* counter shows how many you have.

Applying a [preset](presets.md) selects a saved list of sounds in one go.

## The detail panel

Click a row (not its check box) to open its details:

- the SDEF path and its **Wave Files**;
- **SDEF Note**, and a note per wave file: notes are for you, they are not put in the mod;
- **Upload Audio** / **Replace Audio** next to each wave file, to give it a replacement right here;
- **Select** / **Deselect**.

## Importing

**Import** offers two things:

| Option | What it does |
|---|---|
| **Import Mod (.zip)** | Reads a mod archive and adds its SDEFs to the library under their own section, so you can build on another mod's sounds. |
| **Import Library (.json)** | Loads a library previously saved as JSON. |

**Settings → Keep imported mod assets in Library** decides whether imported mods survive a rescan.

## Related

- [How DCS sound mods work](../getting-started/dcs-sound-mods.md): what an SDEF and `sdef_and_wave_list.txt` are.
- [Project](project.md): what happens to the sounds you select.
