# Format du catalogue

Better Sound.Maker lit le contenu communautaire depuis un unique **catalog.json** accessible par URL.
Le catalogue liste des presets et des packs de types de sons ; chaque entrée pointe vers son propre fichier JSON.

| Fichier | Schéma | Emplacement |
|---|---|---|
| `catalog.json` | [`schemas/catalog.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/catalog.schema.json) | racine du dépôt communautaire (distant) · `public/catalog.json` (embarqué) |
| `preset_*.json` | [`schemas/preset.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/preset.schema.json) | là où le catalogue pointe |
| pack de types de sons | [`schemas/sound-types.schema.json`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/schemas/sound-types.schema.json) | `public/sound-types/` (embarqué) ou listé dans `soundTypes` |

Tous les fichiers sont du **JSON UTF-8**. Le validateur refuse tout le reste.

## Comment l'application le charge

1. **Catalogue distant** : l'URL de *Paramètres → Catalogue communautaire*, puis `CommunityCatalogUrl` dans `src/Load.cfg`, puis l'URL officielle
   `https://raw.githubusercontent.com/BetterDCS/Better-Sound.Maker-Community-Presets/main/catalog.json`.
   Les résultats sont gardés en cache 5 minutes.
2. **Copie hors ligne** : le dernier catalogue distant chargé avec succès, conservé dans le stockage local.
3. **Catalogue embarqué** : `public/catalog.json`, livré avec l'application.

Si le dépôt officiel n'a pas encore de `catalog.json`, l'application liste ses fichiers `preset_*.json` via l'API GitHub (l'ancien comportement).
Mettez `DisableCommunityPresets = true` dans `Load.cfg` pour tout désactiver.

Chaque fichier est validé au chargement (`src/catalog/schema.js`). Les entrées invalides sont écartées et journalisées dans la console. Un fichier cassé ne casse jamais tout le catalogue.

Le détail de ce mécanisme est dans [Chargement du catalogue](../how-it-works/catalog-loading.md).

## catalog.json

```json
{
  "$schema": "https://raw.githubusercontent.com/FreeProject089/Better-Sound.Maker/main/schemas/catalog.schema.json",
  "schemaVersion": 1,
  "name": "Better Sound.Maker Community Catalog",
  "presets": [
    { "id": "fa-18c", "url": "presets/preset_FA-18C.json" }
  ],
  "soundTypes": [
    { "id": "community", "url": "sound-types/community.json" }
  ]
}
```

- `url` peut être relative (résolue par rapport à l'URL du catalogue) ou absolue `https://…`. Vous pouvez pointer vers des fichiers hébergés ailleurs.
- `id` est facultatif et vaut par défaut le nom du fichier. Il doit être unique dans sa liste.

## Presets

```json
{
  "name": "FA-18C Hornet",
  "color": "#cddc39",
  "version": "1.0.3",
  "UpdateNumber": 2,
  "date": "2026-02-21T04:21:26.462Z",
  "author": "YourName",
  "description": "Every Hornet engine and cockpit sound",
  "tags": ["aircraft", "jet"],
  "assetPaths": ["Aircrafts/FA-18/Afterburner.sdef"]
}
```

- `name` identifie le preset. Les utilisateurs qui l'ont importé voient un bouton **Mise à jour disponible** quand le catalogue contient le même nom avec un `UpdateNumber` plus élevé. À `UpdateNumber` égal, la `version` la plus haute l'emporte.
- **Augmentez `UpdateNumber` à chaque publication d'une modification.**
- `assetPaths` sont des chemins SDEF relatifs à `Sounds/sdef`, avec des `/`.
- `customTypes`, facultatif, embarque un pack de types de sons installé avec le preset.

Le plus simple pour en produire un est *Presets → Exporter* dans l'application.

## Packs de types de sons

```json
{
  "types": {
    "helicopter_rotor": { "label": "Rotor", "lucideIcon": "fan", "description": "Main/tail rotor loops" }
  },
  "rules": [
    { "match": "rotor", "type": "helicopter_rotor" }
  ]
}
```

- Les identifiants de type utilisent des minuscules, chiffres, `_` et `-`. Les icônes sont des noms [Lucide](https://lucide.dev/icons).
- `match` est une expression régulière JavaScript testée sans tenir compte de la casse sur le chemin SDEF. **La première règle qui correspond l'emporte.**
- Ordre de chargement : packs embarqués de `public/sound-types/index.json` (dans l'ordre), puis packs communautaires, puis types personnalisés de l'utilisateur. Les types personnalisés passent en premier pour avoir la priorité.
- Une règle peut utiliser un type défini par un pack précédent.

## Ajouter quelque chose au catalogue communautaire

1. Déposez le fichier dans le dépôt communautaire : `presets/preset_<Nom>.json` ou `sound-types/<nom>.json`.
2. Régénérez et validez le manifeste :
   ```bash
   node chemin/vers/Better-Sound.Maker/scripts/catalog.mjs build .
   ```
   Cela écrit `catalog.json` et valide chaque fichier listé.
3. Ouvrez une PR. La CI (ou un relecteur) lance la même commande.

Pour vérifier les données embarquées de l'application :

```bash
npm run catalog:validate
```

Pour tester votre propre catalogue avant publication, collez son URL brute dans *Paramètres → Catalogue communautaire* et cliquez sur **Tester**.
