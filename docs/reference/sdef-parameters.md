# SDEF parameters

Every parameter the SDEF editor knows, from `SDEF_PARAMS` in
[`src/utils/sdef-generator.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-generator.js),
checked against ED's `DCS World/Doc/Sounds/example.sdef`. How these are parsed, written and linted is
explained in [SDEF model](../how-it-works/sdef-model.md).

**ED-only** means ED uses the key in its own `.sdef` files but `example.sdef` does not document it.
Those keys are written whenever you set them, because their engine default is not known.

## Parameters

| Key | Type | Default | Group | Meaning | ED-only |
|---|---|---|---|---|---|
| `inherit` | string | *(empty)* | include | Name of the `.sdef` to inherit settings from | |
| `wave` | wave | *(empty)* | sample | Sample path relative to `Sounds/`; a list `{"a", "b"}` picks one at random per playback. Without extension, `.wav` then `.ogg` are tried; 1–2 channels, any PCM format | |
| `gain` | number | `1` | volume | Linear gain multiplier. **Always written** | |
| `gain_random` | number | `0` | volume | Random gain variation per playback (ED files use 0.1–0.15) | yes |
| `pitch` | number | `1` | frequency | Source frequency multiplier | |
| `pitch_random` | number | `0` | frequency | Random pitch variation per playback (ED files use 0.05–0.15) | yes |
| `lowpass` | number | `24000` | filtering | Lowpass cutoff frequency (Hz) | |
| `distance_filter_offset` | number | `0` | filtering | Distance at which the lowpass filter starts to affect the sound | |
| `position` | vec3 | `{0, 0, 0}` | position | Position relative to the host `{forward, up, right}` in metres | |
| `silent_radius` | number | `0` | radius | Inside this radius the sound is silent | |
| `peak_radius` | number | `0` | radius | At this radius the gain is at its maximum | |
| `inner_radius` | number | `1` | radius | Reference distance: gain is 0.85 of the maximum. **Always written** | |
| `outer_radius` | number | `1000` | radius | Beyond this radius the source is not heard | |
| `direction` | vec3 | `{0, 0, 0}` | cone | Cone direction relative to the host `{forward, up, right}` | |
| `cone_inner_gain` | number | `1` | cone | Gain inside `cone_inner_angle` | yes |
| `cone_inner_angle` | number | `0` | cone | Half-angle (0–180°) inside which the gain is at maximum | |
| `cone_outer_angle` | number | `0` | cone | Half-angle (0–180°) outside which the gain is `cone_outer_gain` | |
| `cone_outer_gain` | number | `1` | cone | Gain outside `cone_outer_angle` | |
| `cone_outer_lowpass` | number | `24000` | cone | Cutoff frequency outside `cone_outer_angle` | |
| `detached` | boolean | `false` | playmode | Always play the whole sample (explosions, gunshots) | |
| `streaming` | boolean | `false` | playmode | Stream samples from disk instead of keeping them uncompressed in memory; implies `detached = false` | |
| `preload` | tristate | *unset* | playmode | Load samples when the mission starts (ED sets `false` almost everywhere) | yes |
| `looping` | tristate | *unset* | playmode | Force looping on or off; unset lets the game decide | yes |
| `listmode` | enum `RANDOM` · `SEQUENCE` · `ASR` | `RANDOM` | playmode | `RANDOM`: one random sample; `SEQUENCE`: play all in order; `ASR`: first sample on start, then loop the rest | |
| `attack` | number | `0` | envelope | Seconds for the volume to rise from 0 to peak when the sample starts | |
| `release` | number | `0` | envelope | Seconds for the volume to decay to 0 when the sample stops | |
| `auto_width` | boolean | `true` | stereo | If `false`, the panorama width does not change with distance | |
| `nodoppler` | boolean | `true` | doppler | If `true`, the Doppler effect does not affect the sound | |

!!! note "Inverse cone"
    `example.sdef`: setting `cone_inner_angle` greater than `cone_outer_angle`, both ≤ 90, makes an
    inverse cone symmetric around the plane whose normal is `direction`, useful for rotors.
    Example: inner 80, outer 60 gives ±10° inner and ±30° outer.

Any other key found in a file is kept unchanged when the file is saved, and the linter warns about it.

## Lint messages

From [`src/utils/sdef-lint.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-lint.js).
`<k>` is the parameter concerned.

| Level | Message | What to do |
|---|---|---|
| warning | `Unknown parameter "<k>" — did you mean "<guess>"? DCS ignores it.` | fix the typo |
| warning | `Unknown parameter "<k>" — DCS ignores it.` | remove it, unless you know DCS reads it |
| error | `"<k>" must be a number (got …).` | enter a number |
| error | `No wave and no inherit: this sound will be silent.` | add a sample or an `inherit` |
| warning | `"<wave>" uses backslashes; use forward slashes.` | replace `\` with `/` |
| warning | `"<wave>" starts with Sounds/ but wave paths are already relative to Sounds/.` | drop the `Sounds/` prefix |
| warning | `ASR needs at least 2 samples (first = attack, the rest loops).` | add samples or change `listmode` |
| info | `SEQUENCE with a single sample behaves like RANDOM.` | — |
| warning | `gain is 0 or negative: the sound is muted.` | raise `gain` |
| warning | `gain <n> is unusually high and may clip.` | gain above 10 |
| error | `pitch must be greater than 0.` | — |
| error | `<k> cannot be negative.` | `gain_random`, `pitch_random`, `attack`, `release`, or a radius |
| warning | `<k> <n> Hz is outside the audible 10–24000 Hz range.` | `lowpass` / `cone_outer_lowpass` |
| error | `<k> (<n>) must be ≥ <previous> (<m>).` | radii must grow: silent ≤ peak ≤ inner ≤ outer |
| info | `Only one of inner/outer radius is set; DCS derives the other: inner … m, outer … m.` | set both if the derived value is not what you want |
| error | `<k> is a half-angle and must be between 0 and 180.` | — |
| warning | `Cone angles are set but direction is {0, 0, 0}: the cone has no effect.` | set `direction` |
| info | `cone_inner_angle > cone_outer_angle (both ≤ 90): this is an inverse cone (rotor-style).` | intended for rotors |
| error | `An inverse cone needs both angles ≤ 90.` | — |
| warning | `streaming = true implies detached = false; detached is ignored.` | remove one of them |
