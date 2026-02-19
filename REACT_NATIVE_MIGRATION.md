# Better Sound.Maker → React Native Migration Guide

> **Purpose**: This document explains how to adapt the existing Better Sound.Maker Vite/Electron web app to a cross-platform React Native application (iOS, Android, Desktop via Electron/Tauri, Browser via React Native Web).

---

## 1. Technology Stack

| Layer | Current (web) | React Native target |
|---|---|---|
| UI Framework | Vanilla JS + Vite | React Native + Expo |
| Desktop | Electron | Expo + `electron` or Tauri |
| Browser | Vite dev server | React Native Web |
| Styling | CSS variables | StyleSheet / NativeWind |
| Routing | Custom `navigate()` | React Navigation |
| State | Custom `store.js` | Zustand or React Context |
| i18n | i18next | i18next + react-i18next |
| File access | `showDirectoryPicker` / Electron API | `expo-file-system` / Electron API |

---

## 2. Project Setup

```bash
# Create Expo project
npx create-expo-app better-sound-maker --template blank-typescript

# Install core dependencies
npx expo install expo-file-system expo-document-picker expo-av
npm install @react-navigation/native @react-navigation/drawer zustand i18next react-i18next
npm install nativewind  # TailwindCSS for React Native (optional)

# For web support
npm install react-native-web @expo/webpack-config
```

---

## 3. Architecture Overview

```
src/
  components/
    SidebarNav.tsx        ← Port of nav.js
    Toast.tsx             ← Port of toast.js
    Modal.tsx             ← Port of modal.js
  screens/
    LibraryScreen.tsx     ← Port of library.js
    ProjectScreen.tsx     ← Port of project.js
    SdefEditorScreen.tsx  ← Port of sdef-editor.js
    ThemeScreen.tsx       ← Port of theme.js
    PresetsScreen.tsx     ← Port of presets.js
    CollaborationScreen.tsx ← Port of collaboration.js
    BuildScreen.tsx       ← Port of build.js
    DocsScreen.tsx        ← Port of docs.js
    CreditsScreen.tsx     ← Port of credits.js
  state/
    store.ts              ← Port of store.js using Zustand
  utils/
    sdef-generator.ts     ← Direct port (pure JS → TypeScript)
    audio-analyzer.ts     ← Direct port
    github-api.ts         ← Direct port
    entry-generator.ts    ← Direct port
    i18n.ts               ← Uses react-i18next
  locales/
    en.json               ← Same files
    fr.json               ← Same files
  App.tsx                 ← Entry, navigation setup
```

---

## 4. Page-by-Page Porting

### 4.1 Navigation (nav.js → SidebarNav.tsx)

**Current**: Custom DOM manipulation, `data-page` click handlers.

**React Native**: Use `@react-navigation/drawer` for a slide-in sidebar.

```tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
const Drawer = createDrawerNavigator();

export function AppNavigator() {
  return (
    <Drawer.Navigator drawerContent={props => <SidebarNav {...props} />}>
      <Drawer.Screen name="library" component={LibraryScreen} />
      {/* ... all screens */}
    </Drawer.Navigator>
  );
}
```

The language selector and Discord link port directly as React Native `Pressable` components.

---

### 4.2 State (store.js → store.ts)

**Current**: Manual pub/sub with `subscribe()` + `setState()`.

**React Native**: Zustand is nearly a drop-in replacement:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(persist((set, get) => ({
  currentPage: 'library',
  selectedAssets: {},
  projectConfig: { ... },
  navigate: (page) => set({ currentPage: page }),
  // ... all other actions
}), {
  name: 'bsm-store',
  storage: createJSONStorage(() => AsyncStorage),
}));
```

---

### 4.3 File Picker (file-picker.js → expo-document-picker)

**Current**: `showDirectoryPicker()` / `showOpenFilePicker()` Web APIs + Electron `dialog.showOpenDialog`.

**React Native**: Use `expo-document-picker`:

```ts
import * as DocumentPicker from 'expo-document-picker';

async function pickSdefFolder() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*', multiple: true
  });
  if (!result.canceled) {
    // result.assets = [{ uri, name, size, mimeType }]
  }
}
```

For **Electron** desktop, keep the existing `window.electronAPI.readFile()` bridge.

> [!IMPORTANT]
> On iOS, full directory access is restricted. Use `expo-file-system` + the Files app "Open in" mechanism, or target Electron/Tauri for desktop-first.

---

### 4.4 SDEF Editor (sdef-editor.js → SdefEditorScreen.tsx)

The parameter groups map directly to React Native `ScrollView` + `View` components:

```tsx
<ScrollView>
  {SDEF_PARAMS.map(param => (
    <ParamRow key={param.key} param={param}
      value={currentParams[param.key]}
      onChange={val => handleChange(param.key, val)}
    />
  ))}
</ScrollView>
```

`TextInput` replaces `<input>`, `Switch` replaces the toggle, `Picker` replaces `<select>`.

---

### 4.5 Audio Playback (expo-av)

The current web app uses `new Audio()`. In React Native:

```ts
import { Audio } from 'expo-av';

const sound = new Audio.Sound();
await sound.loadAsync({ uri: fileUri });
await sound.playAsync();
```

---

### 4.6 Collaboration (github-api.ts)

The GitHub API calls use `fetch()` which works identically in React Native. No changes needed to the logic.

---

### 4.7 Onboarding Tutorial

Port to a React Native `Modal` with an animated `Animated.View` for the mascot + speech bubble.

```tsx
<Modal visible={showOnboarding} transparent animationType="fade">
  <View style={styles.overlay}>
    <MascotCharacter />
    <StepBubble step={STEPS[currentStep]} onNext={...} onSkip={...} />
  </View>
</Modal>
```

Persist seen state with `AsyncStorage.setItem('bsm-onboarding-done', 'true')`.

---

## 5. Platform-Specific Code

Use the `.native.ts` / `.web.ts` / `.electron.ts` file extension pattern:

```
utils/file-picker.web.ts      ← showDirectoryPicker / showOpenFilePicker
utils/file-picker.native.ts   ← expo-document-picker
utils/file-picker.electron.ts ← window.electronAPI.showOpenDialog
```

Expo picks up the right file automatically per platform.

---

## 6. i18n

`i18next` + `react-i18next` works identically:

```tsx
const { t } = useTranslation();
<Text>{t('nav.library')}</Text>
```

Use `AsyncStorage` backend instead of HTTP backend for locale files (or bundle them as JSON imports).

---

## 7. Desktop Support (Electron or Tauri)

- **Electron**: Keep existing `electron/main.js`. Add `@electron/remote` for window controls.
- **Tauri**: Use Tauri commands (`invoke`) to replace `window.electronAPI.*`.
- Both work with React Native Web as the renderer.

---

## 8. Migration Checklist

- [ ] Init Expo project with TypeScript template
- [ ] Port `store.js` → Zustand `store.ts`
- [ ] Set up React Navigation with Drawer
- [ ] Port pure utils (sdef-generator, entry-generator, github-api) — TypeScript only
- [ ] Port each page to a Screen component
- [ ] Implement platform file-picker strategy
- [ ] Integrate `expo-av` for audio playback
- [ ] Port onboarding to RN Modal
- [ ] Test on iOS Simulator / Android Emulator / Web
- [ ] Package Electron build with `electron-builder`
