# Thème

Un mod sonore peut aussi changer quelques images de l'interface de DCS : son icône dans la liste
des mods, le logo du menu principal, l'écran de chargement, etc. La page **Thème** (*Thème &
Paramètres* dans la barre latérale) rassemble ces images. Elle est facultative : laissez-la
désactivée et votre mod ne contiendra que du son.

<!-- screenshot: the Theme page with the toggle on and two slots filled -->

## L'activer

Activez **Activer le Thème**. Le build ajoute alors au mod un dossier `Theme/` avec vos images, et
`entry.lua` reçoit les lignes qui demandent à DCS de les utiliser. Vous pouvez aussi l'activer ou
le désactiver depuis la page [Build](build.md) (**Activer le Thème**).

## Les emplacements d'images

| Emplacement | Où DCS l'affiche |
|---|---|
| **Icône du Mod** | À côté de votre mod dans le gestionnaire de mods de DCS. La transparence est prise en charge. |
| **Logo Menu Principal** | Sur le menu principal de DCS. |
| **Écran de Chargement** | En fond de l'écran de chargement des missions. |
| **Fond Carte Briefing** | En fond de la carte de briefing. |
| **Fenêtre Menu Base** | En fond de la fenêtre du menu de base. |

Cliquez sur un emplacement pour envoyer une image, **Retirer** pour le vider. Les emplacements
vides sont simplement ignorés.

## Conseils pour les images

- Utilisez des fichiers **PNG**.
- Les fonds (chargement, menu) doivent faire au moins **1920×1080**. Plus grand fonctionne mais
  consomme plus de mémoire vidéo.
- L'onglet **Documentation → Guide des Thèmes** de l'application indique la taille recommandée pour chaque
  emplacement.

## Voir aussi

- [Build](build.md) : où le thème se retrouve dans le mod.
