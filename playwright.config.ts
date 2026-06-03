import { defineConfig, devices } from '@playwright/test';

// Default to the npm E2E port; override with PLAYWRIGHT_PORT when needed.
// This avoids colliding with the regular Vite dev server on 5173.
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5180);
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Run serially. The Loader runs a ~4s GSAP intro and the CookieBanner has a 600ms
  // reveal timer; both depend on the gsap.ticker / setTimeout queue, which gets
  // starved under parallel chromium workers and slips past the specs' 3s / 15s
  // waits. Suite is small enough (~70s serial) that single-worker is the cheaper
  // fix versus per-spec timeout bumps.
  workers: 1,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Default: pre-seed consent so the cookie banner does not appear in unrelated specs.
    // cookie-banner.spec.ts overrides this with an empty storageState via test.use().
    // NOTE: if you write a "fresh visitor" spec, add the same override locally — otherwise
    // the pre-seeded localStorage will silently suppress the banner.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: 'zian.consent.v1', value: 'rejected' }],
        },
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Run against a production build served by `vite preview`, NOT the dev server.
    // The dev server compiles the heavy three.js/WebGL chunks on-demand on first
    // request, so a spec that does two full loads (e.g. cookie-banner's reload)
    // could brush the 30s test timeout on a cold/loaded CI runner — the source of
    // the suite's recurring first-load flakes. Pre-built static assets load fast
    // and consistently. `appType: 'spa'` (Vite default) keeps the index.html
    // fallback, so deep links like /de/datenschutz still resolve.
    command: `npm run build && npm run preview -- --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    // Generous: the timeout must cover the full production build + preview start
    // (slower on CI), not just server boot.
    timeout: 240_000,
    // VITE_* vars are inlined at BUILD time, so this must be present for `vite build`
    // above — Playwright passes it to the whole command's environment. Provides a stub
    // analytics URL so the CookieBanner renders; specs page.route() the script request.
    env: {
      VITE_ANALYTICS_SCRIPT_URL: `${BASE_URL}/__playwright_noop_analytics.js`,
    },
  },
});
