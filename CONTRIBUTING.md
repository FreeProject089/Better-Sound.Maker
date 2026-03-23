# 🤝 Contributing to Better ModMaker

First off, thank you for considering contributing to **Better ModMaker**! It's people like you who make this project better for the DCS World community.

Whether you're fixing a bug, adding a new sound type, or helping with translations, your help is greatly appreciated.

---

## 🏛️ Project Architecture
Better ModMaker is built with:
- **Core**: Vanilla JavaScript & CSS for maximum performance and portability.
- **Bundler**: [Vite](https://vitejs.dev/) for fast development and optimized builds.
- **Desktop Wrapper**: [Electron](https://www.electronjs.org/) to handle file system access.
- **State Management**: A custom, lightweight reactive store (`src/state/store.js`).
- **Styles**: Pure vanilla CSS—no heavy frameworks, keeping the UI snappy and modular.

---

## 🌍 Translation & Localization (i18n)
Since v1.0.6, the app supports multi-language localization. Helping with translations is one of the easiest ways to contribute!
- **Locales**: Found in `src/locales/` (`en.json`, `fr.json`).
- **Adding a Language**: 
  1. Create a new `.json` file in `src/locales/` (e.g., `de.json`).
  2. Register it in `src/utils/i18n.js`.
  3. Translate the keys from `en.json`.
- **Using t()**: Use the `t('key.path')` function to display localized text in your JS files.

---

## 🏷️ Sound Type Management
Sound categorization is driven by JSON rule files.
- **Global Rules**: Located in `public/sound-types/default.json`.
- **Adding Rules**: If you notice a DCS module or mod isn't categorized correctly, update `default.json` with a new Regex pattern and type.
- **Custom Types**: Users can create their own types via the **Custom Sound Type Manager** in-app.

---

## 🚀 Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/FreeProject089/Better-Sound.Maker.git
   cd Better-Sound.Maker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Development**:
   - **Electron (Recommended)**: `npm run electron:dev` (Provides full file system access).
   - **Web Browser**: `npm run dev` (Simulated environment, limited file access).

4. **Build for production**:
   - `npm run electron:build`

---

## 🛠️ How Can I Contribute?

### 🐛 Reporting Bugs
- Check the [Issues tab](https://github.com/FreeProject089/Better-Sound.Maker/issues) to see if the bug has already been reported.
- If not, open a new issue using the **Bug report** template.
- Provide as much detail as possible: steps to reproduce, screenshots, and logs from the DevTools console (F12).

### ✨ Suggesting Enhancements
- Open a new issue using the **Feature request** template.
- Explain the motivation and how it benefits the modding community.

### 🍱 Pull Requests
We follow a specific Git workflow:
1. **Fork** the repository and create your feature branch from the `develop` branch.
2. Follow our [Git Workflow Guide](.agents/workflows/git-workflow.md) for naming conventions.
3. Keep your PRs focused on a single change.
4. Link your PR to a relevant issue (e.g., `Fixes #123`).
5. TARGET the `develop` branch for all PRs.

---

## 📜 Code Style & Rules
- **Formatting**: We aim for clean, readable code. Let the logic be explicit.
- **No Heavy Deps**: Avoid adding large NPM packages unless absolutely necessary.
- **CSS Hierarchy**: Use the variable-based design system in `src/style.css` for consistent colors and spacing.
- **Config**: Respect flags in `src/Load.cfg` and `window.APP_CONFIG`.

---

## 🤝 Code of Conduct
Please be respectful and professional in all interactions. We aim to maintain a welcoming environment for everyone, regardless of experience level.

Happy coding! 🚀

