# Theme

A sound mod can also change a few images of the DCS interface: its icon in the mod list, the main
menu logo, the loading screen and more. The **Theme** page (*Theme & Settings* in the sidebar)
collects those images. It is optional: leave it off and your mod is sound only.

<!-- screenshot: the Theme page with the toggle on and two slots filled -->

## Turn it on

Switch on **Enable Theme**. With it on, the build adds a `Theme/` folder to the mod with your
images, and `entry.lua` gets the lines that make DCS use them. You can also switch it on or off
from the [Build](build.md) page (**Enable Theme**).

## The image slots

| Slot | Where DCS shows it |
|---|---|
| **Mod Icon** | Next to your mod in the DCS mod manager. Transparency is supported. |
| **Main Menu Logo** | On the DCS main menu. |
| **Loading Screen** | Behind the mission loading screen. |
| **Briefing Map Background** | Behind the mission briefing map. |
| **Base Menu Window** | Behind the base menu window. |

Click a slot to upload an image, **Remove** to clear it. Empty slots are simply left out.

## Image tips

- Use **PNG** files.
- Backgrounds (loading, menu) should be at least **1920×1080**. Larger works but uses more video
  memory.
- The in-app **Documentation → Theme Guide** tab lists the recommended size for each slot.

## Related

- [Build](build.md): where the theme ends up in the mod.
