# 🛠️ Patch Note — v1.0.2

### FIXES AND IMPROVEMENTS
- **True Auto-Updates**: Transitioned from a manual update check prompt to `electron-updater`, enabling fully automatic background downloads of new versions directly from GitHub Releases.
- **Silent Background Download**: The application now quietly downloads the latest version while you work. When the download is complete, you will be prompted to either restart immediately or let it install seamlessly the next time you quit the app.
- **Automated Publishing**: Configured `package.json` build settings to point to the `FreeProject089/Better-ModMaker` GitHub repository, streamlining the update pipeline.
- **Faster Exit**: Cleaned up manual check code and removed forced timeouts, preventing unnecessary exit delays when the app is quitting.
