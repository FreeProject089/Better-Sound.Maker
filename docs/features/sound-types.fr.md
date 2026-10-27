# Types de sons

Chaque son de la [Bibliothèque](library.md) reçoit un **type** : moteur, arme, radio,
interrupteur… Les types rendent la bibliothèque plus lisible et plus facile à filtrer, et ils
déterminent les **valeurs SDEF par défaut** que BSM utilise quand il écrit un nouveau SDEF pour un
son. Le **Gestionnaire des Types de Sons** affiche les types et vous permet d'ajouter les vôtres.

<!-- screenshot: the Sound Type Manager with default types, a custom type and a rule -->

## Comment un type est choisi

BSM teste le chemin de chaque SDEF (en minuscules) contre une liste de **règles**. Une règle est
une expression régulière (regex) et le type qu'elle attribue. La première règle qui correspond
l'emporte :

1. vos **règles personnalisées**, de haut en bas ;
2. puis les **règles intégrées**.

Une règle personnalisée passe donc toujours avant une règle intégrée.

## La page

| Partie | Contenu |
|---|---|
| Compteurs | Types par défaut, types personnalisés, règles personnalisées, et nombre de SDEF dans la bibliothèque. |
| **Types par Défaut (intégrés)** | Les types livrés avec BSM. |
| **Types Personnalisés** | Ceux que vous avez créés. |
| **Règles SDEF ↔ Types** | Toutes les règles, avec leur regex, le type attribué et leur source (vous ou intégrée). |

## Créer un type personnalisé

Appuyez sur **Créer un Type Personnalisé** et remplissez :

| Champ | Exemple |
|---|---|
| **ID du Type** (unique, minuscules, sans espace) | `helicopter_rotor` |
| **Libellé Affiché** | `Helicopter Rotor` |
| **Description** | `Sons des pales du rotor` |
| **Icône** | à choisir |
| **Règle Correspondance** (regex optionnelle) | `rotor|blade|prop` |

Laissez la règle vide si vous voulez attribuer ce type uniquement par des règles séparées.

## Ajouter une règle

Appuyez sur **Ajouter une Règle**, saisissez un motif regex, et choisissez le type à attribuer.
Quelques motifs :

| Motif | Correspond à |
|---|---|
| `canopy` | tout chemin contenant *canopy* |
| `f-16|f16` | l'une ou l'autre écriture |
| `^effects/aircrafts/f18/` | seulement les chemins qui commencent ainsi |
| `burner\.sdef$` | seulement les chemins qui finissent ainsi |

L'onglet **Documentation → Types de Sons** de l'application donne d'autres exemples.

## Partager des types

**Exporter les Types** enregistre vos types et règles dans un fichier ; **Importer des Types** en
charge un. Les types peuvent aussi voyager dans un [préréglage](presets.md) : à l'export d'un
préréglage, BSM propose de les joindre, et la personne qui l'importe choisit de les ajouter ou non.
