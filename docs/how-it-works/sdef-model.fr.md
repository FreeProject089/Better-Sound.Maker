# Modèle SDEF

Un fichier `.sdef` (Source DEFinition) est un petit fichier texte de style Lua qui indique au moteur
son de DCS quels échantillons jouer et comment : gain, hauteur, atténuation avec la distance, cône,
mode de lecture. BSM lit, modifie, vérifie et régénère ces fichiers. L'éditeur côté utilisateur est
décrit dans [Éditeur SDEF](../features/sdef-editor.md) ; cette page explique le modèle qui le sous-tend.

La référence est le fichier d'ED lui-même, `DCS World/Doc/Sounds/example.sdef`. Chaque règle ci-dessous s'y rapporte.

---

## La table des paramètres : `SDEF_PARAMS`

[`src/utils/sdef-generator.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-generator.js)
exporte `SDEF_PARAMS`, une entrée par clé connue :

```js
{ key: 'gain_random', type: 'number', default: 0, group: 'volume',
  step: 0.05, undocumented: true, desc: '…' }
```

| Champ | Signification |
|---|---|
| `key` | la clé SDEF telle qu'écrite dans le fichier |
| `type` | `string`, `wave`, `number`, `vec3`, `boolean`, `enum` (avec `values`) ou `tristate` |
| `default` | la valeur par défaut du moteur selon `example.sdef` (ou `null` si inconnue) |
| `group` | section de l'éditeur : include, sample, volume, frequency, filtering, position, radius, cone, playmode, envelope, stereo, doppler |
| `undocumented` | `true` pour les clés **qu'ED utilise dans ses propres fichiers mais que `example.sdef` ne décrit pas** |

La table complète se trouve dans la [référence des paramètres SDEF](../reference/sdef-parameters.md).

**`tristate`** sert pour `preload` et `looping` : la valeur peut être `true`, `false` ou *non définie*
(`null`). Non défini est un vrai troisième état : il signifie « laisser le jeu décider », ce qui
n'est pas la même chose qu'écrire `false`.

**Clés non documentées.** `gain_random`, `pitch_random`, `cone_inner_gain`, `preload` et `looping`
n'apparaissent pas dans `example.sdef`, mais ED les utilise. Un relevé des `.sdef` d'ED a trouvé
`preload` dans environ 15 000 fichiers, `gain_random` / `pitch_random` dans environ 190,
`cone_inner_gain` dans environ 70 et `looping` dans environ 10. Elles sont exposées pour que vous
puissiez reproduire ce que fait ED.

## Générer un fichier

`generateSdef(params)` écrit :

1. un commentaire d'en-tête `-- Generated with Better ModMaker` ;
2. `wave` : une chaîne simple, ou une liste `{ … }` sur plusieurs lignes s'il y a 2 échantillons ou plus ;
3. toutes les autres clés connues, dans l'ordre de `SDEF_PARAMS`, selon ces règles :

| Règle | Pourquoi |
|---|---|
| `undefined`, `''` et `null` ne sont jamais écrits | non défini signifie « valeur par défaut du moteur » |
| Une valeur égale à sa valeur par défaut est **omise** | des fichiers courts et lisibles, comme ceux d'ED |
| …sauf `gain` et `inner_radius`, toujours écrits | la valeur par défaut `inner_radius = 1` n'est presque jamais celle voulue, et un gain explicite évite les surprises |
| Les clés `undocumented` sont écrites dès qu'elles sont définies, même à la valeur « par défaut » | leur vraie valeur par défaut dans le moteur est inconnue : l'application ne peut pas supposer qu'elle est sans effet |
| Les clés inconnues sont **conservées** et écrites à la fin | modifier un fichier dans BSM ne supprime jamais une clé que l'éditeur ne modélise pas |

Les chaînes sont entre guillemets, un `vec3` devient `{x, y, z}`, les valeurs d'énumération en
majuscules (`RANDOM`, `SEQUENCE`, `ASR`) restent sans guillemets. Les clés commençant par `_` sont
internes et jamais écrites.

## Lire un fichier

`parseSdef(text)` est un analyseur ligne par ligne :

- tout ce qui suit `--` sur une ligne est ignoré (commentaires) ;
- `wave = {` ouvre une liste multiligne jusqu'à une ligne égale à `}` ; `wave = {"a", "b"}` sur une ligne fonctionne aussi ; `wave = "x"` devient `["x"]` ;
- `clé = valeur` est typé dans cet ordre : chaîne entre guillemets, `{…}` (éléments tous entre guillemets → liste de chaînes, sinon nombres), `true`/`false`, nombre (y compris `1.0`, `24000.0`, `1e3`), sinon texte brut (énumérations).

!!! note "Limites de l'analyseur"
    Ce n'est pas un analyseur Lua. Seuls les commentaires de ligne sont compris : pour un bloc
    `--[[ … ]]`, la ligne `--[[` est ignorée mais les lignes à l'intérieur sont lues comme si elles
    étaient actives. Les expressions, variables et instructions multiples sur une ligne ne sont pas
    prises en charge non plus.

## Le linter

[`src/utils/sdef-lint.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/sdef-lint.js)
`lintSdef(params)` ne lève jamais d'exception. Il renvoie des constats `{ level, key, message }` avec
`level` = `error`, `warning` ou `info`.

| Vérification | Niveau | Pourquoi |
|---|---|---|
| Clé inconnue, avec suggestion (alias `no_doppler→nodoppler`, `ptich→pitch`, `loop→looping`, `volume→gain`, ou distance de Levenshtein < 3) | warning | DCS ignore silencieusement les clés inconnues : une faute de frappe ne fait simplement rien |
| Clé numérique contenant autre chose qu'un nombre | error | le moteur attend un nombre |
| Ni `wave` ni `inherit` | error | rien à jouer : le son est muet |
| Barres obliques inverses dans un chemin de wave | warning | utilisez des `/` |
| Chemin de wave commençant par `Sounds/` | warning | les chemins sont déjà relatifs à `Sounds/` (`example.sdef`) |
| `ASR` avec moins de 2 échantillons | warning | ASR joue le premier échantillon une fois et boucle sur le reste |
| `SEQUENCE` avec 1 échantillon | info | se comporte comme `RANDOM` |
| `gain ≤ 0` / `gain > 10` | warning | muet / saturation probable |
| `pitch ≤ 0` | error | multiplicateur de fréquence invalide |
| `gain_random`, `pitch_random`, `attack`, `release` négatifs | error | sans signification |
| `lowpass` ou `cone_outer_lowpass` hors de 10–24000 Hz | warning | hors de la plage audible |
| Rayons non croissants (`silent ≤ peak ≤ inner ≤ outer`) ou négatifs | error | la courbe ci-dessous serait indéfinie |
| Un seul de `inner_radius` / `outer_radius` défini | info | indique la valeur que DCS va déduire (voir plus bas) |
| Angle de cône hors de 0–180 | error | ce sont des demi-angles |
| Cône utilisé (angle défini et `cone_outer_gain ≠ 1`) mais `direction` vaut `{0,0,0}` | warning | un cône a besoin d'une direction |
| `cone_inner_angle > cone_outer_angle` | info si les deux ≤ 90 (cône inversé, « utile pour les rotors »), error sinon | `example.sdef` ne définit le cône inversé qu'avec deux angles ≤ 90 |
| `streaming = true` et `detached = true` | warning | `example.sdef` : streaming « implique detached=false » |

La liste complète des messages est dans la [référence des paramètres](../reference/sdef-parameters.md#lint-messages).

## Atténuation avec la distance

`example.sdef` décrit la courbe gain / distance :

```text
silent_radius → peak_radius      linéaire 0.0 → 1.0
peak_radius   → inner_radius     linéaire 1.0 → 0.85
inner_radius  → outer_radius/2   loi en inverse de la distance
outer_radius/2 → outer_radius    linéaire → 0.0
```

`gainAtDistance(d, r)` l'implémente par morceaux et renvoie une valeur entre 0 et 1, *avant* le
multiplicateur `gain` :

| Distance | Gain |
|---|---|
| `d < silent` | 0 |
| `silent ≤ d < peak` | `(d − silent) / (peak − silent)` (ou 1 si `peak = silent`) |
| `peak ≤ d < inner` | `1 − 0.15 · (d − peak) / (inner − peak)` |
| `inner ≤ d < outer/2` | `0.85 · inner / d` |
| `outer/2 ≤ d < outer` | la valeur à `outer/2`, décroissant linéairement jusqu'à 0 à `outer` |
| `d ≥ outer` | 0 |

Le segment en inverse de la distance est multiplié par 0,85 pour que la courbe soit continue à
`inner_radius`, où `example.sdef` indique un gain de « 0.85 du maximum ». L'éditeur trace cette
courbe à partir de `attenuationRadii(params)` (voir [Éditeur SDEF](../features/sdef-editor.md)).

### La règle « un seul rayon défini »

D'après `example.sdef` : *si un seul des rayons est défini, l'autre est calculé automatiquement*,
avec `outer_radius = inner_radius / silence_threshold` et un seuil de silence de **0,001 (−60 dB)**.
`attenuationRadii` l'applique :

| Défini dans le fichier | Valeurs effectives |
|---|---|
| aucun | `inner = 1`, `outer = 1000` (valeurs par défaut du moteur) |
| seulement `inner_radius` | `outer = inner / 0.001` (ex. inner 20 → outer 20 000 m) |
| seulement `outer_radius` | `inner = outer × 0.001` (ex. outer 2000 → inner 2 m) |

C'est pourquoi définir seulement `inner_radius = 50` rend un son audible à 50 km. Le message info du
linter vous montre la valeur déduite pour que cela n'arrive jamais par accident.
