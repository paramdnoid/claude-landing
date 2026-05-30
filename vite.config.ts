import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [react(), tailwindcss(), imagetools()],
  server: {
    port: 5173,
    host: true,
    fs: { allow: ['..', '../..', '../../..'] },
  },
  build: {
    rollupOptions: {
      output: {
        // Function-based manualChunks so the three chunk only owns three.js +
        // its React-Three adapters. Pre-diet the chunk also absorbed React
        // internals shared with the lazy LiquidGradientMesh import, which made
        // the index chunk look small but forced eager-loading of the three
        // chunk in practice. Splitting React into a dedicated `react-vendor`
        // chunk keeps it eager (entry depends on it) and lets the three chunk
        // stay truly lazy.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/three/') ||
              id.includes('@react-three/fiber') ||
              id.includes('@react-three/postprocessing') ||
              id.includes('/postprocessing/')
            ) {
              return 'three';
            }
            if (id.includes('/gsap/') || id.includes('/lenis/') || id.includes('@gsap/react')) {
              return 'gsap';
            }
            if (
              id.includes('/i18next') ||
              id.includes('react-i18next') ||
              id.includes('i18next-browser-languagedetector')
            ) {
              return 'i18n';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
