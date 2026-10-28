# Liste de publication

Comment publier une nouvelle version. Le raisonnement derrière chaque étape est dans
[Mises à jour et versions](../how-it-works/updates-and-releases.md).

## Prérequis

- Les deux clés privées présentes (voir [Clés](#keys)).
- Un dépôt BetterInstaller, désigné par `-BetterInstallerDir`, `$env:BSM_BETTERINSTALLER`, ou par défaut `../BetterModsManager/BetterInstaller`. Si `bpkg.exe` / `betterinstaller.exe` ne sont pas compilés, le script y lance `cargo build --release -p bpkg-cli -p installer`.
- La CLI GitHub (`gh`) connectée.

## Étapes

1. **Augmenter la version** dans `package.json`. C'est le seul endroit : `APP_VERSION` (`src/utils/version.js`) y est lu au build, `tauri.conf.json` pointe dessus, et le script de release la recopie dans `installer.toml` et `Cargo.toml`.
2. **Écrire les notes de version** dans `Update/.md/PATCH_NOTES_v<version>.md` (affichées une fois après la mise à jour).
3. **Produire tous les fichiers :**
   ```powershell
   ./scripts/release.ps1 -Notes "Ce qui a changé"
   ```
   Le script recopie la version dans `installer/installer.toml` et `src-tauri/Cargo.toml`, lance `tauri build`, puis empaquette et signe. `-SkipTauriBuild` réutilise une compilation existante.
4. **Vérifier que `./release`** contient :

    | Fichier | Utilisé par |
    |---|---|
    | `Better.Sound.Maker.Setup.<v>.exe` | nouveaux utilisateurs (installeur principal) |
    | `bsm.bpkg` | mise à jour BetterInstaller |
    | `update.json` | vérification BetterInstaller |
    | `Better.Sound.Maker_<v>_x64-nsis-setup.exe` + `.sig` | utilisateurs NSIS, updater Tauri |
    | `Better.Sound.Maker_<v>_x64.msi` + `.sig` | utilisateurs MSI, updater Tauri |
    | `latest.json` | updater Tauri |

5. **Publier**, avec une étiquette sans préfixe `v`, en téléversant **tous** les fichiers (chacun est nécessaire à l'un des deux updaters) :
   ```powershell
   gh release create <version> release/* --repo FreeProject089/Better-Sound.Maker --title "<version>" --notes-file <notes.md>
   ```
   Les deux updaters lisent `releases/latest/download/…` : la nouvelle release doit être marquée *latest*.

## Chaque semaine : re-signer update.json

`update.json` expire 7 jours après sa signature. Jusqu'à la version suivante :

```bash
bpkg resign-manifest update.json --key ~/.betterinstaller/better-sound-maker/private.key
gh release upload <version> update.json --clobber --repo FreeProject089/Better-Sound.Maker
```

En cas d'oubli, les installations BetterInstaller se rabattent sur l'updater Tauri : rien ne casse,
mais le retour arrière est perdu.

## Clés {#keys}

| Clé | Emplacement | Variable de remplacement |
|---|---|---|
| Updater Tauri (minisign) | `~/.tauri/better-sound-maker.key` | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` |
| BetterInstaller (Ed25519) | `~/.betterinstaller/better-sound-maker/private.key` et `public.key` | `BSM_BI_PRIVATE_KEY_FILE` |

!!! danger "Sauvegardez-les"
    Gardez une copie hors ligne des deux clés privées. Sans elles, aucune copie installée n'acceptera de mise à jour.
