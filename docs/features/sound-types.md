# Sound types

Every sound in the [Assets Library](library.md) gets a **type**: engine, weapon, radio, switch…
Types make the library easier to read and to filter, and they decide the **default SDEF values**
BSM uses when it writes a new SDEF for a sound. The **Sound Type Manager** shows the types and
lets you add your own.

<!-- screenshot: the Sound Type Manager with default types, a custom type and a rule -->

## How a type is chosen

BSM tests each SDEF path (in lowercase) against a list of **rules**. A rule is a regular
expression (regex) and the type it assigns. The first rule that matches wins:

1. your **custom rules**, top to bottom;
2. then the **built-in rules**.

So a custom rule always beats a built-in one.

## The page

| Part | What it shows |
|---|---|
| Counters | Default types, custom types, custom rules, and the number of SDEFs in the library. |
| **Default Types (built-in)** | The types that ship with BSM. |
| **Custom Types** | The ones you created. |
| **SDEF ↔ Type Mapping Rules** | Every rule, with its regex, assigned type and source (yours or built-in). |

## Create a custom type

Press **Create Custom Type** and fill in:

| Field | Example |
|---|---|
| **Type ID** (unique, lowercase, no spaces) | `helicopter_rotor` |
| **Display Label** | `Helicopter Rotor` |
| **Description** | `Rotor blade sounds` |
| **Icon** | pick one |
| **Matching Rule** (optional regex) | `rotor|blade|prop` |

Leave the rule empty if you only want to assign the type through separate rules.

## Add a rule

Press **Add Rule**, type a **Regex Pattern**, and choose the type to **Assign to**. Some patterns:

| Pattern | Matches |
|---|---|
| `canopy` | any path containing *canopy* |
| `f-16|f16` | either spelling |
| `^effects/aircrafts/f18/` | only paths that start this way |
| `burner\.sdef$` | only paths that end this way |

The in-app **Documentation → Sound Types** tab has more examples.

## Share types

**Export Custom Types** saves your types and rules to a file; **Import Types** loads one. Types can
also travel inside a [preset](presets.md): when you export a preset, BSM offers to attach them, and
whoever imports it is asked whether to add them.
