import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  build: {
    rollupOptions: {
      // Multi-page site: each HTML file is its own entry.
      input: {
        main: resolve(root, 'index.html'),
        musica: resolve(root, 'musica.html'),
        media: resolve(root, 'media.html'),
        historia: resolve(root, 'historia.html'),
      },
      output: {
        // Ship three.js separately so the other pages never download it.
        manualChunks: { three: ['three'], motion: ['gsap', 'lenis'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
