import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    fs: { allow: ['..', '../..', '../../..'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          gsap: ['gsap', 'gsap/ScrollTrigger', 'lenis', '@gsap/react'],
          i18n: ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
