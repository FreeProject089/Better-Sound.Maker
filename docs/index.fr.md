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

Créez des mods sonores pour DCS World sans écrire de Lua : choisissez les sons, ajoutez votre
audio, réglez-les, et obtenez un dossier de mod prêt à installer.
{ .bsm-hero__tagline }

<div class="bsm-hero__actions" markdown>

[:material-download: Télécharger](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest){ .md-button .md-button--primary }
[:material-rocket-launch-outline: Commencer](getting-started/install.md){ .md-button }

</div>

Libre et open source · Apache-2.0 · English & français
{ .bsm-hero__meta }

</div>
</div>

<!-- screenshot: the Assets Library with a few SDEFs selected and the detail panel open -->

## L'idée centrale

DCS ne joue jamais un fichier audio directement. Il joue une **définition de son** (un fichier
`.sdef`), et ce SDEF indique quel fichier audio utiliser et comment le jouer : volume, hauteur,
distance, boucle. Un mod sonore est un dossier qui fournit des **SDEF portant les mêmes noms**
que ceux du jeu, plus votre audio. DCS charge votre SDEF à la place du sien, et c'est votre son
qui est joué.

Better Sound.Maker (BSM) fait exactement cela, en quatre temps :

1. **Trouver** les SDEF à remplacer dans la [Bibliothèque d'assets](features/library.md).
2. **Remplacer** leur audio dans votre [Projet](features/project.md).
3. **Régler** si besoin, dans l'[éditeur SDEF](features/sdef-editor.md).
4. **Générer** le dossier du mod sur la page [Build](features/build.md).

Rien n'est modifié dans votre installation de DCS. Le mod est un dossier séparé, à placer dans
`Saved Games\DCS\Mods\resource\`. Vous débutez ? Lisez d'abord
[Comment fonctionnent les mods sonores DCS](getting-started/dcs-sound-mods.md) : cinq minutes,
et la suite devient claire.

## Comment lire cette documentation

| Vous voulez… | Lisez |
|---|---|
| Installer BSM et le configurer | [Bien démarrer](getting-started/install.md) |
| Faire une chose, étape par étape | [Pas à pas](guide/index.md) : de courtes listes à cocher |
| Savoir à quoi sert chaque bouton d'un écran | [Fonctionnalités](features/library.md) : une page par écran |
| Comprendre ce qui se passe en coulisses | [Fonctionnement](how-it-works/index.md) |
| Retrouver un paramètre, un format de fichier, une solution | [Référence](reference/sdef-parameters.md) |

Les trois premières sections s'adressent aux créateurs de mods. *Fonctionnement* et *Référence*
sont pour les curieux et les contributeurs.

!!! tip "L'application a aussi sa propre aide"

    Les pages **Documentation** et **F.A.Q** de BSM couvrent les paramètres SDEF, les formats
    audio et l'installation. Cette documentation va plus loin et suit l'application écran par
    écran.
