# Patch Notes v1.0.6 - Better Sound.Maker

## ✨ New Features

- **Custom Sound Type Manager**: A brand-new page allowing you to manage and create sound types.
  - **Custom Types**: Define types with custom labels, descriptions, and Lucide icons.
  - **Regex Assignment**: Create rules to automatically assign sounds to types based on folder or filename patterns.
  - **Import/Export**: Share your custom types as `.json` files.
  - **Preset Integration**: Custom types can now be embedded in Presets for seamless sharing.


- **Load Mod from Folder**: The "Load Existing Mod" button now supports both `.zip` archives and **unzipped folders** directly on disk. A format picker modal lets you choose freely. Useful when working directly from an already-built or extracted mod directory.

- **Smart Sound Type System (JSON-driven)**: Sound type detection in the Assets Library is now fully driven by JSON rule files. The app merges the bundled `default.json` with user-defined rules.

- **HTML Entity Icons for Type Tags**: Type tags in the Assets Library now use safe HTML entities for consistent rendering across platforms.

- **Note Expand Button**: Large notes now feature a "…more" button that opens a modal, keeping the library rows concise.

- **`TypeDetection` flag in Load.cfg**: Allows enabling or disabling the smart sound-type detection system at launch.

## 📂 UI & UX Improvements

- **Smart Folder Highlighting**: Implemented "Leaf Folder" highlighting on the Project page. The folder directly containing SDEF files is highlighted in **Electric Blue** with a glow.
- **Folder Tree Compression**: Single-child folder structures are now collapsed into a single row (GitHub style) for easier navigation.
- **Micro-Animations**: Added hover scaling animations to project and table action buttons for better interactivity.
- **Enhanced Layout**: Fixed table alignment issues in the Project view, ensuring buttons are always centered and properly spaced.

## 🐛 Bug Fixes

- **Fixed Preset 404 Error**: Improved initialization precedence in `main.js`. `APP_CONFIG` from `Load.cfg` is now loaded immediately, ensuring `DisableCommunityPresets` is respected before any preset check occurs.
- **Backslash path splitting**: Fixed a regex escape bug in the DCS scanner for Windows paths.
- **Asset Display Fixes**: Filenames are now displayed prominently while paths are moved to a secondary line to reduce visual clutter.

## 📖 Documentation

- **Enhanced FAQ**: Added entries for audio formats, folder structures, and troubleshooting steps.

---
*Created with Better Sound.Maker*

