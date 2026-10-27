# Tune a sound

You will change how one sound plays (louder, carrying further, looping or not) in the SDEF
editor, and save it so the next build uses it.

**You need:** a sound already in your project ([Make your first mod](first-mod.md) shows how).

## Steps

- [ ] **Open the SDEF Editor** from the sidebar. *You see:* the SDEFs of your project in a list on the left.
- [ ] **Click the SDEF** you want to tune. *You see:* its parameters in groups: Sound Sample, Volume Control, Frequency / Pitch, Distance / Radius, Play Mode, and more.
- [ ] **Change a value.** Type it, or use the − and + buttons. For example raise `gain` to make it louder, or `outer_radius` to hear it from further away. *You see:* the problems panel updates as you type.
- [ ] **Read the problems panel.** It lists errors to fix, warnings, and hints. *No problems found* means the SDEF is consistent.
- [ ] **Check the curve** under Distance / Radius. *You see:* how loud the sound is at each distance, from `silent_radius` out to `outer_radius`.
- [ ] **Press Play** to hear the sound with your settings.
- [ ] **Press Save.** *You see:* *SDEF Saved*.

!!! warning "Save before you build"

    The Build page uses saved SDEFs only. If you leave changes unsaved, Build warns you with an
    *Unsaved SDEF changes* box and a **Save All** button.

## Common changes

| You want | Change |
|---|---|
| Louder or quieter | `gain` (1.0 is unchanged, 0.5 is half) |
| Higher or lower | `pitch` (1.0 is unchanged) |
| Heard from further away | `outer_radius` (and `inner_radius` for the distance where it is still near full volume) |
| Play once, all the way through (explosions, shots) | `detached` on |
| A bit of variety on each playback | several files in `wave`, `listmode` RANDOM; or `gain_random` / `pitch_random` |
| No Doppler (cockpit and interface sounds) | `nodoppler` on |

Every parameter is explained in [SDEF parameters](../reference/sdef-parameters.md).

## If it does not work

| You see | Do this |
|---|---|
| The SDEF Editor list is empty | Select sounds in the Library first: the editor lists your project. |
| An error about radius order | Radii must grow: `silent_radius` ≤ `peak_radius` ≤ `inner_radius` ≤ `outer_radius`. |
| *No wave and no inherit: this sound will be silent* | Give `wave` a file, or `inherit` another SDEF. |

## Next

Save these settings as a template to reuse on other sounds: see
[SDEF editor → Templates](../features/sdef-editor.md#templates).
