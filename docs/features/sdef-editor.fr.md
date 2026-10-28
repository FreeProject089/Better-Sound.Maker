# Éditeur SDEF

!!! tip "Vous préférez le pas à pas ?"

    La version « tâche » de cette page est [Régler un son](../guide/tune-a-sound.md).

L'**Éditeur SDEF** change la façon dont un son est joué : volume, hauteur, portée, boucle,
provenance. Il modifie les fichiers `.sdef` des sons de votre [projet](project.md), avec un
formulaire pour chaque paramètre ou en texte brut, et vérifie vos valeurs pendant la saisie.

<!-- screenshot: the SDEF editor in Visual mode, with the problems panel and the attenuation curve -->

## Disposition

- **À gauche :** les SDEF de votre projet. Cliquez sur l'un d'eux pour l'éditer.
- **Barre du haut :** **Play** (écouter le son avec les réglages actuels), **Visuel** / **Brut**
  (changer de mode), **Enregistrer**.
- **Sous la barre :** le panneau des problèmes.
- **Zone principale :** les paramètres, ou le texte brut.

## Mode Visuel

Les paramètres sont regroupés comme dans le `example.sdef` d'ED :

| Groupe | Paramètres |
|---|---|
| Héritage | `inherit` |
| Échantillon Sonore | `wave` (un fichier ou une liste) |
| Contrôle du Volume | `gain`, `gain_random` |
| Fréquence / Pitch | `pitch`, `pitch_random` |
| Filtrage | `lowpass`, `distance_filter_offset` |
| Position 3D | `position` |
| Distance & Rayon | `silent_radius`, `peak_radius`, `inner_radius`, `outer_radius`, et la courbe |
| Directionnalité (Cône) | `direction`, `cone_inner_angle`, `cone_outer_angle`, `cone_inner_gain`, `cone_outer_gain`, `cone_outer_lowpass` |
| Mode de Lecture | `detached`, `streaming`, `preload`, `looping`, `listmode` |
| Enveloppe (Attack/Release) | `attack`, `release` |
| Stéréo & Largeur | `auto_width` |
| Effet Doppler | `nodoppler` |

Les nombres ont des boutons − et + ; les vecteurs (`position`, `direction`) ont un champ par axe
(avant, haut, droite). Les options à trois états (`preload`, `looping`) peuvent rester
**non définies** pour laisser le jeu décider.

Rôle de chaque paramètre : [Paramètres SDEF](../reference/sdef-parameters.md).

### Le badge ED

Certains paramètres portent un petit badge **ED** : `gain_random`, `pitch_random`,
`cone_inner_gain`, `preload` et `looping`. Ils sont absents du `example.sdef` d'ED, mais Eagle
Dynamics les utilise dans les fichiers SDEF du jeu. Ils fonctionnent ; ils ne figurent simplement
pas dans la référence officielle. Survolez le badge pour le rappel.

### La courbe d'atténuation

Sous **Distance & Rayon**, un graphique montre le volume du son à chaque distance (échelle
logarithmique), par rapport à son `gain`. Il suit le modèle de DCS :

1. de `silent_radius` à `peak_radius`, le son monte du silence au plein volume ;
2. de `peak_radius` à `inner_radius`, il descend à 0,85 du plein volume ;
3. au-delà de `inner_radius`, il décroît avec la distance, jusqu'au silence à `outer_radius`.

Modifiez un rayon et la courbe bouge : vous voyez l'effet avant de tester en jeu.

## Mode Brut

**Brut** affiche le SDEF en texte, exactement tel qu'il sera écrit. Utilisez-le pour coller un
SDEF venu d'ailleurs ou modifier plusieurs valeurs d'un coup. En revenant en **Visuel**, votre
texte est relu dans le formulaire.

## Le panneau des problèmes

L'éditeur vérifie le SDEF à chaque modification et liste ce qu'il trouve : erreurs,
avertissements ou indications. *Aucun problème détecté* signifie qu'il est cohérent. Parmi les
vérifications :

| Problème | Pourquoi c'est important |
|---|---|
| Ni `wave` ni `inherit` | Le son sera muet. |
| Un chemin `wave` avec des barres obliques inverses, ou commençant par `Sounds/` | Les chemins utilisent `/` et partent déjà de `Sounds/`. |
| Rayons dans le désordre | `silent_radius` ≤ `peak_radius` ≤ `inner_radius` ≤ `outer_radius`. |
| `gain` à 0 ou moins, ou très élevé | Son coupé, ou risque de saturation. |
| `pitch` à 0 ou moins | Interdit. |
| Angles de cône hors de 0–180, ou cône réglé avec `direction = {0, 0, 0}` | Le cône est invalide ou sans effet. |
| `listmode = ASR` avec moins de 2 échantillons | ASR demande un échantillon de départ et une boucle. |
| `streaming` avec `detached` | Le streaming implique `detached = false`. |

Le panneau ne bloque jamais : vous pouvez enregistrer un SDEF qui a des problèmes.

## Enregistrer

**Enregistrer** stocke le SDEF dans votre projet. Les modifications non enregistrées sont gardées
comme *non enregistrées* et ne sont **pas** utilisées par le build. La page [Build](build.md) vous
en avertit et propose **Save All**.

## Modèles

**Templates** (en haut à droite) ouvre le gestionnaire de modèles. Un modèle est un ensemble de
valeurs de paramètres enregistré pour être réutilisé sur d'autres sons.

- **En créer un :** à droite (*Nouveau template*), nommez-le, choisissez l'asset source, puis
  **Créer le template**.
- **L'appliquer :** *Actuel* l'applique au SDEF en cours d'édition ; *Tous (n)* l'applique à tous
  les SDEF du projet. Le `wave` de chaque SDEF est conservé : seuls les autres paramètres
  changent.
- **Partager :** *Importer* / *Exporter* chargent et enregistrent des modèles sous forme de
  fichiers.

## Voir aussi

- [Comment fonctionnent les mods sonores DCS](../getting-started/dcs-sound-mods.md)
- [Le modèle SDEF](../how-it-works/sdef-model.md) : comment BSM lit et écrit les SDEF.
