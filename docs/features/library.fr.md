# Bibliothèque d'Assets

!!! tip "Vous préférez le pas à pas ?"

    La version « tâche » de cette page est [Créer votre premier mod](../guide/first-mod.md).

La **Bibliothèque d'Assets** liste tous les sons connus de DCS : une ligne par SDEF, avec les
fichiers audio qu'il joue. C'est le point de départ de tout mod : vous y trouvez les sons à
remplacer et vous les sélectionnez. La sélection devient votre [Projet](project.md).

<!-- screenshot: the Library with the folder tree, a filtered list and the detail panel -->

## Remplir la bibliothèque : le scanner

La bibliothèque est construite à partir de votre installation de DCS. **Recharger la
Bibliothèque** (en haut à droite) ouvre le **Scanner d'Assets DCS**, qui s'ouvre aussi tout seul
au premier lancement.

| Champ | Rôle |
|---|---|
| **Chemin d'installation DCS** | Votre dossier DCS World. BSM lit `Doc/Sounds/sdef_and_wave_list.txt` et votre dossier `CoreMods`. |
| **Chemin Saved Games (Optionnel)** | Votre dossier `Saved Games\DCS`. Ajoute les sons des mods qui y sont installés, pour pouvoir modder un mod. |
| **Lancer le Scan** | Lance l'analyse. |
| **Fichier Manuel** | Charge un fichier texte de liste de sons que vous choisissez, au lieu de scanner. |

!!! warning "Scannez un dossier de jeu propre"

    Des mods copiés dans le dossier de DCS lui-même seraient lus comme des sons du jeu. Gardez
    le dossier du jeu sans mod et placez les mods dans `Saved Games`.

La bibliothèque est conservée d'une session à l'autre. Rescannez après une mise à jour de DCS ou
un nouveau module, ou activez **Auto-scan de l'Assets Library** dans les
[Paramètres](settings.md) pour rescanner à chaque démarrage.

## Trouver un son

- **Arborescence.** La colonne de gauche reproduit les dossiers des SDEF (`Aircrafts`,
  `Weapons`, `GndTech`…). Cliquez sur un dossier pour n'afficher que son contenu.
- **Recherche.** La zone de recherche porte sur les chemins des SDEF et des fichiers audio.
- **Filtres.** **Filtres** ouvre les options avancées : assets *Avec des notes*, assets *Avec
  remplacement audio*, et un filtre par **type de son**. **Effacer** les réinitialise.
- **Type de son.** Chaque ligne affiche un type (moteur, arme, radio…) détecté à partir de son
  chemin. Vous pouvez ajouter vos propres types et règles dans [Types de sons](sound-types.md).

## Sélectionner des sons

Cochez la case d'une ligne pour l'ajouter à votre projet. **Tout Sélectionner** sélectionne tout
ce que le dossier, la recherche et les filtres affichent ; **Effacer Sélection** vide la
sélection. Le compteur indique combien de sons sont sélectionnés.

Appliquer un [préréglage](presets.md) sélectionne d'un coup une liste de sons enregistrée.

## Le panneau de détail

Cliquez sur une ligne (pas sur sa case) pour ouvrir son détail :

- le chemin du SDEF et ses **fichiers audio** ;
- **Note SDEF**, et une note par fichier audio : les notes sont pour vous, elles ne vont pas dans
  le mod ;
- **Ajouter Audio** / **Remplacer Audio** à côté de chaque fichier audio, pour lui donner un
  remplaçant directement ici ;
- **Sélectionner** / **Désélectionner**.

## Importer

**Import** propose deux choses :

| Option | Rôle |
|---|---|
| **Import Mod (.zip)** | Lit une archive de mod et ajoute ses SDEF à la bibliothèque dans une section à part, pour travailler à partir des sons d'un autre mod. |
| **Import Library (.json)** | Charge une bibliothèque enregistrée auparavant en JSON. |

**Paramètres → Garder les assets de mods importés** décide si les mods importés survivent à un
nouveau scan.

## Voir aussi

- [Comment fonctionnent les mods sonores DCS](../getting-started/dcs-sound-mods.md) : ce que sont un SDEF et `sdef_and_wave_list.txt`.
- [Projet](project.md) : ce que deviennent les sons sélectionnés.
