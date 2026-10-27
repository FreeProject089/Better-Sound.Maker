# Use a preset

A preset is a saved **selection of sounds**: for example "every F/A-18C engine SDEF". Applying it
selects those sounds in your library in one go, so you do not have to hunt for them again. It
stores which SDEFs are selected, not their parameter values or your audio.

**You need:** a [scanned library](../getting-started/first-launch.md#4-scan-the-library). Presets
are applied against it.

## Apply a community preset

- [ ] **Open Presets** from the sidebar.
- [ ] **Press Community Presets.** *You see:* the presets listed in the community catalog, with their number of assets and version. A preset you already have shows an update button when the community version changed.
- [ ] **Import the one you want.** *You see:* it appears under *Saved Presets*. If it carries custom sound types, BSM asks whether to import them too: **Yes, Import Types** adds them to your [Sound types](../features/sound-types.md).
- [ ] **Press Apply** on it. *You see:* a confirmation with how many assets it adds to your current selection.
- [ ] **Choose Save Current & Apply** to keep your current selection as a preset first, or **Apply Without Saving**.
- [ ] **Open Projects.** *You see:* the preset's sounds, ready for your audio.

## Save your own

- [ ] **Select sounds** in the Assets Library.
- [ ] **Open Presets**, type a **Preset Name**, and press **Save Current Selection**.
- [ ] **To share it**, press **Export** on the preset to save it as a JSON file. Others load it with **Import Preset**.

## If it does not work

| You see | Do this |
|---|---|
| *Library not loaded* and a **Load Library Data** button | Press it, or scan from the Library first. |
| *Offline: showing the last downloaded community catalog* | You have no connection; the list is the last copy BSM downloaded. |
| No **Community Presets** button | Community presets are turned off in `Load.cfg` (`DisableCommunityPresets`). See [Load.cfg](../reference/load-cfg.md). |
| The community list is not the one you expect | Check **Settings → Community catalog**. See [Settings](../features/settings.md#community-catalog). |

More: [Presets](../features/presets.md).
