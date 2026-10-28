# Dépannage

Des pannes réelles, tirées des messages et des solutions de repli du code. Les messages sont cités
tels que l'application les affiche (interface en anglais).

## Bibliothèque

| Symptôme | Cause | Solution |
|---|---|---|
| *Could not find base list in Doc/Sounds/sdef_and_wave_list.txt* | le chemin DCS est faux ou vide. S'il est vide, le scanner n'essaie que `C:/Program Files/Eagle Dynamics/DCS World` | indiquez le dossier d'installation de DCS dans les *Paramètres* (celui qui contient `Doc/` et `CoreMods/`) ; le scan de CoreMods continue malgré tout |
| Le scan automatique au démarrage ne fait rien | il faut *Auto scan* activé, un chemin DCS et l'application de bureau ; les échecs ne sont journalisés que dans la console (`Auto-scan failed`) | vérifiez le chemin, puis lancez un scan depuis la Bibliothèque |
| La bibliothèque affiche une liste générique, pas mon installation | vous êtes dans la version navigateur : elle charge le `public/sdef_and_wave_list.txt` embarqué | utilisez l'application de bureau pour lire votre installation |
| *Failed to load asset library: …* | la bibliothèque n'a pas pu être chargée ou analysée | rechargez ; dans le navigateur, vérifiez que la page est servie (et non ouverte comme fichier) |
| *No valid .sdef files found in this mod zip* | le zip importé ne contient aucun `.sdef` | vérifiez que l'archive contient `Sounds/sdef/…` |

## Audio

| Symptôme | Cause | Solution |
|---|---|---|
| Un asset a perdu son audio après redémarrage (bureau) | le fichier d'origine a été déplacé ou supprimé ; l'application ne garde que son chemin | réassignez le fichier |
| Un asset a perdu son audio (navigateur) | les données du site / IndexedDB ont été effacées | réassignez le fichier |
| Vous avez choisi *ogg* mais obtenez des `.wav` | la version web n'a pas d'encodeur Vorbis (ou l'encodeur natif a échoué : voir la console) ; du WAV est écrit à la place, sous un nom `.wav` | construisez depuis l'application de bureau |
| *WAV conversion failed, using original* (console) | le navigateur n'a pas pu décoder la source | convertissez le fichier vous-même |

## Construction

| Symptôme | Cause | Solution |
|---|---|---|
| *Export cancelled by user* | le sélecteur de dossier a été fermé | choisissez un dossier |
| Le navigateur télécharge un `.zip` au lieu d'écrire un dossier | le navigateur n'a pas la File System Access API (Firefox, Safari) | décompressez-le dans `Saved Games/DCS/Mods/…`, ou utilisez Chrome/Edge ou l'application de bureau |
| DCS liste le mod mais le son ne change pas | SDEF hors de `Sounds/sdef/Effects/`, mauvais chemin de wave, ou SDEF muet | reconstruisez avec BSM ; regardez dans le panneau du linter `No wave and no inherit` et les avertissements de chemin |

Voir [Construction du mod](../how-it-works/mod-build.md) pour l'arborescence exacte.

## Éditeur SDEF

Les erreurs et avertissements du linter sont listés avec leur sens dans la
[référence des paramètres](sdef-parameters.md#lint-messages). Deux surprises fréquentes :

- **Son entendu bien trop loin** : seul `inner_radius` est défini, DCS déduit donc `outer_radius = inner_radius / 0.001`. Définissez aussi `outer_radius`.
- **Le cône n'a aucun effet** : `direction` vaut `{0, 0, 0}`.

## Catalogue communautaire

| Symptôme | Cause | Solution |
|---|---|---|
| Presets anciens, ou provenant du « cache » | le catalogue distant était injoignable ; l'application a utilisé la dernière copie valide ou celle embarquée | vérifiez votre connexion ; *Paramètres → Tester* affiche les erreurs |
| Aucun preset communautaire | `DisableCommunityPresets = true` à la compilation, ou catalogues distant, en cache et embarqué tous en échec | voir les avertissements `[Catalog]` dans la console |
| Un preset ou un pack manque | il a échoué à la validation et a été écarté | lancez `node scripts/catalog.mjs validate <catalog.json>` |
| Mon URL de catalogue personnalisée est ignorée hors ligne | le repli sur la liste GitHub ne vaut que pour l'URL par défaut ; une URL personnalisée se rabat sur le cache, puis le catalogue embarqué | — |

## Mises à jour

| Symptôme | Cause | Solution |
|---|---|---|
| *Could not reach update server. The repo might be private or renamed.* | les trois URL GitHub ont échoué (hors ligne, limite de requêtes) | réessayez plus tard |
| Une installation BetterInstaller se met à jour via l'« updater standard » | `--check-update` a échoué (par exemple `update.json` expiré), l'updater Tauri a donc été utilisé | mainteneurs : re-signer `update.json` ([Publication](release.md)) |
| *Update failed, trying the standard updater...* | `uninstall.exe --update` n'a pas pu démarrer | l'application se rabat automatiquement ; sinon téléchargez l'installeur depuis la page des releases |
| *Update failed, opening the releases page.* | l'updater Tauri n'a pas pu télécharger ou installer | installez la nouvelle version à la main |
| Le bouton de mise à jour affiche *Updates Disabled* | `DisableAutoUpdate = true` dans `Load.cfg` | consultez la page des releases à la main |

## Navigateur ou bureau

La version navigateur ne peut pas lire votre installation DCS, scanner CoreMods ou Saved Games,
conserver l'audio par chemin, écrire un dossier sous Firefox/Safari, ni se mettre à jour. Voir le
tableau dans [Pont natif](../how-it-works/desktop-bridge.md#in-the-browser).
