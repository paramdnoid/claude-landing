import { defineConfig, devices } from '@playwright/test';

// Default to 5173; override with PLAYWRIGHT_PORT when the default port is occupied
// (e.g. a long-running `npm run dev` session in another terminal).
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
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
    command: `npm run dev -- --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
    // Provide a stub analytics URL so the CookieBanner component renders.
    // Tests use page.route() to fulfill the script request without network.
    env: {
      VITE_ANALYTICS_SCRIPT_URL: `${BASE_URL}/__playwright_noop_analytics.js`,
    },
  },
});
