import { test, expect } from '@playwright/test';

// Force reduced motion so the Loader resolves immediately instead of covering the header and
// hero with its ~4.7s intro overlay (z-110). Otherwise the LangToggle click and the hero
// headline assertions race that GSAP timeline and flake under a loaded CI runner. Under
// reduced motion the hero renders its static text at full opacity (see reduced-motion.spec.ts).
test.use({ reducedMotion: 'reduce' });

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

  await page.reload();
  await page.waitForURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#hero h1')).toContainText(EN_HEADLINE);
});

test('unknown locale segment falls back to default locale', async ({ page }) => {
  await page.goto('/fr');
  await page.waitForURL(/\/(de|en)$/);
  await expect(page.locator('#hero h1')).toBeVisible();
});
