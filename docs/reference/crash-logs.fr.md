# Crash logs

Un crash log est un seul fichier texte qui contient tout ce qu'il faut pour comprendre un problème.
Joignez-le à votre rapport de bug.

## En générer un

Chacune de ces actions ouvre la fenêtre **Générer un crash log** :

- le bouton :material-bug-outline: à côté de **Vérifier les mises à jour**, en bas de la barre latérale ;
- *Paramètres → Diagnostic → Générer le crash log* ;
- ++ctrl+shift+l++ n'importe où dans l'application.

Vous pouvez décrire ce que vous faisiez (facultatif), puis :

| Bouton | Résultat |
|---|---|
| **Générer le crash log** | Bureau : enregistré sous `crash-<date>-<heure>.log` dans le dossier des logs. Navigateur : téléchargé sous `bsm-crash-<date>.log`. |
| **Copier** | Le même rapport, copié dans le presse-papiers (pour le coller dans une issue ou un message). |
| **Ouvrir le dossier des logs** | Bureau uniquement. Ouvre le dossier dans l'Explorateur. |

## Logs automatiques

Dans l'application de bureau, une erreur non interceptée enregistre automatiquement un crash log (au
plus une fois par minute) et une notification propose d'ouvrir le dossier. Dans le navigateur, la
notification propose d'en générer un.

Si la partie Rust de l'application plante (un *panic*), un fichier `panic-<date>-<heure>.log` avec la
trace est écrit avant la fermeture. Le prochain crash log que vous générez inclut les trois derniers.

## Où sont les fichiers

| Système | Dossier |
|---|---|
| Windows | `%LOCALAPPDATA%\com.bettersoundmaker.app\logs` |

Seuls les 30 logs les plus récents sont conservés.

## Contenu

1. Raison, heure, version, mode (bureau ou web), durée de la session, page courante, votre note.
2. Bureau : version de Tauri, système et architecture, type d'installation (BetterInstaller ou NSIS/MSI), dossiers de l'exécutable et des données.
3. Environnement : moteur du navigateur, langue, fuseau horaire, écran, threads CPU, mémoire.
4. Valeurs de `Load.cfg` et vos paramètres.
5. Un résumé de l'état : nombre d'assets sélectionnés, de SDEF non enregistrés, de presets, de templates, taille de la bibliothèque.
6. État du catalogue communautaire et ses problèmes.
7. Stockage local : **noms des clés et tailles uniquement**.
8. Toutes les erreurs de la session avec leur pile d'appels.
9. Les panics Rust des lancements précédents.
10. Le fil d'Ariane (changements de page) et les 400 dernières lignes de la console.

!!! note "Confidentialité"
    Aucun secret n'est écrit. Les jetons GitHub et les valeurs `Bearer` sont masqués partout, les
    valeurs du stockage local (où se trouve votre jeton de collaboration) ne sont jamais lues dans le
    rapport, et votre dossier utilisateur Windows est raccourci en `~`. Relisez le fichier avant de le
    partager si vous voulez en être sûr.

Le code de capture est dans [`src/utils/crash-log.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/crash-log.js) ;
l'écriture des fichiers et le hook de panic dans [`src-tauri/src/lib.rs`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src-tauri/src/lib.rs).
