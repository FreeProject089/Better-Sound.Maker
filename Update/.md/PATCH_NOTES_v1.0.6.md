# Patch Notes v1.0.6 - Better Sound.Maker

## New Features

- **Custom Sound Type Manager**: Integrated a dedicated management interface for sound type definitions.
  - **Type Definition**: Create and categorize sounds with distinct labels, detailed descriptions, and specific Lucide icon mappings.
  - **Regex Assignment Rules**: Implementation of a rule-based engine using Regular Expressions to automate the assignment of sound assets to specific types based on directory structures or filename patterns.
  - **Import/Export Pipeline**: Support for `.json` schema to facilitate the sharing and backup of custom sound type libraries.
  - **Preset Integration**: Custom types are now persistent within Presets, ensuring sound categorization is preserved across different environments.

- **SDEF Template Manager**: A comprehensive redesign of the preset system for .SDEF files to optimize repetitive parameter editing.
  - **Batch Application**: Templates can now be applied to the currently active asset or broadcasted to all currently selected assets in the project.
  - **Contextual Source Selection**: Allows the user to select any loaded SDEF as the data source for template generation.
  - **Granular Data Management**: Enhanced engine supporting individual preset export/import as well as full library synchronization via JSON.
  - **Localization**: Full interface support for French language within the manager.
  - **Optimized Workflow**: Transitioned to a dual-pane dashboard layout to separate library browsing from template creation and editing.

- **Advanced Search & Filtering**: Expanded the Asset Library with a new toggleable query panel.
  - **State-Based Filters**: Ability to isolate assets containing user notes or those with pending audio modifications.
  - **Compound Selection**: Supports filtering by multiple sound categories simultaneously (e.g., combining Engine and Mechanical components).
  - **Visual Indexing**: Integrated iconography into the filter menus for faster category recognition.

- **Note Visibility Improvements**: Assets with extended notes (exceeding 10 characters) now utilize a compact "Maximize" toggle, which opens the full content in a modal window to prevent table row overflow.

- **Recursive Folder Selection**: Added support for folder-level selection in the Project view. Checking a directory checkbox automatically synchronizes the selection state of all nested assets, with support for indeterminate visual states.

- **Audio Controls**: The SDEF Editor playback button now features a toggle state (Play/Stop). Audio previewing logic has been updated to strictly enforce non-looping playback.

- **Configuration Flags**: Added the `TypeDetection` parameter to `Load.cfg`, allowing users to enable or disable the automated sound-type identification system on startup.

## UX & Interface Updates

- **Targeted Folder Highlighting**: Implemented visual identification for "Leaf Folders" in the project hierarchy. Folders containing primary SDEF assets are now emphasized with an Electric Blue treatment and subtle glow effect.
- **Tree Compression Logic**: Consecutive single-child directories are now collapsed into a simplified path string, similar to repository browsing styles found on modern version control platforms.
- **Animation Layer**: Integrated subtle transition effects and hover scaling to interactive components and action buttons.
- **Layout Precision**: Refined grid alignment and padding across the Project view to ensure button positioning is mathematically centered regardless of content length.
- **Updated Modal Architecture**: Implemented a new wide-modal standard (`modal-lg` at 880px) for data-heavy interfaces, including the SDEF Template Manager and documentation views, to prevent content clipping.
- **Enhanced Document Rendering**: Completely overhauled the markdown rendering system with premium technical styling, featuring neon-accent list markers, glassmorphic headers, and improved line-height for long-form reading.
- **Redesigned Version Archive**: Thoroughly updated the centralized hub for browsing historical release notes with a dual-column grid layout, workstation-style iconography, and smoother interactive transitions.
- **Iconography System Upgrade**: Transitioned documentation and archive interfaces from unicode characters to a unified Lucide-based SVG icon library for a more professional, software-studio aesthetic.

## Bug Fixes

- **Mod Import Stability**: Resolved various synchronization and string-parsing errors (notably `toLowerCase` and `startsWith` exceptions) encountered when loading unzipped mod folders.
- **Improved SDEF Parsing**: The parser is now case-insensitive regarding parameter keys, and correctly handles non-standard casing encountered in community-made files.
- **Menu Behavior**: Fixed an issue where advanced filter panels would remain open incorrectly; they now utilize outside-click detection for automatic dismissal.
- **Data Integrity**: Implemented a mandatory secondary confirmation dialog for bulk asset removal actions to prevent data loss.
- **Visual Hierarchy**: Updated asset listing to prioritize the display of the immediate filename over the full absolute path for better readability.

## Documentation

- **Expanded FAQ**: Added technical entries regarding supported audio encoding, folder hierarchy requirements for DCS, and troubleshooting for common installation errors.

---
*Technical Documentation - Better Sound.Maker*
