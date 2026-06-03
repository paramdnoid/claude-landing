import { test, expect } from '@playwright/test';

// Override the project-level storageState so consent is unset and the banner can render.
// Force reduced motion so the Loader takes its instant early-out (animations.ts:125) instead
// of running its ~4.7s full-screen intro (z-110). Otherwise that overlay covers the banner
// (z-80): toBeVisible() passes (the element is rendered), but the button click waits for
// actionability until the intro clears — and when the GSAP ticker is starved on a loaded CI
// runner the click slips past the 30s test timeout. The 600ms banner reveal timer is a plain
// setTimeout and is unaffected by the motion preference, so the banner still appears on cue.
test.use({
  storageState: { cookies: [], origins: [] },
  reducedMotion: 'reduce',
});

const ANALYTICS_URL = '**/__playwright_noop_analytics.js';

test.describe('Cookie banner', () => {
  test.beforeEach(async ({ page }) => {
    // Fulfill the analytics script request so accepting does not 404.
    await page.route(ANALYTICS_URL, (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '/* test stub */',
      });
    });
  });

  test('appears after a short delay on first visit', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const banner = page.getByRole('dialog', { name: /Datenschutz/ });
    await expect(banner).toBeVisible({ timeout: 10_000 });
    await expect(banner.getByRole('button', { name: /Akzeptieren/ })).toBeVisible();
    await expect(banner.getByRole('button', { name: /Ablehnen/ })).toBeVisible();
  });

  test('reject persists to localStorage and banner does not reappear on reload', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const banner = page.getByRole('dialog', { name: /Datenschutz/ });
    await expect(banner).toBeVisible({ timeout: 10_000 });

    await banner.getByRole('button', { name: /Ablehnen/ }).click();
    await expect(banner).toBeHidden();

    const stored = await page.evaluate(() => window.localStorage.getItem('zian.consent.v1'));
    expect(stored).toBe('rejected');

    // Reload to domcontentloaded, NOT the default 'load' event. 'load' blocks on the heavy
    // three.js/WebGL chunk being re-downloaded and re-parsed on reload (confirmed via trace);
    // on a loaded CI runner that second parse pushes the cumulative test past the 30s budget.
    // The banner's 600ms reveal timer starts on mount (after DCL), so DCL + the wait below
    // fully exercises the "does not reappear" assertion without waiting on WebGL.
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Give it longer than the 600ms reveal timer to be sure it does not appear.
    await page.waitForTimeout(1_200);
    await expect(banner).toBeHidden();
  });

  test('accept persists to localStorage and injects the analytics script', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const banner = page.getByRole('dialog', { name: /Datenschutz/ });
    await expect(banner).toBeVisible({ timeout: 10_000 });

    await banner.getByRole('button', { name: /Akzeptieren/ }).click();
    await expect(banner).toBeHidden();

    const stored = await page.evaluate(() => window.localStorage.getItem('zian.consent.v1'));
    expect(stored).toBe('accepted');

    // The analytics module subscribes to consentchange and injects the script tag.
    const script = page.locator('script[data-zian-analytics]');
    await expect(script).toHaveCount(1);
    await expect(script).toHaveAttribute('src', /__playwright_noop_analytics\.js$/);
  });

  test('close (X) button rejects consent', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const banner = page.getByRole('dialog', { name: /Datenschutz/ });
    await expect(banner).toBeVisible({ timeout: 10_000 });

    await banner.getByRole('button', { name: /Banner schließen/ }).click();
    await expect(banner).toBeHidden();

    const stored = await page.evaluate(() => window.localStorage.getItem('zian.consent.v1'));
    expect(stored).toBe('rejected');
  });
});
