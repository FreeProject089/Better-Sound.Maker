# 🚀 Release Note — v1.0.2

We are excited to bring you the **v1.0.2** update for **Better Sound.Maker**!

### What's New?
Our major focus for this release is **Seamless Updates**. We know that modding DCS is a full-time job, so we don't want to bother you with manual browser downloads for new versions of the app!

- **Background Auto-Updater Integration**: Better Sound.Maker now natively integrates with GitHub Releases via `electron-updater`.
- **Zero-Friction Installs**: When a new update is found, it will safely download in the background without interrupting your workflow.
- **Quit-to-Install**: Once downloaded, the application will simply apply the fresh update behind the scenes when you normally close the app, or you can choose to apply it immediately!

### Developer Notes
- `electron-updater` has been fully implemented and configured.
- The `before-quit` delay logic has been removed to optimize closing speed and prevent conflicts with the updater.
- Updated `README.md` and build configurations (`appId` and `publish` blocks) to support standard GitHub publication flows.

*Thanks for using Better Sound.Maker! Happy Modding!*
