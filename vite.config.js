import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',   // Relative asset paths so the built HTML loads from the Tauri bundle
    publicDir: 'public',
    assetsInclude: ['**/*.md', 'LICENSE', 'src/Load.cfg', 'Update/**'],
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,   // Tauri's devUrl expects this exact port
        open: !process.env.TAURI_ENV_PLATFORM
    },
    envPrefix: ['VITE_', 'TAURI_ENV_'],
    build: {
        outDir: 'dist',
        target: process.env.TAURI_ENV_PLATFORM ? 'chrome105' : 'modules'
    }
});
