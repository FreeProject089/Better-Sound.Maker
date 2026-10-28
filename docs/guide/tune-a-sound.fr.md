# Régler un son

Vous allez changer la façon dont un son est joué (plus fort, portant plus loin, en boucle ou non)
dans l'éditeur SDEF, puis l'enregistrer pour que le prochain build l'utilise.

**Il vous faut :** un son déjà dans votre projet ([Créer votre premier mod](first-mod.md) montre
comment).

## Étapes

- [ ] **Ouvrez l'Éditeur SDEF** depuis la barre latérale. *Vous voyez :* les SDEF de votre projet dans une liste à gauche.
- [ ] **Cliquez sur le SDEF** à régler. *Vous voyez :* ses paramètres par groupes : Échantillon Sonore, Contrôle du Volume, Fréquence / Pitch, Distance & Rayon, Mode de Lecture, etc.
- [ ] **Changez une valeur.** Saisissez-la, ou utilisez les boutons − et +. Par exemple, augmentez `gain` pour un son plus fort, ou `outer_radius` pour l'entendre de plus loin. *Vous voyez :* le panneau des problèmes se met à jour pendant la saisie.
- [ ] **Lisez le panneau des problèmes.** Il liste les erreurs à corriger, les avertissements et les simples indications. *Aucun problème détecté* signifie que le SDEF est cohérent.
- [ ] **Regardez la courbe** sous Distance & Rayon. *Vous voyez :* le volume du son à chaque distance, de `silent_radius` jusqu'à `outer_radius`.
- [ ] **Appuyez sur Play** pour écouter le son avec vos réglages.
- [ ] **Appuyez sur Enregistrer.** *Vous voyez :* *SDEF Enregistré*.

!!! warning "Enregistrez avant de générer"

    La page Build n'utilise que les SDEF enregistrés. Si des modifications ne sont pas
    enregistrées, Build vous prévient avec un encadré *Unsaved SDEF changes* et un bouton
    **Save All**.

## Réglages courants

| Vous voulez | Changez |
|---|---|
| Plus fort ou moins fort | `gain` (1.0 = inchangé, 0.5 = moitié) |
| Plus aigu ou plus grave | `pitch` (1.0 = inchangé) |
| Entendu de plus loin | `outer_radius` (et `inner_radius` pour la distance où il reste presque à plein volume) |
| Jouer une fois, en entier (explosions, tirs) | `detached` activé |
| Un peu de variété à chaque lecture | plusieurs fichiers dans `wave`, `listmode` RANDOM ; ou `gain_random` / `pitch_random` |
| Pas d'effet Doppler (sons du cockpit et de l'interface) | `nodoppler` activé |

Chaque paramètre est expliqué dans [Paramètres SDEF](../reference/sdef-parameters.md).

## Si cela ne fonctionne pas

| Vous voyez | Faites ceci |
|---|---|
| La liste de l'Éditeur SDEF est vide | Sélectionnez d'abord des sons dans la Bibliothèque : l'éditeur liste votre projet. |
| Une erreur sur l'ordre des rayons | Les rayons doivent croître : `silent_radius` ≤ `peak_radius` ≤ `inner_radius` ≤ `outer_radius`. |
| *No wave and no inherit: this sound will be silent* | Donnez un fichier à `wave`, ou héritez d'un autre SDEF avec `inherit`. |

## Ensuite

Enregistrez ces réglages comme modèle pour les réutiliser sur d'autres sons : voir
[Éditeur SDEF → Modèles](../features/sdef-editor.md#modeles).
