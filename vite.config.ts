import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
          i18n: ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
