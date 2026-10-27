# Préréglages

!!! tip "Vous préférez le pas à pas ?"

    La version « tâche » de cette page est [Utiliser un préréglage](../guide/use-a-preset.md).

Un **préréglage** (preset) est une sélection de sons de la [Bibliothèque](library.md)
enregistrée. Il retient *quels* SDEF sont sélectionnés, pas leurs valeurs de paramètres ni votre
audio. Servez-vous-en pour retrouver vite un ensemble de sons (« tous les interrupteurs du
F/A-18C »), pour démarrer un nouveau mod à partir d'une liste connue, ou pour partager cette
liste.

!!! note "Préréglages et modèles sont deux choses différentes"

    Un préréglage est une liste de sons. Un **modèle**, dans l'[éditeur SDEF](sdef-editor.md#modeles),
    est un ensemble de valeurs de paramètres. Ils ne se recoupent pas.

<!-- screenshot: the Presets page with a few saved presets and the Community Presets button -->

## Créer un préréglage

Sélectionnez des sons dans la bibliothèque, ouvrez **Préréglages**, saisissez un nom et appuyez
sur **Enregistrer la Sélection**. Le bouton indique combien d'assets seront enregistrés.

## Préréglages enregistrés

Chaque préréglage affiche son nom et son nombre d'assets, avec :

| Bouton | Rôle |
|---|---|
| **Appliquer** | Ajoute les sons du préréglage à votre sélection actuelle. BSM demande d'abord : **Sauvegarder & Appliquer** enregistre votre sélection actuelle comme préréglage avant d'appliquer ; **Appliquer sans sauvegarder** applique directement. |
| **Exporter** | Enregistre le préréglage en fichier JSON à partager. Si vous avez des [types de sons personnalisés](sound-types.md), BSM propose de les joindre au fichier. |
| Supprimer | Retire le préréglage, après confirmation. |

**Importer un Préréglage** charge un fichier de préréglage. S'il contient des types de sons
personnalisés, BSM demande s'il faut les ajouter aux vôtres (**Oui, Importer les Types**) ou
n'importer que les sons.

Les préréglages s'appliquent sur votre bibliothèque. Si elle n'est pas encore chargée, BSM
affiche d'abord **Charger la Bibliothèque**.

## Préréglages communautaires

**Presets Communautaires** liste les préréglages partagés par la communauté via un catalogue.
Importez-en un pour l'ajouter à vos préréglages. Quand un préréglage que vous avez déjà a changé
dans le catalogue, son bouton propose de le mettre à jour.

La liste vient d'un `catalog.json` en ligne :

- par défaut, le catalogue communautaire officiel ;
- ou l'URL réglée dans [Paramètres → Catalogue communautaire](settings.md#catalogue-communautaire).

BSM garde le dernier catalogue téléchargé. Sans connexion, il affiche cette copie et le signale.
Si le bouton est absent, les préréglages communautaires sont désactivés dans
[`Load.cfg`](../reference/load-cfg.md) (`DisableCommunityPresets = true`).

Pour publier vos préréglages dans un catalogue : [Format du catalogue](../reference/catalog-format.md).
Comment l'application le trouve et le met en cache : [Chargement du catalogue](../how-it-works/catalog-loading.md).
