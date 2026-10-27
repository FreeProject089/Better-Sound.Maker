# Settings

**Settings** holds the few global options of BSM. Changes apply when you press **Save**.

<!-- screenshot: the Settings page -->

## DCS World Directory

The path of your DCS World installation, for example `C:\Program Files\Eagle Dynamics\DCS World`.
BSM reads the game's sound list from there when it [scans the library](library.md#filling-the-library-the-scanner).
Type it, or press **Select Folder**. The folder button next to it opens the path in Explorer.

## Community catalog

The address of the `catalog.json` that lists [community presets](presets.md#community-presets)
and sound-type packs.

- **Leave it empty** to use the official community catalog. This is what most people want.
- **Enter a URL** (starting with `http://` or `https://`) to use another catalog: your team's,
  or one you are testing.
- **Test** loads the catalog right away and tells you what it found, for example
  *Catalog OK: 12 presets, 2 sound-type packs*. If it cannot be reached, it says which copy BSM
  falls back to.

The catalog can also be set with `CommunityCatalogUrl` in [`Load.cfg`](../reference/load-cfg.md);
the Settings field wins. File format: [Catalog format](../reference/catalog-format.md). Loading
order and caching: [Catalog loading](../how-it-works/catalog-loading.md).

## Behavior & Scanning

| Option | What it does |
|---|---|
| **Apply SDEF Params on Playback** | When you preview a sound in [Projects](project.md), play it with the SDEF's gain, pitch and loop mode instead of raw. |
| **Auto-scan Assets Library** | Rescan your DCS installation at every start, so new modules and DCS updates show up without pressing Reload. |
| **Keep imported mod assets in Library** | Keep mods you imported as `.zip` in the library when it is rescanned. |

## What is not here

Some options are set in the `Load.cfg` file shipped with the app rather than in this page, such
as turning off automatic updates (`DisableAutoUpdate`) or community presets
(`DisableCommunityPresets`). See [Load.cfg](../reference/load-cfg.md).

The interface language is changed from the sidebar, and the guided tour is replayed with
**Tutorial**.
