# Collaborate on a mod

You will connect BSM to a GitHub repository so that several people can work on the same mod:
one pushes the project, the others pull it, and everyone can leave notes and go back to an earlier
version.

**You need:** a GitHub account, a repository for the mod (an empty private one is fine), and
write access to it for everyone on the team.

!!! warning "Your token is a password"

    BSM talks to GitHub with a **Personal Access Token** (PAT). It is stored on this computer
    only, but anyone who has it can write to your repositories. Give it the smallest scope that
    works, do not share it, and revoke it on GitHub when you no longer need it.

## Connect

- [ ] **Open Collaboration** from the sidebar.
- [ ] **Create a token.** Press **Create token** to open GitHub's token page, and create a token with the `repo` scope. Copy it.
- [ ] **Fill in GitHub Settings:** paste the token in **Personal Access Token**, type the **Repository** as `owner/name` (for example `owner/my-sound-mod`), and **Your Name / Username** so your notes are signed.
- [ ] **Press Save, then Test.** *You see:* *Connected as* followed by your GitHub name.

## Share the project

- [ ] **Push.** Under *Sync Project*, press **Push**. *You see:* the steps as BSM uploads `project.json`, `entry.lua`, the SDEFs and your audio, then *Build Pushed!*.
- [ ] **Your teammates Pull.** On their machine, with the same repository set up, they press **Pull**. *You see (on their side):* *Project pulled*, and the project, SDEFs and audio appear.

!!! note "Pull replaces the local project"

    Pulling loads the repository's version of the project in place of the one open on that
    machine. Push or save what you have before you pull.

## Talk and go back in time

- [ ] **Leave a note.** Under *Team Notes*, write a message and press **Post Note**. Everyone sees it after **Refresh**.
- [ ] **Restore a version.** Under *Commit History*, each push is listed. Press **Restore this version** on one to go back to it.

## If it does not work

| You see | Do this |
|---|---|
| *Enter PAT and repo first* | Fill in both fields and press **Save**. |
| The test fails | Check the token is still valid, has the `repo` scope, and that the repository name is exactly `owner/name`. |
| *No commits yet* | Nobody has pushed yet. Push once. |

More: [Collaboration](../features/collaboration.md).
