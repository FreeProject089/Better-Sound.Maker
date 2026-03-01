# What's New in v1.0.6 - Better Sound.maker

Welcome to **v1.0.6**! This version is a major step forward for customization, bringing the long-awaited **Custom Sound Type Manager**.

## 🏷️ Custom Sound Type Manager
You can now fully control how your sounds are categorized!
- **Create Custom Types**: Add your own types with custom labels, descriptions, and a selection of over 100+ high-quality icons.
- **Regex Logic Rules**: Define powerful Regular Expression rules to automatically assign sounds to your custom types based on their file paths.
- **Rule Priority**: Your custom rules are evaluated first, allowing you to override default DCS categorizations for your specific mods.
- **Sharing & Presets**: Export your custom types as `.json` files or embed them directly into your Presets to share your entire setup with teammates.


## 📂 Advanced Project Loading
- **Load from Unzipped Folders**: In addition to `.zip` archives, you can now load existing mods directly from a folder on your disk (Electron only).
- **Format Picker**: A new modal helps you choose between Zip or Folder formats when importing an existing mod.

## 🔍 Enhanced Assets Library & Scanner
- **DCS Assets Scanner**: The scanner is now more robust and supports scanning both your DCS root and your Saved Games mods folder simultaneously.
- **Manual SDEF Loading**: If the auto-scanner doesn't find what you need, you can manually load a legacy `sdef_and_wave_list.txt` file.


## 📂 Project View Improvements
- **Smart Folder Highlighting**: In the Project page, the folder that *directly* contains your SDEF files is now highlighted in **Electric Blue** with a subtle outer glow. This "Leaf Folder" indicator acts as a compass, showing you exactly where you are in deep file structures like `AH-61D/Cockpit`.
- **Enhanced Table Layout**: Fixed alignment issues in the Project table headers (ACTIONS/EDIT). The table now uses a fixed layout and a minimum width to ensure buttons stay perfectly aligned regardless of content.
- **Button Micro-Animations**: Interactive buttons in the project and custom type tables now feature subtle hover scaling for a more responsive feel.

## 🛠️ Bug Fixes & UI Polish
- **Fixed Preset 404 Error**: Resolved a persistent error when fetching community presets by improving `Load.cfg` precedence and respecting the `DisableCommunityPresets` setting.
- **Improved FAQ**: Added 7 new questions to the F.A.Q covering audio formats, installation troubleshooting, and custom types.
- **Installation Guide**: A new step-by-step guide is available in the Documentation page to help you install your mods correctly.
- **Modal Icons**: Added icons to the "Assign to Type" dropdown in the rule editor for better visual identification.

---
*Thank you for using Better Sound.maker. Happy modding! 🎧*

