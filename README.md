# 🎧 Better Sound.Maker

**Better Sound.Maker** is a powerful, modern desktop application designed to streamline the creation and management of sound mods for **DCS World**. It provides a comprehensive suite of tools to browse assets, edit SDEF parameters visually, manage custom audio, and package complete mods ready for installation.

![App Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Electron-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Key Features

### 📁 Assets Library
Browse thousands of DCS sound assets with ease. The library features a deep, recursive folder tree navigation, search functionality, and a detailed preview panel for every `.sdef` and `.wav` file.

### 🎛️ Visual SDEF Editor
Forget manual text editing. Tweak internal/external radii, gain, pitch, cones, and play modes (loop vs. one-shot) through a clean, intuitive interface. A real-time Gain-Distance model helps you visualize how the sound will behave in 3D space.

### 📂 Project Management
Organize your mod project in one place. Link your custom `.wav` or `.ogg` files to original DCS sound paths, track missing audio, and preview your changes instantly.

### 💾 Presets & Templates
Save your favorite SDEF configurations as presets and apply them to other assets with a single click. Speed up your workflow by reusing proven distance and volume settings.

### 🤝 GitHub Collaboration
Sync your project with your team. Built-in integration with GitHub allows you to push your full mod build, pull changes from teammates, share notes, and restore any previous version of your project.

### 🚀 One-Click Build
Generate a complete, DCS-ready mod folder structure. The app automatically creates `entry.lua`, organizes the `Sounds` directory, and handles format conversions (WAV/OGG) for you.

---

## 🛠️ Technical Stack

- **Core:** Vanilla JavaScript & HTML5
- **Styling:** Custom CSS with Glassmorphism aesthetics
- **Desktop Wrapper:** Electron
- **Bundler/Dev Server:** Vite
- **Storage:** IndexedDB (via `idb-keyval`) for local persistence
- **Icons:** Lucide-JS

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FreeProject089/Better-ModMaker.git
   cd Better-ModMaker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server (browser-based):
```bash
npm run dev
```

To run the application in the **Electron** desktop environment:
```bash
npm run electron:dev
```

---

## 📦 Building the App

To generate a production-ready Windows installer (`.exe`):

1. **Important:** Ensure the application is closed before building.
2. Run the build script:
   ```bash
   npm run electron:build
   ```
3. The installer will be located in the `release/` directory.

---

## 📖 How to use in DCS

1. **Build** your mod using the app.
2. Copy the generated mod folder to your `Saved Games/DCS/Mods/resource/` directory.
3. Start DCS World — the mod will be automatically mounted via the generated `entry.lua`.

---

## 👨‍💻 Author

Created & Developed by **FreeProject089**.

- **Discord:** [Join the community](https://discord.gg/CTaaEF9R75)
- **GitHub:** [@FreeProject089](https://github.com/FreeProject089)

---

*Made for the DCS World Community with ❤️.*
