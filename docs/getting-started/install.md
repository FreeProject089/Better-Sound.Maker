# Install

Better Sound.Maker is a Windows desktop app. Download it from the
[latest release on GitHub](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest).

## Which file to download

A release offers several installers. They install the same app; they differ in how it is set up
and how it updates.

| File | What it is | Use it when |
|---|---|---|
| `Better.Sound.Maker.Setup.<version>.exe` | **BetterInstaller** setup | **Recommended.** Use this one unless you have a reason not to. |
| `…_x64-nsis-setup.exe` | NSIS installer | Backup, if the BetterInstaller setup does not work on your machine. |
| `…_x64.msi` | MSI package | Backup, or for deployment tools that expect an `.msi`. |

!!! tip "Pick one and stick with it"

    Each installer comes with its own update route (see below). If you switch to another
    installer, uninstall the old copy first so you do not end up with two.

## Install it

- [ ] Download `Better.Sound.Maker.Setup.<version>.exe` from the release page.
- [ ] Run it and follow the setup.
- [ ] Start **Better Sound.Maker** from the Start menu, then go on with [First launch](first-launch.md).

Windows SmartScreen may warn about a downloaded installer. Check that the file comes from the
official GitHub release page before you choose to run it.

## Updates

You do not need to come back here for new versions. BSM checks for updates shortly after it
starts, and the **Check for updates** button in the sidebar checks on demand. It uses the route
that matches how you installed it:

1. **BetterInstaller**, if you installed with the BetterInstaller setup. The app closes, updates,
   then restarts.
2. **The built-in updater**, for NSIS and MSI installs, or when BetterInstaller could not answer.
   The update downloads and installs, and the app restarts.
3. **The releases page**, when neither can be reached. BSM tells you a new version exists and
   opens the GitHub release so you can download it yourself.

Details: [Update the app](../guide/update-the-app.md) and
[Updates and releases](../how-it-works/updates-and-releases.md).

## The web version

BSM's interface can also run in a browser. If a web version is offered, it works for browsing,
editing and building, with fewer features:

| | Desktop app | Browser |
|---|---|---|
| Scan your DCS folder from disk | Yes | No |
| Build straight into a folder you choose | Yes | Only in browsers with folder access (Chrome, Edge); otherwise you get a `.zip` download |
| Built-in updater | Yes | No, the page reloads the new version |

For real mod work, use the desktop app.
