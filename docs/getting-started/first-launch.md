# First launch

The first time you open Better Sound.Maker, a short guided tour starts. This page explains what it
asks and what to do right after.

## 1. Choose your language

The first screen of the tour is **Welcome / Bienvenue**. Pick **English** or **Français**: the
whole interface switches at once. You can change it again later from the language selector in the
sidebar.

<!-- screenshot: the onboarding language step -->

## 2. Follow (or skip) the tour

The tour then visits each screen in the sidebar: Assets Library, Projects, SDEF Editor, Theme,
Presets, Sound Types, Collaboration, Build, Settings, Documentation and Credits. Each step opens
the screen it talks about, so you see where things are.

Press **Next** to move on, or **Skip** to close it. To see it again, use **Tutorial** in the
sidebar's Help section.

## 3. Set your DCS path

BSM reads the list of DCS sounds from your DCS World installation, so it needs to know where it
is. You can set it in two places:

- **Settings → DCS World Directory**: type the path or press **Select Folder**.
- **The scanner** that opens from the Assets Library (next step), which asks for it too.

A typical path is `C:\Program Files\Eagle Dynamics\DCS World`. Steam installs live under
`…\steamapps\common\DCSWorld`.

!!! warning "Scan a clean install"

    The scanner reads what is in the DCS folder. If mods were copied into the game folder itself,
    their files end up in your library as if they were the game's. Scan a DCS install with no
    mods in it. Mods in `Saved Games` are fine: they are scanned separately, and only if you ask.

## 4. Scan the library

Open **Assets Library**. On a first run the **DCS Assets Scanner** opens.

- [ ] **DCS Installation Path**: your DCS folder.
- [ ] **Saved Games Path (Optional)**: for example `C:\Users\<you>\Saved Games\DCS`, if you also want the sounds of mods installed there.
- [ ] Press **Start Scan**.

BSM reads `Doc\Sounds\sdef_and_wave_list.txt`, your `CoreMods` folder and, if set, your Saved
Games mods. When it is done, the library fills with every SDEF it found, sorted into folders. The
result is kept, so the next start is quick.

**Manual File** loads a sound list file you pick yourself instead of scanning.

To rescan later (after a DCS update or a new module), press **Reload Library** in the library.
**Settings → Auto-scan Assets Library** does it on every start.

## Next

You are ready. [Make your first mod](../guide/first-mod.md), or read
[How DCS sound mods work](dcs-sound-mods.md) if SDEFs are new to you.
