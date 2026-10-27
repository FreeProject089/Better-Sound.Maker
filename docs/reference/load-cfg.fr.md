# Load.cfg

[`src/Load.cfg`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/Load.cfg) contient
des interrupteurs fixés à la compilation. `src/main.js` l'importe en texte brut, coupe chaque ligne au
premier `=`, nettoie les deux côtés et range le résultat dans `window.APP_CONFIG` (voir
[Architecture](../how-it-works/architecture.md#boot-sequence)).

!!! warning "Uniquement à la compilation"
    Le fichier est intégré à l'application quand elle est compilée. Modifier un `Load.cfg` dans une
    copie installée n'a aucun effet. Les valeurs sont des chaînes : seul le texte exact `true` / `false`
    est reconnu.

| Clé | Valeur livrée | Lu par | Effet |
|---|---|---|---|
| `ProdMode` | `true` | `src/main.js` (`initDebugPanel`) | `false` affiche un **DEV PANEL** flottant (lancer l'onboarding, etc.) |
| `DisableAutoUpdate` | `false` | `src/main.js`, `src/components/nav.js` | `true` saute la vérification automatique au démarrage, et le bouton de mise à jour de la barre latérale affiche une fenêtre « Updates Disabled » au lieu de vérifier |
| `DisableCommunityPresets` | `false` | `src/catalog/catalog.js`, `src/pages/presets.js` | `true` désactive le catalogue communautaire (presets **et** packs de types communautaires) et masque le bouton *Communauté* de la page Presets |
| `LocalLicense` | `true` | `src/pages/credits.js` | `true` : la page Crédits lit la licence dans les fichiers installés (bureau : `public/LICENSE` dans le dossier des ressources ; web : `./LICENSE`). `false` : elle est chargée depuis GitHub |
| `TypeDetection` | `true` | `detectSoundType` (`src/utils/audio-analyzer.js`) | `false` désactive les libellés de type de son : chaque son est classé *Générique* |
| `CommunityCatalogUrl` | *(vide)* | `src/catalog/catalog.js` | URL du catalogue utilisée si aucune n'est définie dans les *Paramètres* ; vide signifie le dépôt communautaire par défaut (voir [Chargement du catalogue](../how-it-works/catalog-loading.md)) |
