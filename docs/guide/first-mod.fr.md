# Créer votre premier mod

Vous allez remplacer un son de DCS par votre propre audio, générer le mod et l'entendre en jeu.

**Il vous faut :** BSM avec une [bibliothèque scannée](../getting-started/first-launch.md#4-scanner-la-bibliotheque),
et un fichier audio `.wav` ou `.ogg` (de préférence mono pour tout ce qui est placé en 3D :
moteurs, interrupteurs, armes).

!!! note "Pourquoi on choisit un SDEF et non un fichier audio"

    DCS joue des SDEF, et chaque SDEF nomme son fichier audio. Pour remplacer un son, votre mod
    fournit un SDEF au même chemin que celui du jeu, qui pointe vers votre audio. BSM conserve le
    chemin pour vous. Plus de détails :
    [Comment fonctionnent les mods sonores DCS](../getting-started/dcs-sound-mods.md).

## Étapes

- [ ] **Ouvrez la Bibliothèque d'Assets** depuis la barre latérale. *Vous voyez :* une arborescence de dossiers à gauche et la liste des SDEF.
- [ ] **Trouvez le son.** Tapez une partie de son nom dans la recherche (par exemple `canopy`), ou parcourez les dossiers. *Vous voyez :* la liste se réduit aux SDEF correspondants, chacun avec son ou ses fichiers audio et son type.
- [ ] **Cliquez sur la ligne** pour vérifier de quoi il s'agit. *Vous voyez :* le panneau de détail avec le chemin du SDEF, ses fichiers audio et un champ de note.
- [ ] **Cochez sa case** (ou appuyez sur **Sélectionner** dans le panneau de détail). *Vous voyez :* le compteur de sélection augmente.
- [ ] **Ouvrez Projets.** *Vous voyez :* votre SDEF sous forme de carte marquée **Audio Manquant**.
- [ ] **Ajoutez votre audio.** Glissez votre `.wav` ou `.ogg` sur la zone de dépôt (**Cliquez ou Glissez un Audio**), ou cliquez dessus pour parcourir. *Vous voyez :* la carte passe à **Audio Assigné**. Appuyez sur **Play** pour écouter.
- [ ] **Ouvrez Build** (*Générateur de Mod* dans la barre latérale). Renseignez au moins **Nom du Mod** et **Auteur / Équipe**.
- [ ] **Appuyez sur Construire & Exporter** et choisissez un dossier. *Vous voyez :* une barre de progression, puis *Export complete* avec le nom du dossier du mod.
- [ ] **Installez-le.** Copiez ce dossier dans `C:\Users\<vous>\Saved Games\DCS\Mods\resource\` (créez `Mods\resource` si besoin).
- [ ] **Testez dans DCS.** Lancez le jeu, vérifiez que le mod apparaît dans la section Mods des options, puis volez pour l'entendre.

<!-- screenshot: a Projects card with Audio Assigned and the Play button -->

## Si cela ne fonctionne pas

| Vous voyez | Faites ceci |
|---|---|
| La bibliothèque est vide | Appuyez sur **Recharger la Bibliothèque** et lancez le scanner. Voir [Premier lancement](../getting-started/first-launch.md#4-scanner-la-bibliotheque). |
| Le build refuse de démarrer | **Nom du Mod** et **Auteur / Équipe** sont obligatoires. |
| DCS n'affiche pas le mod | Le dossier doit se trouver directement dans `Mods\resource\`, avec `entry.lua` à sa racine, pas un niveau plus bas. |
| L'ancien son est toujours joué | Vérifiez que vous avez remplacé le bon SDEF : certains événements en ont plusieurs (intérieur et extérieur, par exemple). Voir aussi [Dépannage](../reference/troubleshooting.md). |
| Le fichier audio est refusé | Seuls `.wav` et `.ogg` sont acceptés. Convertissez-le d'abord. |

## Ensuite

[Réglez un son](tune-a-sound.md) pour changer son volume ou sa portée. Détails des écrans :
[Bibliothèque](../features/library.md), [Projet](../features/project.md), [Build](../features/build.md).
