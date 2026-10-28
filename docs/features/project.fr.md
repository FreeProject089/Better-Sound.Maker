# Projets

!!! tip "Vous préférez le pas à pas ?"

    La version « tâche » de cette page est [Créer votre premier mod](../guide/first-mod.md).

**Projets** affiche les sons sélectionnés dans la [Bibliothèque d'Assets](library.md) et vous
permet de donner à chacun son nouvel audio. Tout ce qui est listé ici entre dans le mod quand vous
le [générez](build.md).

<!-- screenshot: Projects with the folder tree, the counters and a few asset cards -->

## Les compteurs

En haut, BSM compte vos assets sélectionnés, combien ont un **Audio Assigné** et combien sont
encore en **Audio Manquant**. Vérifiez *Audio Manquant* avant de générer : c'est la liste des sons
sélectionnés que vous n'avez pas encore remplacés.

## S'y retrouver

Le projet garde la même arborescence que la bibliothèque. Le dossier surligné en bleu est le
*dossier feuille* : le parent direct des fichiers affichés, pour savoir où vous êtes dans les
arborescences profondes.

## Chaque carte d'asset

| Contrôle | Rôle |
|---|---|
| Zone de dépôt (**Cliquez ou Glissez un Audio**) | Déposez un fichier `.wav` ou `.ogg`, ou cliquez pour parcourir. Un SDEF à plusieurs fichiers audio a une zone de dépôt par fichier. |
| **Play** / **Stop** | Écoute l'audio assigné. Avec **Paramètres → Appliquer Paramètres SDEF en Lecture**, l'écoute utilise le gain, le pitch et la boucle du SDEF. |
| **Remplacer** / **Retirer Audio** | Change ou retire le fichier assigné. |
| **Éditer SDEF** | Ouvre ce son dans l'[éditeur SDEF](sdef-editor.md). |
| **Retirer du projet** | Désélectionne le son. |

Seuls `.wav` et `.ogg` sont acceptés. Pour les sons placés en 3D (moteurs, interrupteurs, armes),
utilisez des fichiers mono : un son stéréo ne peut pas être positionné. L'onglet
**Documentation → Fondamentaux Audio** de l'application explique pourquoi.

## En retirer plusieurs à la fois

Cochez plusieurs cartes (ou un dossier entier) : une barre apparaît en bas de l'écran, avec un
bouton pour les retirer toutes du projet.

## Charger un mod existant

**Load Existing Mod** ouvre un mod que vous avez déjà généré, à partir de son `.zip` : BSM lit
son `entry.lua`, ses SDEF et son audio et en refait votre projet, pour continuer à y travailler.

!!! warning "Cela remplace le projet actuel"

    Si un projet est ouvert, BSM demande d'abord : **Save & Load** garde vos modifications SDEF
    non enregistrées avant de charger, **Load & Close** les abandonne, **Cancel** annule.

## Voir aussi

- [Régler un son](../guide/tune-a-sound.md)
- [Build](build.md)
