import { test, expect } from '@playwright/test';

test('Hero uses static fallback and skips intro animation under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForURL(/\/(de|en)$/);

  const matches = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(matches, 'prefers-reduced-motion emulation must be active').toBe(true);

  const hero = page.locator('#hero');
  await expect(hero).toBeVisible();

  await expect(hero.locator('[data-testid="webgl-fallback"]')).toBeVisible();
  await expect(hero.locator('canvas')).toHaveCount(0);

  const headline = hero.locator('h1');
  await expect(headline).toBeVisible();

  const headlineOpacity = await headline.evaluate(
    (el) => Number(window.getComputedStyle(el).opacity),
  );
  expect(headlineOpacity).toBe(1);

  const charOpacities = await hero
    .locator('h1 .char')
    .evaluateAll((els) => els.map((el) => Number(window.getComputedStyle(el).opacity)));
  if (charOpacities.length > 0) {
    expect(charOpacities.every((o) => o === 1)).toBe(true);
  }

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);
});
