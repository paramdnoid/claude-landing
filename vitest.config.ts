import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/i18n.ts', 'src/lib/gsap.ts', 'src/lib/smoothScroll.ts', 'src/lib/useMagnet.ts'],
    },
    restoreMocks: true,
  },
});
