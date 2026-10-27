# Make your first mod

You will replace one DCS sound with your own audio, build the mod, and hear it in the game.

**You need:** BSM with a [scanned library](../getting-started/first-launch.md#4-scan-the-library),
and an audio file in `.wav` or `.ogg` (mono is best for anything placed in 3D: engines, switches,
weapons).

!!! note "Why you pick an SDEF, not an audio file"

    DCS plays SDEFs, and each SDEF names its audio file. To replace a sound, your mod ships an
    SDEF with the same path as the game's, pointing at your audio. BSM keeps the path for you.
    More: [How DCS sound mods work](../getting-started/dcs-sound-mods.md).

## Steps

- [ ] **Open the Assets Library** from the sidebar. *You see:* a folder tree on the left and the list of SDEFs.
- [ ] **Find the sound.** Type part of its name in the search box (for example `canopy`), or browse the folders. *You see:* the list narrows to matching SDEFs, each with its wave file(s) and sound type.
- [ ] **Click the row** to check what it is. *You see:* the detail panel with the SDEF path, its wave files and a note field.
- [ ] **Tick its check box** (or press **Select** in the detail panel). *You see:* the *Selected* count goes up.
- [ ] **Open Projects.** *You see:* your selected SDEF as a card marked **Missing Audio**.
- [ ] **Add your audio.** Drag your `.wav` or `.ogg` onto the drop zone (**Click or Drag Audio**), or click it to browse. *You see:* the card turns to **Audio Assigned**. Press **Play** to listen.
- [ ] **Open Build** (*Mod Generator* in the sidebar). Fill in at least **Mod Name** and **Author / Team**.
- [ ] **Press Build & Export Mod** and choose a folder. *You see:* a progress bar, then *Export complete* with the mod folder name.
- [ ] **Install it.** Copy that folder into `C:\Users\<you>\Saved Games\DCS\Mods\resource\` (create `Mods\resource` if needed).
- [ ] **Test in DCS.** Start the game, check the mod is listed in the Mods section of the options, and fly to hear it.

<!-- screenshot: a Projects card with Audio Assigned and the Play button -->

## If it does not work

| You see | Do this |
|---|---|
| The library is empty | Press **Reload Library** and run the scanner. See [First launch](../getting-started/first-launch.md#4-scan-the-library). |
| Build refuses to start | **Mod Name** and **Author / Team** are required. |
| DCS does not list the mod | The folder must sit directly in `Mods\resource\`, with `entry.lua` at its top level, not one folder deeper. |
| The old sound still plays | Check that you replaced the right SDEF: some events have several (interior and exterior, for instance). More in [Troubleshooting](../reference/troubleshooting.md). |
| The audio file is refused | Only `.wav` and `.ogg` are accepted. Convert it first. |

## Next

[Tune a sound](tune-a-sound.md) to change its volume or range. Screen details:
[Library](../features/library.md), [Project](../features/project.md), [Build](../features/build.md).
