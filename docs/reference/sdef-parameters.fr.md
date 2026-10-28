# Paramètres SDEF

Tous les paramètres connus de l'éditeur SDEF, issus de `SDEF_PARAMS` dans
[`src/utils/sdef-generator.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-generator.js)
et vérifiés avec le fichier d'ED `DCS World/Doc/Sounds/example.sdef`. La façon dont ils sont lus,
écrits et vérifiés est expliquée dans [Modèle SDEF](../how-it-works/sdef-model.md).

**ED seulement** signifie qu'ED utilise la clé dans ses propres `.sdef` mais que `example.sdef` ne la
documente pas. Ces clés sont écrites dès que vous les définissez, car leur valeur par défaut dans le
moteur est inconnue.

## Paramètres

| Clé | Type | Défaut | Groupe | Signification | ED seulement |
|---|---|---|---|---|---|
| `inherit` | string | *(vide)* | include | Nom du `.sdef` dont hériter les réglages | |
| `wave` | wave | *(vide)* | sample | Chemin de l'échantillon relatif à `Sounds/` ; une liste `{"a", "b"}` en tire un au hasard à chaque lecture. Sans extension, `.wav` puis `.ogg` sont essayés ; 1 à 2 canaux, tout format PCM | |
| `gain` | number | `1` | volume | Multiplicateur de gain linéaire. **Toujours écrit** | |
| `gain_random` | number | `0` | volume | Variation aléatoire du gain à chaque lecture (ED utilise 0,1–0,15) | oui |
| `pitch` | number | `1` | frequency | Multiplicateur de fréquence de la source | |
| `pitch_random` | number | `0` | frequency | Variation aléatoire de la hauteur à chaque lecture (ED utilise 0,05–0,15) | oui |
| `lowpass` | number | `24000` | filtering | Fréquence de coupure du filtre passe-bas (Hz) | |
| `distance_filter_offset` | number | `0` | filtering | Distance à partir de laquelle le passe-bas commence à agir | |
| `position` | vec3 | `{0, 0, 0}` | position | Position relative à l'hôte `{avant, haut, droite}` en mètres | |
| `silent_radius` | number | `0` | radius | En deçà de ce rayon, le son est muet | |
| `peak_radius` | number | `0` | radius | À ce rayon, le gain est maximal | |
| `inner_radius` | number | `1` | radius | Distance de référence : gain à 0,85 du maximum. **Toujours écrit** | |
| `outer_radius` | number | `1000` | radius | Au-delà de ce rayon, la source n'est plus entendue | |
| `direction` | vec3 | `{0, 0, 0}` | cone | Direction du cône relative à l'hôte `{avant, haut, droite}` | |
| `cone_inner_gain` | number | `1` | cone | Gain à l'intérieur de `cone_inner_angle` | oui |
| `cone_inner_angle` | number | `0` | cone | Demi-angle (0–180°) à l'intérieur duquel le gain est maximal | |
| `cone_outer_angle` | number | `0` | cone | Demi-angle (0–180°) au-delà duquel le gain vaut `cone_outer_gain` | |
| `cone_outer_gain` | number | `1` | cone | Gain en dehors de `cone_outer_angle` | |
| `cone_outer_lowpass` | number | `24000` | cone | Fréquence de coupure en dehors de `cone_outer_angle` | |
| `detached` | boolean | `false` | playmode | Toujours jouer l'échantillon en entier (explosions, tirs) | |
| `streaming` | boolean | `false` | playmode | Lire les échantillons depuis le disque au lieu de les garder décompressés en mémoire ; implique `detached = false` | |
| `preload` | tristate | *non défini* | playmode | Charger les échantillons au début de la mission (ED met `false` presque partout) | oui |
| `looping` | tristate | *non défini* | playmode | Forcer la boucle ; non défini laisse le jeu décider | oui |
| `listmode` | enum `RANDOM` · `SEQUENCE` · `ASR` | `RANDOM` | playmode | `RANDOM` : un échantillon au hasard ; `SEQUENCE` : tous dans l'ordre ; `ASR` : le premier au départ, puis boucle sur le reste | |
| `attack` | number | `0` | envelope | Secondes pour que le volume monte de 0 au maximum au départ | |
| `release` | number | `0` | envelope | Secondes pour que le volume retombe à 0 à l'arrêt | |
| `auto_width` | boolean | `true` | stereo | Si `false`, la largeur stéréo ne change pas avec la distance | |
| `nodoppler` | boolean | `true` | doppler | Si `true`, l'effet Doppler n'affecte pas le son | |

!!! note "Cône inversé"
    `example.sdef` : avec `cone_inner_angle` supérieur à `cone_outer_angle`, tous deux ≤ 90, on obtient
    un cône inversé, symétrique autour du plan dont `direction` est la normale, utile pour les rotors.
    Exemple : inner 80, outer 60 donne ±10° intérieur et ±30° extérieur.

Toute autre clé trouvée dans un fichier est conservée telle quelle à l'enregistrement, et le linter la signale.

## Messages du linter {#lint-messages}

Issus de [`src/utils/sdef-lint.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-lint.js).
Les messages sont en anglais dans l'application ; `<k>` désigne le paramètre concerné.

| Niveau | Message | Que faire |
|---|---|---|
| warning | `Unknown parameter "<k>" — did you mean "<guess>"? DCS ignores it.` | corriger la faute de frappe |
| warning | `Unknown parameter "<k>" — DCS ignores it.` | le retirer, sauf si vous savez que DCS le lit |
| error | `"<k>" must be a number (got …).` | saisir un nombre |
| error | `No wave and no inherit: this sound will be silent.` | ajouter un échantillon ou un `inherit` |
| warning | `"<wave>" uses backslashes; use forward slashes.` | remplacer `\` par `/` |
| warning | `"<wave>" starts with Sounds/ but wave paths are already relative to Sounds/.` | retirer le préfixe `Sounds/` |
| warning | `ASR needs at least 2 samples (first = attack, the rest loops).` | ajouter des échantillons ou changer `listmode` |
| info | `SEQUENCE with a single sample behaves like RANDOM.` | — |
| warning | `gain is 0 or negative: the sound is muted.` | augmenter `gain` |
| warning | `gain <n> is unusually high and may clip.` | gain supérieur à 10 |
| error | `pitch must be greater than 0.` | — |
| error | `<k> cannot be negative.` | `gain_random`, `pitch_random`, `attack`, `release` ou un rayon |
| warning | `<k> <n> Hz is outside the audible 10–24000 Hz range.` | `lowpass` / `cone_outer_lowpass` |
| error | `<k> (<n>) must be ≥ <précédent> (<m>).` | les rayons doivent croître : silent ≤ peak ≤ inner ≤ outer |
| info | `Only one of inner/outer radius is set; DCS derives the other: inner … m, outer … m.` | définir les deux si la valeur déduite ne convient pas |
| error | `<k> is a half-angle and must be between 0 and 180.` | — |
| warning | `Cone angles are set but direction is {0, 0, 0}: the cone has no effect.` | définir `direction` |
| info | `cone_inner_angle > cone_outer_angle (both ≤ 90): this is an inverse cone (rotor-style).` | voulu pour les rotors |
| error | `An inverse cone needs both angles ≤ 90.` | — |
| warning | `streaming = true implies detached = false; detached is ignored.` | retirer l'un des deux |
