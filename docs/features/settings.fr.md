# Paramètres

**Paramètres** regroupe les quelques options globales de BSM. Les changements s'appliquent quand
vous appuyez sur **Enregistrer**.

<!-- screenshot: the Settings page -->

## Dossier d'installation de DCS World

Le chemin de votre installation de DCS World, par exemple
`C:\Program Files\Eagle Dynamics\DCS World`. BSM y lit la liste des sons du jeu quand il
[scanne la bibliothèque](library.md#remplir-la-bibliotheque-le-scanner). Saisissez-le, ou appuyez
sur **Sélectionner un dossier**. Le bouton dossier à côté ouvre le chemin dans l'Explorateur.

## Catalogue communautaire

L'adresse du `catalog.json` qui liste les
[préréglages communautaires](presets.md#prereglages-communautaires) et les packs de types de sons.

- **Laissez vide** pour utiliser le catalogue communautaire officiel. C'est ce que veulent la
  plupart des gens.
- **Saisissez une URL** (commençant par `http://` ou `https://`) pour utiliser un autre
  catalogue : celui de votre équipe, ou un catalogue en test.
- **Tester** charge le catalogue immédiatement et indique ce qu'il contient, par exemple
  *Catalog OK: 12 presets, 2 sound-type packs*. S'il est injoignable, le message précise quelle
  copie BSM utilise à la place.

Le catalogue peut aussi être réglé avec `CommunityCatalogUrl` dans
[`Load.cfg`](../reference/load-cfg.md) ; le champ des Paramètres a la priorité. Format du fichier :
[Format du catalogue](../reference/catalog-format.md). Ordre de chargement et cache :
[Chargement du catalogue](../how-it-works/catalog-loading.md).

## Comportement & Scan

| Option | Rôle |
|---|---|
| **Appliquer Paramètres SDEF en Lecture** | Quand vous écoutez un son dans [Projets](project.md), le jouer avec le gain, le pitch et le mode de boucle du SDEF plutôt que brut. |
| **Auto-scan de l'Assets Library** | Rescanner votre installation de DCS à chaque démarrage, pour que les nouveaux modules et les mises à jour de DCS apparaissent sans appuyer sur Recharger. |
| **Garder les assets de mods importés** | Conserver dans la bibliothèque les mods importés en `.zip` lors d'un nouveau scan. |

## Ce qui n'est pas ici

Certaines options se règlent dans le fichier `Load.cfg` livré avec l'application et non sur cette
page, comme la désactivation des mises à jour automatiques (`DisableAutoUpdate`) ou des
préréglages communautaires (`DisableCommunityPresets`). Voir [Load.cfg](../reference/load-cfg.md).

La langue de l'interface se change depuis la barre latérale, et la visite guidée se relance avec
**Relancer Tuto**.
