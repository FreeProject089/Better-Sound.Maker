# Utiliser un préréglage

Un préréglage (preset) est une **sélection de sons** enregistrée : par exemple « tous les SDEF
moteur du F/A-18C ». L'appliquer sélectionne ces sons dans votre bibliothèque d'un seul coup, sans
avoir à les rechercher. Il enregistre quels SDEF sont sélectionnés, pas leurs valeurs de
paramètres ni votre audio.

**Il vous faut :** une [bibliothèque scannée](../getting-started/first-launch.md#4-scanner-la-bibliotheque).
Les préréglages s'appliquent sur elle.

## Appliquer un préréglage communautaire

- [ ] **Ouvrez Préréglages** depuis la barre latérale.
- [ ] **Appuyez sur Presets Communautaires.** *Vous voyez :* les préréglages du catalogue communautaire, avec leur nombre d'assets et leur version. Un préréglage que vous avez déjà affiche un bouton de mise à jour quand la version communautaire a changé.
- [ ] **Importez celui que vous voulez.** *Vous voyez :* il apparaît dans la liste des préréglages enregistrés. S'il contient des types de sons personnalisés, BSM demande s'il faut les importer aussi : **Oui, Importer les Types** les ajoute à vos [Types de sons](../features/sound-types.md).
- [ ] **Appuyez sur Appliquer.** *Vous voyez :* une confirmation indiquant combien d'assets il ajoute à votre sélection actuelle.
- [ ] **Choisissez Sauvegarder & Appliquer** pour d'abord garder votre sélection actuelle comme préréglage, ou **Appliquer sans sauvegarder**.
- [ ] **Ouvrez Projets.** *Vous voyez :* les sons du préréglage, prêts à recevoir votre audio.

## Enregistrer le vôtre

- [ ] **Sélectionnez des sons** dans la Bibliothèque.
- [ ] **Ouvrez Préréglages**, saisissez un nom et appuyez sur **Enregistrer la Sélection**.
- [ ] **Pour le partager**, appuyez sur **Exporter** pour l'enregistrer en fichier JSON. Les autres le chargent avec **Importer un Préréglage**.

## Si cela ne fonctionne pas

| Vous voyez | Faites ceci |
|---|---|
| Un message de bibliothèque non chargée et un bouton **Charger la Bibliothèque** | Appuyez dessus, ou scannez d'abord depuis la Bibliothèque. |
| *Offline: showing the last downloaded community catalog* | Vous n'avez pas de connexion ; la liste est la dernière copie téléchargée par BSM. |
| Pas de bouton **Presets Communautaires** | Les préréglages communautaires sont désactivés dans `Load.cfg` (`DisableCommunityPresets`). Voir [Load.cfg](../reference/load-cfg.md). |
| La liste communautaire n'est pas celle attendue | Vérifiez **Paramètres → Catalogue communautaire**. Voir [Paramètres](../features/settings.md#catalogue-communautaire). |

Plus de détails : [Préréglages](../features/presets.md).
