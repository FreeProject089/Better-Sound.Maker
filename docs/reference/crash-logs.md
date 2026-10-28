# Crash logs

A crash log is one text file with everything needed to understand a problem. Attach it to your bug
report.

## Generate one

Any of these opens the **Generate a crash log** dialog:

- the :material-bug-outline: button next to **Check for updates** at the bottom of the sidebar;
- *Settings → Diagnostics → Generate crash log*;
- ++ctrl+shift+l++ anywhere in the app.

You can describe what you were doing (optional), then:

| Button | Result |
|---|---|
| **Generate crash log** | Desktop: saved as `crash-<date>-<time>.log` in the logs folder. Browser: downloaded as `bsm-crash-<date>.log`. |
| **Copy** | The same report, copied to the clipboard (to paste into an issue or a message). |
| **Open logs folder** | Desktop only. Opens the folder in Explorer. |

## Automatic logs

In the desktop app, an uncaught error saves a crash log automatically (at most once a minute) and a
toast offers to open the folder. In the browser, the toast offers to generate one.

If the Rust side of the app crashes (a *panic*), a `panic-<date>-<time>.log` with the backtrace is
written before the app closes. The next crash log you generate includes the last three.

## Where the files are

| OS | Folder |
|---|---|
| Windows | `%LOCALAPPDATA%\com.bettersoundmaker.app\logs` |

Only the 30 newest logs are kept.

## What is inside

1. Reason, time, app version, mode (desktop or web), uptime, current page, your note.
2. Desktop: Tauri version, OS and architecture, install type (BetterInstaller or NSIS/MSI), executable and data folders.
3. Environment: browser engine, language, time zone, screen, CPU threads, memory.
4. `Load.cfg` values and your settings.
5. A state summary: number of selected assets, unsaved SDEFs, presets, templates, library size.
6. Community catalog status and its problems.
7. Local storage: **key names and sizes only**.
8. Every error of the session with its stack.
9. Rust panics from earlier runs.
10. Breadcrumbs (page changes) and the last 400 console lines.

!!! note "Privacy"
    No secret is written. GitHub tokens and `Bearer` values are masked everywhere, local storage
    values (where your collaboration token lives) are never read into the report, and your Windows
    user folder is shortened to `~`. Read the file before sharing it if you want to be sure.

The capture code is in [`src/utils/crash-log.js`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src/utils/crash-log.js);
the file writing and the panic hook in [`src-tauri/src/lib.rs`](https://github.com/FreeProject089/Better-Sound.Maker/blob/main/src-tauri/src/lib.rs).
