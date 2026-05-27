import { test, expect } from '@playwright/test';

// Override the project-level storageState so consent is unset and the banner can render.
test.use({ storageState: { cookies: [], origins: [] } });

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

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
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
