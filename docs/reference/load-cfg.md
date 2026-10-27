# Load.cfg

[`src/Load.cfg`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/Load.cfg) holds
build-time switches. `src/main.js` imports it as raw text, splits each line at the first `=`, trims
both sides and stores the result in `window.APP_CONFIG` (see [Architecture](../how-it-works/architecture.md#boot-sequence)).

!!! warning "Build time only"
    The file is bundled into the app when it is built. Editing a `Load.cfg` in an installed copy
    does nothing. Values are strings: only the exact text `true` / `false` is recognised.

| Key | Shipped value | Read by | Effect |
|---|---|---|---|
| `ProdMode` | `true` | `src/main.js` (`initDebugPanel`) | `false` shows a floating **DEV PANEL** (start onboarding, etc.) |
| `DisableAutoUpdate` | `false` | `src/main.js`, `src/components/nav.js` | `true` skips the automatic update check at start-up, and the sidebar *update* button shows an "Updates Disabled" dialog instead of checking |
| `DisableCommunityPresets` | `false` | `src/catalog/catalog.js`, `src/pages/presets.js` | `true` disables the community catalog (presets **and** community sound-type packs) and hides the *Community* button on the Presets page |
| `LocalLicense` | `true` | `src/pages/credits.js` | `true`: the Credits page reads the license from the installed files (desktop: `public/LICENSE` in the resource folder; web: `./LICENSE`). `false`: it is loaded from GitHub |
| `TypeDetection` | `true` | `detectSoundType` (`src/utils/audio-analyzer.js`) | `false` turns the smart sound-type labels off: every sound is classified as *Generic* |
| `CommunityCatalogUrl` | *(empty)* | `src/catalog/catalog.js` | catalog URL used when none is set in *Settings*; empty means the default community repo (see [Catalog loading](../how-it-works/catalog-loading.md)) |
