# Installation

Better Sound.Maker est une application de bureau pour Windows. Téléchargez-la depuis la
[dernière version sur GitHub](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest).

## Quel fichier télécharger

Chaque version propose plusieurs installeurs. Ils installent la même application ; ils diffèrent
par la façon dont elle est installée et mise à jour.

| Fichier | Ce que c'est | Quand l'utiliser |
|---|---|---|
| `Better.Sound.Maker.Setup.<version>.exe` | Installeur **BetterInstaller** | **Recommandé.** Prenez celui-ci, sauf raison particulière. |
| `…_x64-nsis-setup.exe` | Installeur NSIS | Secours, si l'installeur BetterInstaller ne fonctionne pas sur votre machine. |
| `…_x64.msi` | Paquet MSI | Secours, ou pour les outils de déploiement qui attendent un `.msi`. |

!!! tip "Choisissez-en un et gardez-le"

    Chaque installeur a sa propre voie de mise à jour (voir plus bas). Si vous changez
    d'installeur, désinstallez d'abord l'ancienne copie pour ne pas en avoir deux.

## L'installer

- [ ] Téléchargez `Better.Sound.Maker.Setup.<version>.exe` depuis la page de la version.
- [ ] Lancez-le et suivez l'installation.
- [ ] Démarrez **Better Sound.Maker** depuis le menu Démarrer, puis passez au [Premier lancement](first-launch.md).

Windows SmartScreen peut afficher un avertissement pour un installeur téléchargé. Vérifiez que le
fichier vient bien de la page officielle des versions GitHub avant de choisir de l'exécuter.

## Mises à jour

Inutile de revenir ici à chaque version. BSM recherche les mises à jour peu après son démarrage,
et le bouton **Vérifier les mises à jour** de la barre latérale vérifie à la demande. Il utilise la voie
qui correspond à votre installation :

1. **BetterInstaller**, si vous avez installé avec l'installeur BetterInstaller. L'application se
   ferme, se met à jour, puis redémarre.
2. **Le module de mise à jour intégré**, pour les installations NSIS et MSI, ou quand
   BetterInstaller n'a pas pu répondre. La mise à jour est téléchargée, installée, et
   l'application redémarre.
3. **La page des versions**, quand aucun des deux n'est joignable. BSM vous signale qu'une
   nouvelle version existe et ouvre la page GitHub pour que vous la téléchargiez vous-même.

Détails : [Mettre à jour l'application](../guide/update-the-app.md) et
[Mises à jour et versions](../how-it-works/updates-and-releases.md).

## La version web

L'interface de BSM peut aussi fonctionner dans un navigateur. Si une version web est proposée,
elle permet de parcourir, d'éditer et de générer, avec moins de fonctions :

| | Application de bureau | Navigateur |
|---|---|---|
| Scanner votre dossier DCS sur le disque | Oui | Non |
| Générer directement dans un dossier choisi | Oui | Seulement dans les navigateurs qui donnent accès aux dossiers (Chrome, Edge) ; sinon vous obtenez un `.zip` à télécharger |
| Mise à jour intégrée | Oui | Non, la page recharge la nouvelle version |

Pour un vrai travail de mod, utilisez l'application de bureau.
