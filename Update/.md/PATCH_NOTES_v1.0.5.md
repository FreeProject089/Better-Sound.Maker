# Patch Notes v1.0.5 - Better Sound.maker

## ✨ Improvements & Fixes
- **Project Persistence**: Manually loaded mods (.zip) and their associated audio files are now correctly saved to the local database (IndexedDB). If you reload or refresh the application while working, your mod in progress will remain displayed with all its sounds!
- **Load Mod Button**: Added the "Load Existing Mod" button to the Project page even when no assets are currently selected, making it easier to load saved mods from an empty project.
- **Credits Page Refinement (License)**: The logic for reading the Apache-2.0 license has been optimized. It is now first searched in `public/LICENSE` (or via local fetch API) if the application is running offline / in local developer mode.
- **Theme Guide Update**:
  - The documentation regarding the required size for the mod icon (`icon.png`) now correctly displays the resolution as **86x86 px**.
  - Clarified the size of the base menu and loading screen backgrounds, which are **1920x1080 minimum** but can adopt higher resolutions (variable).

- **True 3D Audio Simulation (Editor)**: The Project page preview player now natively integrates the Web Audio API to interpret the SDEF's `position = {forward, up, right}`. Sounds pan dynamically left/right based on the `right` offset vector and simulate distance attenuation based on X/Y/Z distance relative to `inner_radius`.
- **SDEF Multi-Wave Export Fixed**: Corrected an async issue where the mod-builder would finalize the ZIP archive before fetching the individualized local blobs of SDEF multi-waves (e.g. `listmode = RANDOM` with multiple `.wav` array items). They now properly export payload audio binaries into the `.zip`.
- **Wave Audio Drag & Drop Metadata**: Dragging a specific audio wave file into the Assets Library Detail Panel no longer bypasses the metadata parser. It correctly detects the `channels` as "Mono" or "Stereo" instead of defaulting to "Unknown".
- **Multi-Wave Layout Alignment**: Reworked the CSS Flexbox alignment on the multi-wave asset row inside the Project page preventing the delete `(🗑️)` button and tags from shrinking or clipping visually.
- **Search Memory Glitch**: Fixed a bug on the Assets Library tracking where navigating away to Settings or Project and back would retain the `searchQuery` variable in the code but incorrectly empty the input box. The bar now consistently re-populates with the exact text upon mounting the library view if a filter is active.
- **Settings Save Button**: Appended the correct `save` SVG Lucide icon into the Save Settings button with proper flex spacing.

---
*Created with Better Sound.maker*
