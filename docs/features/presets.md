# Presets

!!! tip "Prefer it step by step?"

    The task version of this page is [Use a preset](../guide/use-a-preset.md).

A **preset** is a saved selection of sounds from the [Assets Library](library.md). It records
*which* SDEFs are selected, not their parameter values and not your audio. Use presets to get back
a set of sounds quickly ("every F/A-18C switch"), to start a new mod from a known list, or to
share that list with others.

!!! note "Presets and templates are different things"

    A preset is a list of sounds. A **template**, in the [SDEF editor](sdef-editor.md#templates),
    is a set of parameter values. They do not overlap.

<!-- screenshot: the Presets page with a few saved presets and the Community Presets button -->

## Create a preset

Select sounds in the library, open **Presets**, type a **Preset Name** and press **Save Current
Selection**. The button shows how many assets it will save.

## Saved presets

Each saved preset shows its name and number of assets, with:

| Button | What it does |
|---|---|
| **Apply** | Adds the preset's sounds to your current selection. BSM first asks: **Save Current & Apply** saves your current selection as a preset before applying; **Apply Without Saving** just applies. |
| **Export** | Saves the preset as a JSON file you can share. If you have [custom sound types](sound-types.md), BSM offers to attach them to the file. |
| Delete | Removes the preset, after confirmation. |

**Import Preset** loads a preset file. If it carries custom sound types, BSM asks whether to add
them to yours (**Yes, Import Types**) or to import the sounds only (**No (Assets Only)**).

Presets are applied against your library. If the library is not loaded yet, BSM shows **Load
Library Data** first.

## Community presets

**Community Presets** lists presets shared by the community through a catalog. Import one to add
it to your saved presets. When a preset you already have changed in the catalog, its button
offers to update it.

The list comes from a `catalog.json` online:

- by default, the official community catalog;
- or the URL set in [Settings → Community catalog](settings.md#community-catalog).

BSM keeps the last catalog it downloaded. With no connection, it shows that copy and says so. If
the button is missing, community presets are turned off in [`Load.cfg`](../reference/load-cfg.md)
(`DisableCommunityPresets = true`).

To publish your own presets in a catalog: [Catalog format](../reference/catalog-format.md). How
the app finds and caches it: [Catalog loading](../how-it-works/catalog-loading.md).
