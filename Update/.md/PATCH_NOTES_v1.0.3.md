# Patch Notes - v1.0.3
**Better Sound.Maker - Technical Update Details**

## [v1.0.3] - 2026-02-21

### 🟢 Added Features & Enhancements
- **Community Presets & Sync System:**
    - Implementation of a hybrid fetching system: **GitHub API** primary source with local filesystem fallback.
    - Added **Cache-Busting** mechanism using unique timestamps (`?t=`) in fetch requests to bypass GitHub's 5-minute CDN cache.
    - Introduced `UpdateNumber` in preset schema for precise version tracking regardless of semantic string formatting.
    - Added **Background Update Detection**: The app now automatically checks for updates of locally installed presets against the community repository.
    - Added "Update Available" button directly on local preset cards for one-click synchronization.
    - Added "Refresh" action in the Community Presets modal to force re-fetching network data.
- **Improved Export Workflow:**
    - New pre-export confirmation modal: allows users to explicitly set the `version` and `UpdateNumber` before generating the `.json` file.
- **Presets Management:**
    - "Edit Preset" overhaul: added ability to update preset contents with the current project selection without creating a new preset.
    - Automatic `UpdateNumber` incrementation when merging current project state into an existing preset.
    - Integrated **Pickr** color picker in Edit mode for better UI consistency.

### 🟡 Optimizations & Refactoring
- **SDEF Editor Resilience:**
    - Optimized `collectVisualParams` to be non-destructive: it now performs a delta-update on the parameters object, preserving custom lines/keys added via Raw mode.
    - Mode switching (`Visual` <-> `Raw`) now triggers a full re-parse/regeneration to ensure data integrity.
    - Improved SDEF Parser to handle trailing comments (`-- comment`) without corrupting numerical or boolean inputs.
- **State Management:**
    - Explicit `updateUnsavedSdef` and `clearUnsavedSdef` tracking to prevent data loss when navigating between different files or pages.
    - Added `UpdateNumber` default injection (initialized at 1) for all newly created local presets.
- **Assets Library:**
    - Hardened `buildFolderTree` logic to handle legacy cache objects missing `treePath` data by falling back to SDEF paths.
    - Refined library loading sequence in `main.js` with more granular progress reporting.

### 🔴 Bug Fixes
- **Presets UI:**
    - Fixed `e.target` vs `e.currentTarget` bug where clicking an icon inside the "Install" button would fail the preset lookup.
    - Fixed data persistence issue where modal input values were lost during the closing animation before they could be read by the state manager.
    - Fixed CORS issue when using strict `Cache-Control` headers on GitHub API requests (moved to URL-based cache busting).
- **Core Editor:**
    - Fixed "Ghost Params" issue where switching from Raw to Visual mode would sometimes reset custom parameters to defaults.
    - Fixed SDEF save bug where Raw edits weren't applied if the file was saved while the textarea was still active.
- **Visuals:**
    - Fixed several translation key mismatches in the Library and Presets sections (FR/EN).
    - Fixed Dev Panel visibility logic to prevent it from overlapping with bottom elements while closed.
