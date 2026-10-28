# Premier lancement

La première fois que vous ouvrez Better Sound.Maker, une courte visite guidée démarre. Cette page
explique ce qu'elle vous demande et quoi faire juste après.

## 1. Choisir la langue

Le premier écran de la visite est **Welcome / Bienvenue**. Choisissez **English** ou
**Français** : toute l'interface change aussitôt. Vous pourrez en changer plus tard avec le
sélecteur de langue de la barre latérale.

<!-- screenshot: the onboarding language step -->

## 2. Suivre (ou passer) la visite

La visite parcourt ensuite chaque écran de la barre latérale : Bibliothèque, Projets, Éditeur
SDEF, Thème, Préréglages, Types de Sons, Collaboration, Build, Paramètres, Documentation et
Crédits. Chaque étape ouvre l'écran dont elle parle, pour que vous voyiez où se trouvent les
choses.

Appuyez sur **Suivant** pour avancer, ou **Passer** pour la fermer. Pour la revoir, utilisez
**Relancer Tuto** dans la section Aide de la barre latérale.

## 3. Indiquer le dossier de DCS

BSM lit la liste des sons dans votre installation de DCS World ; il doit donc savoir où elle se
trouve. Vous pouvez l'indiquer à deux endroits :

- **Paramètres → Dossier d'installation de DCS World** : saisissez le chemin ou appuyez sur
  **Sélectionner un dossier**.
- **Le scanner** qui s'ouvre depuis la Bibliothèque (étape suivante), qui le demande aussi.

Un chemin typique est `C:\Program Files\Eagle Dynamics\DCS World`. Les installations Steam se
trouvent sous `…\steamapps\common\DCSWorld`.

!!! warning "Scannez une installation propre"

    Le scanner lit ce que contient le dossier de DCS. Si des mods ont été copiés dans le dossier
    du jeu lui-même, leurs fichiers apparaissent dans la bibliothèque comme s'ils étaient ceux du
    jeu. Scannez une installation sans mod. Les mods de `Saved Games` ne posent pas de problème :
    ils sont scannés à part, et seulement si vous le demandez.

## 4. Scanner la bibliothèque

Ouvrez la **Bibliothèque d'Assets**. Au premier lancement, le **Scanner d'Assets DCS** s'ouvre.

- [ ] **Chemin d'installation DCS** : votre dossier DCS.
- [ ] **Chemin Saved Games (Optionnel)** : par exemple `C:\Users\<vous>\Saved Games\DCS`, si vous voulez aussi les sons des mods installés là.
- [ ] Appuyez sur **Lancer le Scan**.

BSM lit `Doc\Sounds\sdef_and_wave_list.txt`, votre dossier `CoreMods` et, si vous l'avez
indiqué, les mods de Saved Games. À la fin, la bibliothèque contient tous les SDEF trouvés,
rangés en dossiers. Le résultat est conservé : le démarrage suivant est rapide.

**Fichier Manuel** charge un fichier de liste de sons que vous choisissez, au lieu de scanner.

Pour rescanner plus tard (après une mise à jour de DCS ou un nouveau module), appuyez sur
**Recharger la Bibliothèque**. **Paramètres → Auto-scan de l'Assets Library** le fait à chaque
démarrage.

## Ensuite

Vous êtes prêt. [Créez votre premier mod](../guide/first-mod.md), ou lisez
[Comment fonctionnent les mods sonores DCS](dcs-sound-mods.md) si les SDEF sont nouveaux pour vous.
