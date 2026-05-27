import { test, expect } from '@playwright/test';

test('LangToggle on /de/impressum switches to /en/impressum', async ({ page }) => {
  await page.goto('/de/impressum');
  await page.waitForURL(/\/de\/impressum$/);

  await page.getByRole('button', { name: 'en', exact: true }).click();

  await page.waitForURL(/\/en\/impressum$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('LangToggle on /de/datenschutz switches to /en/datenschutz', async ({ page }) => {
  await page.goto('/de/datenschutz');
  await page.waitForURL(/\/de\/datenschutz$/);

  await page.getByRole('button', { name: 'en', exact: true }).click();

  await page.waitForURL(/\/en\/datenschutz$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('LangToggle on legal page then back to home preserves locale', async ({ page }) => {
  await page.goto('/de/impressum');
  await page.waitForURL(/\/de\/impressum$/);

  await page.getByRole('button', { name: 'en', exact: true }).click();
  await page.waitForURL(/\/en\/impressum$/);

  await page.getByRole('link', { name: /home|start/i }).first().click();
  await page.waitForURL(/\/en$/);

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#hero h1')).toContainText('Designing intelligence.');
});
