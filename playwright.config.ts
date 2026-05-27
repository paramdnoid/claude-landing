import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
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
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
    // Provide a stub analytics URL so the CookieBanner component renders.
    // Tests use page.route() to fulfill the script request without network.
    env: {
      VITE_ANALYTICS_SCRIPT_URL: 'http://localhost:5173/__playwright_noop_analytics.js',
    },
  },
});
