# Update 1.0.7 - Launch Fix

This minor update patches a launch loop issue for new environments.

## Patch Notes

* **Launch Loop Fix**: If the user launches the application on a new computer without complete initial DCS configuration (and without history in local storage), the loading screen (`global-loader`) will now properly hide to let the user interact with the "DCS Scanner" modal. Before this patch, the modal window was partially or totally blocked behind the loading screen that wouldn't disappear, creating the illusion of an infinite loop.
* Rewrote the `z-index` system and added manual hiding of `global-loader` in `library.js` during the first launch sequence.
