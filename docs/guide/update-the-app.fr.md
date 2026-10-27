# Mettre à jour l'application

BSM se met à jour lui-même. Cette page montre comment vérifier à la main et à quoi vous attendre.

## Étapes

- [ ] **Appuyez sur Vérifier les mises à jour** dans la barre latérale. *Vous voyez :* *Recherche de mises à jour...*, puis soit *Vous avez la dernière version !*, soit une fenêtre **Mise à jour disponible !** avec votre version et la nouvelle.
- [ ] **Appuyez sur Mettre à jour.** La suite dépend de la façon dont vous avez installé BSM (voir plus bas).
- [ ] **Attendez le redémarrage.** *Vous voyez :* BSM se rouvre sur la nouvelle version.

BSM vérifie aussi de lui-même peu après chaque démarrage. Si une mise à jour existe, la même
fenêtre apparaît ; appuyez sur **Later** pour continuer à travailler.

## Ce qui se passe avec Update Now

| Vous avez installé avec | Ce qui se passe |
|---|---|
| `Better.Sound.Maker.Setup.<version>.exe` (BetterInstaller) | L'application se ferme, BetterInstaller la met à jour, puis elle redémarre. |
| Le `.exe` NSIS ou le `.msi` | La mise à jour est téléchargée et installée, puis l'application redémarre. |
| L'un ou l'autre, mais le module de mise à jour est injoignable | La page des versions GitHub s'ouvre. Téléchargez le nouvel installeur et lancez-le. |

Si la mise à jour BetterInstaller ne démarre pas, BSM essaie le module de mise à jour intégré,
puis la page des versions. Pourquoi cet ordre :
[Mises à jour et versions](../how-it-works/updates-and-releases.md).

## Si cela ne fonctionne pas

| Vous voyez | Faites ceci |
|---|---|
| *Updates Disabled* | Les mises à jour automatiques sont désactivées par `DisableAutoUpdate` dans `Load.cfg`. Téléchargez vous-même les nouvelles versions sur la [page des versions](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest). Voir [Load.cfg](../reference/load-cfg.md). |
| *Could not reach update server* | Vérifiez votre connexion, ou téléchargez depuis la page des versions. |
| *Update failed, opening the releases page.* | Installez la nouvelle version depuis la page qui s'est ouverte. |
