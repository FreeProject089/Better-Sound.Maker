# Collaboration

!!! tip "Prefer it step by step?"

    The task version of this page is [Collaborate on a mod](../guide/collaborate.md).

**Collaboration** syncs your project with a GitHub repository, so several people can work on the
same mod. No Git install is needed: BSM talks to GitHub directly. The page has four cards.

<!-- screenshot: the Collaboration page with the four cards -->

## GitHub Settings

| Field | What to enter |
|---|---|
| **Personal Access Token** | A GitHub token with the `repo` scope. **Create token** opens GitHub's token page. |
| **Repository** | `owner/name`, for example `owner/my-sound-mod`. |
| **Your Name / Username** | The name your notes are signed with. |

**Save** stores the settings, **Test** checks the connection and shows *Connected as* with your
GitHub name.

!!! warning "Keep your token private"

    The token is stored on this computer only (in the app's local storage), and is sent only to
    GitHub. Anyone who has it can write to your repositories: do not share it, and revoke it on
    GitHub when you are done.

## Sync Project

- **Push** uploads the whole project to the repository: `project.json` (the project and its
  settings), `entry.lua`, the SDEFs under `Sounds/sdef/` and your audio. Each push is a commit.
- **Pull** downloads the project from the repository, with its audio, and **replaces** the project
  open in BSM.

## Team Notes

Write a message and press **Post Note**. Notes are stored in the repository's `notes/` folder,
signed with your name. **Refresh** loads new ones.

## Commit History

Lists the repository's commits, newest first. **Restore this version** brings the project back to
that snapshot.

## Related

- [Security](../how-it-works/security.md): how the token is handled.
