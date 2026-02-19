# 📄 Release Guide — Better Sound.Maker v1.0.1

This guide covers the process of releasing a new version of the application.

## 🚀 Version 1.0.1 Highlights
- **Auto-Updater**: The app now checks for updates on GitHub at launch and on closure.
- **Onboarding Polish**: Mascot "Tasky" introduced with a smooth typing animation for better user engagement.
- **Release Notes**: New modal system to showcase latest changes after an update.

## 🛠️ Release Steps
1. **Update Version**: Edit `package.json`, `README.md`, and `RELEASE_GUIDE.md`.
2. **Commit Changes**: Push to main branch.
3. **Draft Release**: Create a new release on GitHub with tag `v1.0.1`.
4. **Build Binaries**: Run `npm run electron:build`.
5. **Upload Assets**: Attach the `.exe` (and others) to the GitHub release.
6. **Publish**: Release it to the world!

---
*Maintained by FreeProject089*
