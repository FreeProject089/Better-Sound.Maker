# Collaborer sur un mod

Vous allez connecter BSM à un dépôt GitHub pour que plusieurs personnes travaillent sur le même
mod : l'une envoie (push) le projet, les autres le récupèrent (pull), et chacun peut laisser des
notes et revenir à une version antérieure.

**Il vous faut :** un compte GitHub, un dépôt pour le mod (un dépôt privé vide convient), et un
accès en écriture pour chaque membre de l'équipe.

!!! warning "Votre jeton est un mot de passe"

    BSM communique avec GitHub grâce à un **jeton d'accès personnel** (PAT). Il n'est stocké que
    sur cet ordinateur, mais quiconque le possède peut écrire dans vos dépôts. Donnez-lui la
    portée la plus réduite possible, ne le partagez pas, et révoquez-le sur GitHub quand vous n'en
    avez plus besoin.

## Se connecter

- [ ] **Ouvrez Collaboration** depuis la barre latérale.
- [ ] **Créez un jeton.** Appuyez sur **Créer jeton** pour ouvrir la page des jetons GitHub, et créez un jeton avec la portée `repo`. Copiez-le.
- [ ] **Remplissez Paramètres GitHub :** collez le jeton dans **Jeton d'Accès Personnel (PAT)**, saisissez le **Dépôt** sous la forme `propriétaire/nom` (par exemple `owner/my-sound-mod`), et **Votre Nom / Pseudo** pour signer vos notes.
- [ ] **Appuyez sur Enregistrer, puis Tester.** *Vous voyez :* un message de connexion suivi de votre nom GitHub.

## Partager le projet

- [ ] **Push.** Dans *Synchronisation*, appuyez sur **Push**. *Vous voyez :* les étapes pendant que BSM envoie `project.json`, `entry.lua`, les SDEF et votre audio, puis un message de réussite.
- [ ] **Vos coéquipiers font Pull.** Sur leur machine, avec le même dépôt configuré, ils appuient sur **Pull**. *Ils voient :* le projet, les SDEF et l'audio apparaître.

!!! note "Pull remplace le projet local"

    Un pull charge la version du dépôt à la place du projet ouvert sur cette machine. Faites un
    push ou enregistrez votre travail avant.

## Échanger et revenir en arrière

- [ ] **Laissez une note.** Dans *Notes d'Équipe*, écrivez un message et appuyez sur **Envoyer Note**. Tout le monde la voit après **Actualiser**.
- [ ] **Restaurez une version.** Dans *Historique des Commits*, chaque push est listé. Appuyez sur **Restaurer cette version** pour y revenir.

## Si cela ne fonctionne pas

| Vous voyez | Faites ceci |
|---|---|
| Un message demandant le PAT et le dépôt | Remplissez les deux champs et appuyez sur **Enregistrer**. |
| Le test échoue | Vérifiez que le jeton est toujours valide, qu'il a la portée `repo`, et que le dépôt est écrit exactement `propriétaire/nom`. |
| Aucun commit dans l'historique | Personne n'a encore fait de push. Faites-en un. |

Plus de détails : [Collaboration](../features/collaboration.md).
