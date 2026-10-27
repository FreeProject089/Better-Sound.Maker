---
title: Better Sound.Maker
hide:
  - navigation
  - path
---

<div class="bsm-hero" markdown>

![](assets/logo.png){ .bsm-hero__logo width="96" height="96" }

<div class="bsm-hero__body" markdown>

# Better Sound.Maker

Make DCS World sound mods without writing Lua: pick the sounds, drop in your audio, tune them,
and get a mod folder that is ready to install.
{ .bsm-hero__tagline }

<div class="bsm-hero__actions" markdown>

[:material-download: Download](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest){ .md-button .md-button--primary }
[:material-rocket-launch-outline: Get started](getting-started/install.md){ .md-button }

</div>

Free and open source · Apache-2.0 · English & français
{ .bsm-hero__meta }

</div>
</div>

<!-- screenshot: the Assets Library with a few SDEFs selected and the detail panel open -->

## The one idea

DCS never plays an audio file directly. It plays a **sound definition** (an `.sdef` file), and
the SDEF says which audio file to use and how to play it: volume, pitch, distance, loop.
A sound mod is a folder that ships **SDEFs with the same names** as the game's, plus your audio.
DCS loads your SDEF instead of its own, and your sound plays.

Better Sound.Maker (BSM) does exactly that, in four moves:

1. **Find** the SDEFs you want to replace in the [Assets Library](features/library.md).
2. **Replace** their audio in your [Project](features/project.md).
3. **Tune** them if you want, in the [SDEF editor](features/sdef-editor.md).
4. **Build** the mod folder on the [Build](features/build.md) page.

Nothing in your DCS installation is changed. The mod is a separate folder that goes in
`Saved Games\DCS\Mods\resource\`. New to this? Read
[How DCS sound mods work](getting-started/dcs-sound-mods.md) first: five minutes, and the rest
makes sense.

## How to read these docs

| You want to… | Read |
|---|---|
| Install BSM and set it up | [Getting started](getting-started/install.md) |
| Do one thing, step by step | [Step by step](guide/index.md): short task lists you can tick |
| Know what every button on a screen does | [Features](features/library.md): one page per screen |
| Understand what happens under the hood | [How it works](how-it-works/index.md) |
| Look up a parameter, a file format or a fix | [Reference](reference/sdef-parameters.md) |

The first three sections are for people making mods. *How it works* and *Reference* are for the
curious and for contributors.

!!! tip "The app has its own help too"

    The **Documentation** and **F.A.Q** pages inside BSM cover SDEF parameters, audio formats and
    installation. These docs go further and follow the app screen by screen.
