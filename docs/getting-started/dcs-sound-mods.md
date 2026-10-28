# How DCS sound mods work

You can use Better Sound.Maker without knowing any of this. But five minutes here will save you
an hour of "why does the game still play the old sound". Everything below comes from Eagle
Dynamics' own reference, shipped with the game in `DCS World\Doc\Sounds\` (`example.sdef`,
`readme.txt` and the `SoundModExample` folder).

## SDEF: the sound definition

DCS does not play audio files directly. Every sound event (an engine idling, a switch clicking, a
missile launching) is an **SDEF** file: *Source DEFinition*. It is a short text file that tells the
game which audio file to play and how:

```lua
wave = "Effects/Animals/CowAmbience"
inner_radius = 12
outer_radius = 300
gain = 1.25
```

That one is from ED's example mod: it makes the Tunguska's idling engine sound like a cow.

- `wave` is the audio file. It can also be a list, `wave = {"a", "b", "c"}`, and DCS picks one
  sample per playback.
- The other lines are parameters: volume (`gain`), pitch, how far the sound carries
  (`inner_radius`, `outer_radius`), whether it loops, and more. Any parameter you leave out keeps
  its default.

All parameters: [SDEF parameters](../reference/sdef-parameters.md). How BSM reads and writes them:
[The SDEF model](../how-it-works/sdef-model.md).

## `wave` paths are relative to `Sounds/`

This is the rule that trips people up most. A `wave` path is relative to the `Sounds/` folder,
**without** `Sounds/` in front, with forward slashes, and usually without extension:

| `wave` value | File DCS looks for |
|---|---|
| `"Effects/Animals/CowAmbience"` | `Sounds/Effects/Animals/CowAmbience.wav`, then `.ogg` |
| `"Effects/Aircrafts/F18/Engine.ogg"` | exactly `Sounds/Effects/Aircrafts/F18/Engine.ogg` |

When no extension is given, DCS tries `.wav` and then `.ogg`. Samples have 1 or 2 channels, in
any PCM format.

## The two folders: `Sounds/sdef` and `Sounds/Effects`

Inside a mod (and inside the game) sounds are split in two:

- `Sounds/sdef/…` holds the SDEF files.
- `Sounds/Effects/…` holds the audio files the SDEFs point at.

An SDEF **replaces** the game's when it has the **same path and name** under `Sounds/sdef/`. That
is why BSM keeps the original path of every SDEF you pick: change the path, and DCS sees a new
sound that nothing uses.

## `entry.lua`: the mod's ID card

Every mod folder has an `entry.lua` at its root. It declares the mod to DCS: name, version,
author, and what to load. The smallest one, from ED's example:

```lua
declare_plugin("ExampleSoundMod by DcsUser",
{
    displayName = "User Mod for Sounds Example",
    shortName   = "ExampleSoundMod",
    version     = "1.0",
    state       = "installed",
})
plugin_done()
```

BSM writes this file for you from the details you enter on the [Build](../features/build.md) page,
including the `mount_vfs_sound_path` line that mounts the mod's `Sounds` folder, and the theme
lines if you add [Theme](../features/theme.md) images.

## Where mods go: `Saved Games\DCS\Mods\resource`

Sound mods are *resource* mods. They go in your Saved Games folder, not in the game folder:

```text
C:\Users\<you>\Saved Games\DCS\Mods\resource\<YourMod>\
├── entry.lua
└── Sounds\
    ├── sdef\…
    └── Effects\…
```

Create the `Mods\resource` folders if they do not exist. If you run a DCS variant, the folder may
have a suffix (for example `DCS.openbeta`). Keeping mods out of the game folder means DCS updates
and repairs never break them, and removing a mod is deleting one folder.

## `sdef_and_wave_list.txt`: the index of every sound

`DCS World\Doc\Sounds\sdef_and_wave_list.txt` lists every SDEF in the game and the wave files each
one uses. It is the map BSM reads when it [scans your install](first-launch.md#4-scan-the-library),
and the reason the [Assets Library](../features/library.md) can show every sound with its path.
You can open it in any text editor to search for a sound by name.

## Try ED's example

ED ships a working example. To see a sound mod in action before you build one:

- [ ] Copy `DCS World\Doc\Sounds\SoundModExample` into `Saved Games\DCS\Mods\resource\`.
- [ ] Start DCS and run `example_soundmod.miz` from the same `Doc\Sounds` folder.
- [ ] Listen to the Tunguska. Then delete the folder to undo it.

Next: [Make your first mod](../guide/first-mod.md).
