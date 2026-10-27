# Build

**Build** (*Générateur de Mod* dans la barre latérale) transforme votre projet en mod DCS : un
dossier avec `entry.lua`, les SDEF et votre audio, organisé comme DCS l'attend, prêt à déposer
dans `Saved Games\DCS\Mods\resource\`.

<!-- screenshot: the Build page with the configuration form and the two previews -->

## Les compteurs

En haut : nombre d'**Assets**, de **fichiers audio** assignés, de **SDEF modifiés**, et état du
**Thème**. Une vérification rapide avant de générer.

## Configuration du Mod

Ces champs remplissent `entry.lua`, le fichier qui présente le mod à DCS.

| Champ | Sert à | Obligatoire |
|---|---|---|
| **Nom du Mod** | L'identifiant du mod dans `entry.lua`, et le nom du dossier (sans les espaces). | Oui |
| **Nom d'affichage** | Le nom affiché dans DCS. Par défaut, le nom du mod. | |
| **Auteur / Équipe** | Le développeur affiché dans DCS. | Oui |
| **Nom Court** | Un libellé court. Par défaut, les quatre premières lettres du nom du mod, en majuscules. | |
| **Version** | La version de votre mod, par exemple `1.0.0`. | |
| **Description** | Affichée dans la liste des mods de DCS. | |
| **URL (optionnel)** | Un lien vers la page du mod. | |
| **Crédits** | Écrits en tête de `entry.lua`. | |
| **Activer le Thème** | Ajoute le dossier `Theme/`. Même interrupteur que sur la page [Thème](theme.md). | |

**Sauvegarder Configuration** garde ces valeurs avec le projet. Le build les enregistre aussi.

## Format audio

| Option | Résultat |
|---|---|
| **Original (tel quel)** | Vos fichiers sont copiés sans changement. |
| **Tout convertir en WAV (PCM 16-bit)** | Tout devient `.wav`. Meilleure qualité, fichiers plus lourds. |
| **Tout convertir en OGG (fichiers plus légers)** | Tout devient `.ogg`. Mod plus léger. |

DCS lit aussi bien `.wav` que `.ogg`.

## Les aperçus

- **Aperçu entry.lua** montre exactement le `entry.lua` qui sera écrit.
- **Aperçu Structure** montre l'arborescence :

```text
VotreMod/
├── entry.lua
├── Theme/                 (seulement avec Activer le Thème)
│   ├── icon.png
│   └── ME/…
└── Sounds/
    ├── sdef/Effects/…     vos fichiers .sdef, à leurs chemins d'origine
    └── Effects/…          vos fichiers audio
```

Pourquoi les SDEF sont sous `Sounds/sdef/Effects/` : [Génération du mod](../how-it-works/mod-build.md).

## Modifications SDEF non enregistrées

Si des SDEF ont des modifications non enregistrées dans l'[éditeur SDEF](sdef-editor.md), un
encadré *Unsaved SDEF changes* apparaît. **Le build ignore les modifications non enregistrées.**
Appuyez sur **Save All** pour les enregistrer, ou choisissez-en un dans la liste pour l'ouvrir dans
l'éditeur.

## Construire & Exporter

Appuyez sur **Construire & Exporter**. Une barre de progression montre chaque étape, puis
*Export complete* avec le nom du mod.

| Où tourne BSM | Ce que vous obtenez |
|---|---|
| Application de bureau | Vous choisissez un dossier ; BSM y crée le dossier du mod. |
| Navigateur avec accès aux dossiers (Chrome, Edge) | Pareil, via le sélecteur de dossier du navigateur. |
| Autres navigateurs | Un téléchargement `VotreMod.zip`. |

## Installer le résultat

Copiez le dossier du mod dans `C:\Users\<vous>\Saved Games\DCS\Mods\resource\` (créez
`Mods\resource` si besoin), lancez DCS et vérifiez le mod dans la section Mods des options. Un
`.zip` doit d'abord être extrait. Les gestionnaires de mods comme OVGME fonctionnent aussi avec le
dossier.

Un problème en jeu ? [Dépannage](../reference/troubleshooting.md).
