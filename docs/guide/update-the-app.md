# Update the app

BSM updates itself. This page shows how to check by hand and what to expect.

## Steps

- [ ] **Press Check for updates** in the sidebar. *You see:* *Checking for updates...*, then either *You are running the latest version!* or an **Update available!** window with your version and the new one.
- [ ] **Press Update now.** What happens next depends on how you installed BSM (below).
- [ ] **Wait for the restart.** *You see:* BSM opens again on the new version.

BSM also checks on its own a moment after each start. If an update exists, the same window
appears; press **Later** to keep working.

## What happens on Update Now

| You installed with | What happens |
|---|---|
| `Better.Sound.Maker.Setup.<version>.exe` (BetterInstaller) | The app closes, BetterInstaller updates it, and it restarts. |
| The NSIS `.exe` or the `.msi` | The update downloads and installs, then the app restarts. |
| Either, but the updater cannot be reached | The GitHub releases page opens. Download the new installer and run it. |

If the BetterInstaller update fails to start, BSM tries the built-in updater, then the releases
page. Why this order: [Updates and releases](../how-it-works/updates-and-releases.md).

## If it does not work

| You see | Do this |
|---|---|
| *Updates Disabled* | Automatic updates are turned off with `DisableAutoUpdate` in `Load.cfg`. Download new versions yourself from the [releases page](https://github.com/FreeProject089/Better-Sound.Maker/releases/latest). See [Load.cfg](../reference/load-cfg.md). |
| *Could not reach update server* | Check your connection, or download from the releases page. |
| *Update failed, opening the releases page.* | Install the new version from the page that opened. |
