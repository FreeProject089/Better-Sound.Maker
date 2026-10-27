# Comment fonctionnent les mods sonores DCS

Vous pouvez utiliser Better Sound.Maker sans rien savoir de tout cela. Mais cinq minutes ici vous
épargneront une heure de « pourquoi le jeu joue toujours l'ancien son ». Tout ce qui suit vient de
la référence d'Eagle Dynamics, livrée avec le jeu dans `DCS World\Doc\Sounds\` (`example.sdef`,
`readme.txt` et le dossier `SoundModExample`).

## SDEF : la définition du son

DCS ne joue pas les fichiers audio directement. Chaque événement sonore (un moteur au ralenti, un
interrupteur qui claque, un missile qui part) est un fichier **SDEF** : *Source DEFinition*. C'est
un court fichier texte qui indique au jeu quel fichier audio jouer, et comment :

```lua
wave = "Effects/Animals/CowAmbience"
inner_radius = 12
outer_radius = 300
gain = 1.25
```

Celui-ci vient du mod d'exemple d'ED : il donne au moteur du Tunguska le son d'une vache.

- `wave` est le fichier audio. Ce peut aussi être une liste, `wave = {"a", "b", "c"}`, et DCS
  choisit un échantillon à chaque lecture.
- Les autres lignes sont des paramètres : volume (`gain`), hauteur, portée du son
  (`inner_radius`, `outer_radius`), boucle ou non, etc. Un paramètre absent garde sa valeur par
  défaut.

Tous les paramètres : [Paramètres SDEF](../reference/sdef-parameters.md). Comment BSM les lit et
les écrit : [Le modèle SDEF](../how-it-works/sdef-model.md).

## Les chemins `wave` partent de `Sounds/`

C'est la règle qui piège le plus. Un chemin `wave` est relatif au dossier `Sounds/`, **sans**
`Sounds/` devant, avec des barres obliques `/`, et en général sans extension :

| Valeur de `wave` | Fichier cherché par DCS |
|---|---|
| `"Effects/Animals/CowAmbience"` | `Sounds/Effects/Animals/CowAmbience.wav`, puis `.ogg` |
| `"Effects/Aircrafts/F18/Engine.ogg"` | exactement `Sounds/Effects/Aircrafts/F18/Engine.ogg` |

Sans extension, DCS essaie `.wav` puis `.ogg`. Les échantillons ont 1 ou 2 canaux, dans n'importe
quel format PCM.

## Les deux dossiers : `Sounds/sdef` et `Sounds/Effects`

Dans un mod (comme dans le jeu), les sons sont répartis en deux :

- `Sounds/sdef/…` contient les fichiers SDEF.
- `Sounds/Effects/…` contient les fichiers audio vers lesquels pointent les SDEF.

Un SDEF **remplace** celui du jeu quand il a **le même chemin et le même nom** sous
`Sounds/sdef/`. C'est pourquoi BSM conserve le chemin d'origine de chaque SDEF choisi : changez le
chemin, et DCS voit un nouveau son que rien n'utilise.

## `entry.lua` : la carte d'identité du mod

Chaque dossier de mod a un `entry.lua` à sa racine. Il déclare le mod à DCS : nom, version, auteur,
et ce qu'il faut charger. Le plus petit, tiré de l'exemple d'ED :

```lua
declare_plugin("ExampleSoundMod by DcsUser",
{
    displayName = "User Mod for Sounds Example",
    shortName   = "ExampleSoundMod",
    version     = "1.0",
    state       = "installed",
})
plugin_done()
```

BSM écrit ce fichier pour vous à partir des informations saisies sur la page
[Build](../features/build.md), y compris la ligne `mount_vfs_sound_path` qui monte le dossier
`Sounds` du mod, et les lignes du thème si vous ajoutez des images de [Thème](../features/theme.md).

## Où vont les mods : `Saved Games\DCS\Mods\resource`

Les mods sonores sont des mods *resource*. Ils vont dans votre dossier Saved Games, pas dans le
dossier du jeu :

```text
C:\Users\<vous>\Saved Games\DCS\Mods\resource\<VotreMod>\
├── entry.lua
└── Sounds\
    ├── sdef\…
    └── Effects\…
```

Créez les dossiers `Mods\resource` s'ils n'existent pas. Avec une variante de DCS, le dossier peut
avoir un suffixe (par exemple `DCS.openbeta`). Garder les mods hors du dossier du jeu évite que les
mises à jour et réparations de DCS les cassent, et retirer un mod revient à supprimer un dossier.

## `sdef_and_wave_list.txt` : l'index de tous les sons

`DCS World\Doc\Sounds\sdef_and_wave_list.txt` liste tous les SDEF du jeu et les fichiers audio
utilisés par chacun. C'est la carte que BSM lit quand il
[scanne votre installation](first-launch.md#4-scanner-la-bibliotheque), et la raison pour laquelle
la [Bibliothèque](../features/library.md) peut afficher chaque son avec son chemin. Vous pouvez
l'ouvrir dans un éditeur de texte pour chercher un son par son nom.

## Essayer l'exemple d'ED

ED fournit un exemple qui fonctionne. Pour voir un mod sonore en action avant d'en créer un :

- [ ] Copiez `DCS World\Doc\Sounds\SoundModExample` dans `Saved Games\DCS\Mods\resource\`.
- [ ] Lancez DCS et la mission `example_soundmod.miz` du même dossier `Doc\Sounds`.
- [ ] Écoutez le Tunguska. Supprimez ensuite le dossier pour revenir en arrière.

Ensuite : [Créer votre premier mod](../guide/first-mod.md).
