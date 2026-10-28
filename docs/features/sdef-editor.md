# SDEF Editor

!!! tip "Prefer it step by step?"

    The task version of this page is [Tune a sound](../guide/tune-a-sound.md).

The **SDEF Editor** changes how a sound plays: volume, pitch, how far it carries, whether it
loops, where it comes from. It edits the `.sdef` files of the sounds in your
[project](project.md), with a form for every parameter or as raw text, and checks your values
as you type.

<!-- screenshot: the SDEF editor in Visual mode, with the problems panel and the attenuation curve -->

## Layout

- **Left:** the SDEFs of your project. Click one to edit it.
- **Top bar:** **Play** (hear the sound with the current settings), **Visual** / **Raw** (switch
  mode), **Save**.
- **Below the bar:** the problems panel.
- **Main area:** the parameters, or the raw text.

## Visual mode

Parameters are grouped the way ED's `example.sdef` presents them:

| Group | Parameters |
|---|---|
| Inheritance | `inherit` |
| Sound Sample | `wave` (one file or a list) |
| Volume Control | `gain`, `gain_random` |
| Frequency / Pitch | `pitch`, `pitch_random` |
| Filtering | `lowpass`, `distance_filter_offset` |
| 3D Position | `position` |
| Distance / Radius | `silent_radius`, `peak_radius`, `inner_radius`, `outer_radius`, and the curve |
| Directional Cone | `direction`, `cone_inner_angle`, `cone_outer_angle`, `cone_inner_gain`, `cone_outer_gain`, `cone_outer_lowpass` |
| Play Mode | `detached`, `streaming`, `preload`, `looping`, `listmode` |
| Envelope (Attack/Release) | `attack`, `release` |
| Stereo Settings | `auto_width` |
| Doppler Effect | `nodoppler` |

Numbers have − and + buttons; vectors (`position`, `direction`) have one field per axis
(forward, up, right). Options with three states (`preload`, `looping`) can be left **— unset —**
so the game decides.

What each parameter does: [SDEF parameters](../reference/sdef-parameters.md).

### The ED badge

Some parameters carry a small **ED** badge: `gain_random`, `pitch_random`, `cone_inner_gain`,
`preload` and `looping`. They are not in ED's `example.sdef`, but Eagle Dynamics uses them in the
game's own SDEF files. They work; they are just not in the official reference. Hover the badge
for the reminder.

### The attenuation curve

Under **Distance / Radius**, a graph shows how loud the sound is at each distance (log scale),
relative to its `gain`. It follows DCS's model:

1. from `silent_radius` to `peak_radius`, the sound fades in from silent to full;
2. from `peak_radius` to `inner_radius`, it drops to 0.85 of full;
3. beyond `inner_radius`, it falls off with distance, down to silence at `outer_radius`.

Change a radius and the curve moves, so you see the effect before you test in the game.

## Raw mode

**Raw** shows the SDEF as text, exactly as it will be written. Use it to paste an SDEF from
elsewhere or to edit several values at once. Switching back to **Visual** reads your text into the
form.

## The problems panel

The editor checks the SDEF on every change and lists what it finds, as errors, warnings or hints.
*No problems found* means it is consistent. Among the checks:

| Problem | Why it matters |
|---|---|
| No `wave` and no `inherit` | The sound will be silent. |
| A `wave` path with backslashes, or starting with `Sounds/` | Paths use `/` and are already relative to `Sounds/`. |
| Radii out of order | `silent_radius` ≤ `peak_radius` ≤ `inner_radius` ≤ `outer_radius`. |
| `gain` at 0 or below, or very high | Muted, or likely to clip. |
| `pitch` at 0 or below | Not allowed. |
| Cone angles outside 0–180, or cone set with `direction = {0, 0, 0}` | The cone is invalid or has no effect. |
| `listmode = ASR` with fewer than 2 samples | ASR needs a start sample and a loop. |
| `streaming` with `detached` | Streaming implies `detached = false`. |

The panel never blocks you: you can save an SDEF with problems.

## Saving

**Save** stores the SDEF in your project. Edits you have not saved are kept as *unsaved* and are
**not** used by the build. The [Build](build.md) page warns you about them and offers **Save All**.

## Templates

**Templates** (top right) opens the template manager. A template is a set of parameter values you
saved to reuse on other sounds.

- **Create one:** on the right (*New template*), name it, pick the source asset, press **Create template**.
- **Apply it:** *Current* applies it to the SDEF you are editing; *All (n)* applies it to every
  SDEF in the project. The `wave` of each SDEF is kept: only the other parameters change.
- **Share:** *Import* / *Export* load and save templates as files.

## Related

- [How DCS sound mods work](../getting-started/dcs-sound-mods.md)
- [The SDEF model](../how-it-works/sdef-model.md): how BSM parses and writes SDEFs.
