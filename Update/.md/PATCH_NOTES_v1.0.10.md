# Update 1.0.10 — Sound Fix & Security Hardening

This update fixes a long-standing bug preventing custom sounds from playing in-game and closes several security issues found during a code audit.

## Patch Notes

* **Custom Sound Trigger Fix**: Fixed the SDEF export structure — `.sdef` files are now written under `Sounds/sdef/Effects/` instead of `Sounds/sdef/`. Previously, DCS would detect the mod correctly in the main menu but never actually trigger the custom sound because it couldn't find the sound definition at the path it expected. Mods re-imported from a previous export (or third-party mods) are still read correctly regardless of which layout they use.
* **Security: XSS Hardening**: Escaped user-entered notes, filenames, and asset/wave paths before rendering them in the Library and Project pages and in toast notifications. These values can originate from an imported mod ZIP, so unescaped rendering could have allowed a malicious mod to inject and execute script inside the app.
* **Security: Electron Sandbox**: Re-enabled the Electron renderer sandbox (`sandbox: true`), which had been unnecessarily disabled, reducing the attack surface of the main window.
