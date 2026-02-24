import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: './',   // Required for Electron (relative asset paths in built HTML)
    publicDir: 'public',
    assetsInclude: ['**/*.md', 'LICENSE', 'src/Load.cfg', 'Update/**'],
    server: {
        port: 5173,
        open: true
    },
    build: {
        outDir: 'dist'
    }
});
