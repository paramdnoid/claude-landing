import { test, expect } from '@playwright/test';

test('root redirects to a supported locale and renders the hero', async ({ page }) => {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForURL(/\/(de|en)$/);

  await expect(page.locator('#hero h1')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', /^(de|en)$/);

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);

  expect(
    consoleErrors,
    `Console errors: ${consoleErrors.join('\n')}`,
  ).toHaveLength(0);
});

test('legal pages render under both locales without runtime errors', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  for (const path of ['/de/impressum', '/en/impressum', '/de/datenschutz', '/en/datenschutz']) {
    await page.goto(path);
    await expect(page.locator('main, h1').first()).toBeVisible();
  }

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);
});
