import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Ship three.js separately so the main bundle stays small and caches well.
        manualChunks: { three: ['three'], motion: ['gsap', 'lenis'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
