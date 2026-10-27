# Collaboration

!!! tip "Vous préférez le pas à pas ?"

    La version « tâche » de cette page est [Collaborer sur un mod](../guide/collaborate.md).

**Collaboration** synchronise votre projet avec un dépôt GitHub, pour que plusieurs personnes
travaillent sur le même mod. Inutile d'installer Git : BSM communique directement avec GitHub. La
page compte quatre cartes.

<!-- screenshot: the Collaboration page with the four cards -->

## Paramètres GitHub

| Champ | À saisir |
|---|---|
| **Jeton d'Accès Personnel (PAT)** | Un jeton GitHub avec la portée `repo`. **Créer jeton** ouvre la page des jetons de GitHub. |
| **Dépôt (Repository)** | `propriétaire/nom`, par exemple `owner/my-sound-mod`. |
| **Votre Nom / Pseudo** | Le nom qui signe vos notes. |

**Enregistrer** garde les réglages, **Tester** vérifie la connexion et affiche votre nom GitHub.

!!! warning "Gardez votre jeton privé"

    Le jeton n'est stocké que sur cet ordinateur (dans le stockage local de l'application) et
    n'est envoyé qu'à GitHub. Quiconque le possède peut écrire dans vos dépôts : ne le partagez
    pas, et révoquez-le sur GitHub quand vous avez terminé.

## Synchronisation

- **Push** envoie tout le projet dans le dépôt : `project.json` (le projet et ses réglages),
  `entry.lua`, les SDEF sous `Sounds/sdef/` et votre audio. Chaque push est un commit.
- **Pull** télécharge le projet depuis le dépôt, avec son audio, et **remplace** le projet ouvert
  dans BSM.

## Notes d'Équipe

Écrivez un message et appuyez sur **Envoyer Note**. Les notes sont stockées dans le dossier
`notes/` du dépôt, signées de votre nom. **Actualiser** charge les nouvelles.

## Historique des Commits

Liste les commits du dépôt, du plus récent au plus ancien. **Restaurer cette version** ramène le
projet à cet instantané.

## Voir aussi

- [Sécurité](../how-it-works/security.md) : comment le jeton est traité.
