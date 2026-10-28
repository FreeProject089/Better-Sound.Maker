# SDEF model

An `.sdef` (Source DEFinition) file is a small Lua-like text file that tells the DCS sound engine
which samples to play and how: gain, pitch, distance falloff, cone, play mode. BSM parses, edits,
lints and regenerates these files. The user-facing editor is described in
[SDEF editor](../features/sdef-editor.md); this page explains the model behind it.

The authority is ED's own reference file, `DCS World/Doc/Sounds/example.sdef`. Every rule below cites it.

---

## The parameter table: `SDEF_PARAMS`

[`src/utils/sdef-generator.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-generator.js)
exports `SDEF_PARAMS`, one entry per known key:

```js
{ key: 'gain_random', type: 'number', default: 0, group: 'volume',
  step: 0.05, undocumented: true, desc: '…' }
```

| Field | Meaning |
|---|---|
| `key` | the SDEF key as written in the file |
| `type` | `string`, `wave`, `number`, `vec3`, `boolean`, `enum` (with `values`), or `tristate` |
| `default` | the engine default from `example.sdef` (or `null` when unknown) |
| `group` | editor section: include, sample, volume, frequency, filtering, position, radius, cone, playmode, envelope, stereo, doppler |
| `undocumented` | `true` for keys that **ED uses in its own files but `example.sdef` does not describe** |

The full table is in the [SDEF parameter reference](../reference/sdef-parameters.md).

**`tristate`** is used for `preload` and `looping`: the value can be `true`, `false`, or *unset*
(`null`). Unset is a real third state: it means "let the game decide", which is different from
writing `false`.

**Undocumented keys.** `gain_random`, `pitch_random`, `cone_inner_gain`, `preload` and `looping` do
not appear in `example.sdef`, but ED ships them. A scan of ED's own `.sdef` files found `preload` in
roughly 15 000 files, `gain_random` / `pitch_random` in about 190, `cone_inner_gain` in about 70 and
`looping` in about 10. They are exposed so you can reproduce what ED does.

## Generating a file

`generateSdef(params)` writes:

1. a header comment `-- Generated with Better ModMaker`;
2. `wave`: a single string, or a `{ … }` list over several lines when there are 2+ samples;
3. every other known key, in `SDEF_PARAMS` order, following these rules:

| Rule | Why |
|---|---|
| `undefined`, `''` and `null` are never written | unset means "use the engine default" |
| A value equal to its default is **skipped** | keeps files short and readable, like ED's |
| …except `gain` and `inner_radius`, always written | the engine default `inner_radius = 1` is almost never what you want, and an explicit gain avoids surprises |
| `undocumented` keys are written whenever set, even at the "default" | their real engine default is unknown, so the app cannot assume a value is a no-op |
| Unknown keys are **preserved** and written at the end | editing a file in BSM never drops a key the editor doesn't model |

Strings are quoted, `vec3` becomes `{x, y, z}`, upper-case enum values (`RANDOM`, `SEQUENCE`, `ASR`)
stay unquoted. Keys starting with `_` are internal and never written.

## Parsing a file

`parseSdef(text)` is a line-based parser:

- everything after `--` on a line is dropped (comments);
- `wave = {` starts a multi-line list until a line equal to `}`; a one-line `wave = {"a", "b"}` also works; a single `wave = "x"` becomes `["x"]`;
- `key = value` is typed in this order: quoted string, `{…}` (all-quoted items → string list, otherwise numbers), `true`/`false`, number (including `1.0`, `24000.0`, `1e3`), else raw text (enums).

!!! note "Limits of the parser"
    It is not a Lua parser. Comments are removed first by `stripLuaComments`, with Lua's rules:
    `-- line`, `--[[ block ]]` and `--[==[ block ]==]`, but not `--` inside a string. Blocks do not
    nest, exactly as in Lua: in DCS's own `example.sdef` the outer `--[[` closes at the first `]]`,
    so the cone and play-mode lines after it are live code there too. Expressions, variables and
    several statements on one line are not supported.

## The linter

[`src/utils/sdef-lint.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-lint.js)
`lintSdef(params)` never throws. It returns `{ level, key, message }` findings with
`level` = `error`, `warning` or `info`.

| Check | Level | Why |
|---|---|---|
| Unknown key, with a suggestion (alias table `no_doppler→nodoppler`, `ptich→pitch`, `loop→looping`, `volume→gain`, or Levenshtein distance < 3) | warning | DCS silently ignores unknown keys, so a typo just does nothing |
| Numeric key holding a non-number | error | the engine expects a number |
| No `wave` and no `inherit` | error | nothing to play: the sound is silent |
| Backslashes in a wave path | warning | use forward slashes |
| Wave path starting with `Sounds/` | warning | paths are already relative to `Sounds/` (`example.sdef`) |
| `ASR` with fewer than 2 samples | warning | ASR plays the first sample once and loops the rest |
| `SEQUENCE` with 1 sample | info | behaves like `RANDOM` |
| `gain ≤ 0` / `gain > 10` | warning | muted / likely clipping |
| `pitch ≤ 0` | error | invalid frequency multiplier |
| Negative `gain_random`, `pitch_random`, `attack`, `release` | error | meaningless |
| `lowpass` or `cone_outer_lowpass` outside 10–24000 Hz | warning | outside the audible range |
| Radii not increasing (`silent ≤ peak ≤ inner ≤ outer`), or negative | error | the curve below would be undefined |
| Only one of `inner_radius` / `outer_radius` set | info | tells you the value DCS will derive (see below) |
| Cone angle outside 0–180 | error | they are half-angles |
| Cone used (angle set and `cone_outer_gain ≠ 1`) but `direction` is `{0,0,0}` | warning | a cone needs a direction |
| `cone_inner_angle > cone_outer_angle` | info if both ≤ 90 (inverse cone, "useful for rotors"), error otherwise | `example.sdef` only defines inverse cones with both angles ≤ 90 |
| `streaming = true` and `detached = true` | warning | `example.sdef`: streaming "implies detached=false" |

The full list of messages is in the [parameter reference](../reference/sdef-parameters.md#lint-messages).

## Distance attenuation

`example.sdef` documents the gain-vs-distance curve:

```text
silent_radius → peak_radius      linear 0.0 → 1.0
peak_radius   → inner_radius     linear 1.0 → 0.85
inner_radius  → outer_radius/2   inverse distance law
outer_radius/2 → outer_radius    linear → 0.0
```

`gainAtDistance(d, r)` implements it piece by piece and returns a value between 0 and 1, *before* the
`gain` multiplier:

| Distance | Gain |
|---|---|
| `d < silent` | 0 |
| `silent ≤ d < peak` | `(d − silent) / (peak − silent)` (or 1 if `peak = silent`) |
| `peak ≤ d < inner` | `1 − 0.15 · (d − peak) / (inner − peak)` |
| `inner ≤ d < outer/2` | `0.85 · inner / d` |
| `outer/2 ≤ d < outer` | value at `outer/2`, falling linearly to 0 at `outer` |
| `d ≥ outer` | 0 |

The inverse-law segment is scaled by 0.85 so the curve is continuous at `inner_radius`, where
`example.sdef` says the gain is "0.85 of the maximum". The editor draws this curve from
`attenuationRadii(params)` (see [SDEF editor](../features/sdef-editor.md)).

### The "only one radius set" rule

From `example.sdef`: *if only one of the radiuses is set, the other one is calculated automatically*,
with `outer_radius = inner_radius / silence_threshold` and a silence threshold of **0.001 (−60 dB)**.
`attenuationRadii` applies it:

| Set in the file | Effective values |
|---|---|
| neither | `inner = 1`, `outer = 1000` (engine defaults) |
| only `inner_radius` | `outer = inner / 0.001` (e.g. inner 20 → outer 20 000 m) |
| only `outer_radius` | `inner = outer × 0.001` (e.g. outer 2000 → inner 2 m) |

This is why setting only `inner_radius = 50` makes a sound audible 50 km away. The linter's info
message shows you the derived value so this never happens by accident.
