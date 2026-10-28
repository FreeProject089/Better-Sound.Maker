# Catalog format

Better Sound.Maker reads community content from a single **catalog.json** reachable by URL.
The catalog lists presets and sound-type packs; each entry points at its own JSON file.

| File | Schema | Where |
|---|---|---|
| `catalog.json` | [`schemas/catalog.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/catalog.schema.json) | community repo root (remote) · `public/catalog.json` (bundled) |
| `preset_*.json` | [`schemas/preset.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/preset.schema.json) | anywhere the catalog points to |
| sound-type pack | [`schemas/sound-types.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/sound-types.schema.json) | `public/sound-types/` (bundled) or listed in `soundTypes` |

All files are **UTF-8 JSON**. The validator rejects anything else.

## How the app loads it

1. **Remote catalog**: the URL from *Settings → Community catalog*, then `CommunityCatalogUrl` in `src/Load.cfg`, then the official
   `https://raw.githubusercontent.com/BetterDCS/Better-Sound.Maker-Community-Presets/main/catalog.json`.
   Results are cached for 5 minutes.
2. **Offline copy**: the last remote catalog that loaded successfully, kept in local storage.
3. **Bundled catalog**: `public/catalog.json`, which ships with the app.

If the official repo has no `catalog.json` yet, the app falls back to listing its `preset_*.json` files through the GitHub API (the old behaviour).
Set `DisableCommunityPresets = true` in `Load.cfg` to turn all of this off.

Every file is validated on load (`src/catalog/schema.js`). Invalid entries are skipped and logged in the console. One broken file never breaks the whole catalog.

## catalog.json

```json
{
  "$schema": "https://raw.githubusercontent.com/FreeProject089/Better-Sound.Maker/main/schemas/catalog.schema.json",
  "schemaVersion": 1,
  "name": "Better Sound.Maker Community Catalog",
  "presets": [
    { "id": "fa-18c", "url": "presets/preset_FA-18C.json" }
  ],
  "soundTypes": [
    { "id": "community", "url": "sound-types/community.json" }
  ]
}
```

- `url` can be relative (resolved against the catalog's own URL) or absolute `https://…`. You can point at files hosted elsewhere.
- `id` is optional and defaults to the file name. It must be unique within its list.

## Presets

```json
{
  "name": "FA-18C Hornet",
  "color": "#cddc39",
  "version": "1.0.3",
  "UpdateNumber": 2,
  "date": "2026-02-21T04:21:26.462Z",
  "author": "YourName",
  "description": "Every Hornet engine and cockpit sound",
  "tags": ["aircraft", "jet"],
  "assetPaths": ["Aircrafts/FA-18/Afterburner.sdef"]
}
```

- `name` identifies the preset. Users who imported it get an **Update available** button when the catalog has the same name with a higher `UpdateNumber`. On equal `UpdateNumber`, a higher `version` wins.
- **Increase `UpdateNumber` every time you publish a change.**
- `assetPaths` are SDEF paths relative to `Sounds/sdef`, with forward slashes.
- Optional `customTypes` embeds a sound-type pack that is installed together with the preset.

The easiest way to produce one is *Presets → Export* in the app.

## Sound-type packs

```json
{
  "types": {
    "helicopter_rotor": { "label": "Rotor", "lucideIcon": "fan", "description": "Main/tail rotor loops" }
  },
  "rules": [
    { "match": "rotor", "type": "helicopter_rotor" }
  ]
}
```

- Type ids use lowercase letters, digits, `_` and `-`. Icons are [Lucide](https://lucide.dev/icons) names.
- `match` is a JavaScript regex tested case-insensitively against the SDEF path. **The first matching rule wins.**
- Load order: bundled packs from `public/sound-types/index.json` (in order), then community packs, then the user's custom types. Custom types go first so they take priority.
- A rule may use a type defined by an earlier pack.

## Adding something to the community catalog

1. Drop the file in the community repo: `presets/preset_<Name>.json` or `sound-types/<name>.json`.
2. Regenerate and validate the manifest:
   ```bash
   node path/to/Better-Sound.Maker/scripts/catalog.mjs build .
   ```
   This writes `catalog.json` and validates every file it lists.
3. Open a PR. CI (or a reviewer) runs the same command.

To check the app's bundled data:

```bash
npm run catalog:validate
```

To test your own catalog before publishing, paste its raw URL in *Settings → Community catalog* and click **Test**.
