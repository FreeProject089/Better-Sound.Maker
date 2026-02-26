# What's New in v1.0.5 - Better Sound.maker

Welcome to **v1.0.5** of Better ModMaker! This update brings massive improvements to how you hear and manage your sounds directly in the editor, ensuring an authentic DCS sound design experience without ever needing to launch the simulator.

## 🎧 True 3D Audio Simulation in the Editor
We have entirely rebuilt the SDEF sound preview player in the **Project** page to make it sound *exactly* like DCS:
- **Stereo Panning (Spatial Audio)**: Sounds will now accurately pan left or right in your headphones/speakers based on their mathematical `position = {forward, up, right}` setup in the SDEF file. For example, `{0, 0, 15}` will sound fully injected into your right ear!
- **Distance Attenuation**: We now simulate volume drop-off over distance! The preview player respects your `inner_radius` setting and the X/Y/Z distance to correctly simulate how weak or loud the sound will be in the game engine.

## 🗂️ SDEF Multi-Wave Support & Export Fixed
We’ve ironed out the complex systems handling SDEFs with multiple randomized or sequenced audio files!
- Assigning several custom `.wav` files to one SDEF (ex: Thunder1, Thunder2, Thunder3 under `RANDOM` mode) perfectly saves and exports inside your `.zip` mods!
- Re-designed the multi-wave layout row in the Project screen so that buttons, tags, and the remove (🗑️) button no longer clip and remain perfectly aligned.

## 🔍 Library & Quality of Life
- **Smarter Uploads**: Dropping a wave audio file to overwrite an SDEF's custom wave in the Library now perfectly scans the file to show you if it is `Mono` or `Stereo` instead of generically tagging it as "Unknown".
- **Search Memory Fixed**: The Asset Library's search bar now correctly remembers your typed queries if you navigate away and come back, no longer hiding your past inputs.
- **Project Persistence**: Reloading your app while working will keep your mod in progress safely stored, so you don't lose any audio assignments.

---
*Created with Better Sound.maker*
