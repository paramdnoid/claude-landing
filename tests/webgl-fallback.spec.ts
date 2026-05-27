import { test, expect } from '@playwright/test';

test.use({
  launchOptions: { args: ['--disable-webgl', '--disable-webgl2'] },
});

test('Hero renders static gradient fallback when WebGL is unavailable', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForURL(/\/(de|en)$/);

  const hero = page.locator('#hero');
  await expect(hero).toBeVisible();

  const fallback = hero.locator('[data-testid="webgl-fallback"]');
  await expect(fallback).toBeVisible();

  await expect(hero.locator('canvas')).toHaveCount(0);

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);
});
