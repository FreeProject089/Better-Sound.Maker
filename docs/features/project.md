# Projects

!!! tip "Prefer it step by step?"

    The task version of this page is [Make your first mod](../guide/first-mod.md).

**Projects** shows the sounds you selected in the [Assets Library](library.md) and lets you give
each one its new audio. Everything listed here goes into the mod when you [build](build.md) it.

<!-- screenshot: Projects with the folder tree, the counters and a few asset cards -->

## The counters

At the top, BSM counts your selected assets, how many have **Audio Assigned** and how many still
have **Missing Audio**. Check *Missing Audio* before you build: it is the list of sounds you
selected but have not replaced yet.

## Finding your way

The project keeps the same folder tree as the library. The folder highlighted in blue is the
*leaf folder*: the direct parent of the files you are looking at, so you know where you are in
deep trees.

## Each asset card

| Control | What it does |
|---|---|
| Drop zone (**Click or Drag Audio**) | Drop a `.wav` or `.ogg` file on it, or click to browse. An SDEF with several wave files has one drop zone per file. |
| **Play** / **Stop** | Listens to the assigned audio. With **Settings → Apply SDEF Params on Playback**, the preview uses the SDEF's gain, pitch and loop. |
| **Replace** / **Remove Audio** | Swaps or drops the assigned file. |
| **Edit SDEF** | Opens this sound in the [SDEF editor](sdef-editor.md). |
| **Remove from project** | Deselects the sound. |

Only `.wav` and `.ogg` are accepted. For sounds placed in 3D (engines, switches, weapons), use
mono files: stereo cannot be positioned. The in-app **Documentation → Audio Fundamentals** tab
explains why.

## Removing several at once

Tick several cards (or a whole folder) and a bar appears at the bottom of the screen, with a
button to remove them all from the project.

## Load Existing Mod

**Load Existing Mod** opens a mod you built before, from its `.zip`: BSM reads its `entry.lua`,
SDEFs and audio and makes it your project again, so you can keep working on it.

!!! warning "It replaces the current project"

    If a project is open, BSM asks first: **Save & Load** keeps your unsaved SDEF changes
    before loading, **Load & Close** drops them, **Cancel** stops.

## Related

- [Tune a sound](../guide/tune-a-sound.md)
- [Build](build.md)
