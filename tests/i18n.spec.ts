import { test, expect } from '@playwright/test';

// Force reduced motion BEFORE navigating so the Loader resolves immediately (no ~4.7s intro
// overlay covering the header) and the Hero renders static text without fetching the heavy
// three.js/WebGL chunk — otherwise the LangToggle click and headline assertions race that
// work and flake on a loaded CI runner. `emulateMedia` is deliberate: `reducedMotion` via
// `test.use()` did NOT actually emulate the feature here (verified via trace).
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const DE_HEADLINE = 'Intelligenz gestalten.';
const EN_HEADLINE = 'Designing intelligence.';

test('LangToggle switches locale, updates URL, html.lang and localStorage', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#hero h1')).toContainText(DE_HEADLINE);

  await page.getByRole('button', { name: 'en', exact: true }).click();

  await page.waitForURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#hero h1')).toContainText(EN_HEADLINE);

  const storedLang = await page.evaluate(() => window.localStorage.getItem('zian.lang'));
  expect(storedLang).toBe('en');
});

test('locale from URL is preserved across reload', async ({ page }) => {
  await page.goto('/en');
  await page.waitForURL(/\/en$/);
  await expect(page.locator('#hero h1')).toContainText(EN_HEADLINE);

  // domcontentloaded, not the default 'load' — see cookie-banner.spec.ts: waiting for the
  // WebGL chunk's load event on reload is wasted here (the locale assertions don't need it)
  // and can flake on a loaded CI runner.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#hero h1')).toContainText(EN_HEADLINE);
});

test('unknown locale segment falls back to default locale', async ({ page }) => {
  await page.goto('/fr');
  await page.waitForURL(/\/(de|en)$/);
  await expect(page.locator('#hero h1')).toBeVisible();
});
