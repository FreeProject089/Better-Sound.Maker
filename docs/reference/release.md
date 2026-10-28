# Release checklist

How to publish a new version. The reasoning behind each step is in
[Updates and releases](../how-it-works/updates-and-releases.md).

## Prerequisites

- Both private keys present (see [Keys](#keys)).
- A BetterInstaller checkout, pointed to by `-BetterInstallerDir`, `$env:BSM_BETTERINSTALLER`, or the default `../BetterModsManager/BetterInstaller`. If `bpkg.exe` / `betterinstaller.exe` are not built, the script runs `cargo build --release -p bpkg-cli -p installer` there.
- The GitHub CLI (`gh`) logged in.

## Steps

1. **Bump the version** in `package.json`. It is the only place: `APP_VERSION` (`src/utils/version.js`) is read from it at build time, `tauri.conf.json` points at it, and the release script copies it into `installer.toml` and `Cargo.toml`.
2. **Write the patch notes** in `Update/.md/PATCH_NOTES_v<version>.md` (shown once after the update).
3. **Build every asset:**
   ```powershell
   ./scripts/release.ps1 -Notes "What changed"
   ```
   The script syncs the version into `installer/installer.toml` and `src-tauri/Cargo.toml`, runs `tauri build`, then packs and signs. `-SkipTauriBuild` reuses an existing build.
4. **Check `./release`** contains:

    | File | Used by |
    |---|---|
    | `Better.Sound.Maker.Setup.<v>.exe` | new users (primary installer) |
    | `bsm.bpkg` | BetterInstaller update |
    | `update.json` | BetterInstaller update check |
    | `Better.Sound.Maker_<v>_x64-nsis-setup.exe` + `.sig` | NSIS users, Tauri updater |
    | `Better.Sound.Maker_<v>_x64.msi` + `.sig` | MSI users, Tauri updater |
    | `latest.json` | Tauri updater |

5. **Publish**, tag without a `v` prefix, uploading **all** files (each is needed by one of the two updaters):
   ```powershell
   gh release create <version> release/* --repo FreeProject089/Better-Sound.Maker --title "<version>" --notes-file <notes.md>
   ```
   Both updaters read from `releases/latest/download/…`, so the new release must be marked *latest*.

## Every week: re-sign update.json

`update.json` expires 7 days after it was signed. Until the next release:

```bash
bpkg resign-manifest update.json --key ~/.betterinstaller/better-sound-maker/private.key
gh release upload <version> update.json --clobber --repo FreeProject089/Better-Sound.Maker
```

If you forget, BetterInstaller installs fall back to the Tauri updater; nothing breaks, but rollback is lost.

## Keys

| Key | Location | Environment override |
|---|---|---|
| Tauri updater (minisign) | `~/.tauri/better-sound-maker.key` | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` |
| BetterInstaller (Ed25519) | `~/.betterinstaller/better-sound-maker/private.key` and `public.key` | `BSM_BI_PRIVATE_KEY_FILE` |

!!! danger "Back them up"
    Keep an offline copy of both private keys. Without them, no installed copy will accept an update.
