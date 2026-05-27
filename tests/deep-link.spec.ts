import { test, expect } from '@playwright/test';

test('hash deep-link /de#contact scrolls Contact section into view on initial load', async ({ page }) => {
  await page.goto('/de#contact');
  await page.waitForURL(/\/de#contact$/);

  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'), {
    timeout: 15_000,
  });

  await expect(page.locator('#contact')).toBeInViewport({ timeout: 5_000 });
});

test('Contact nav link scrolls #contact section into view', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'), {
    timeout: 15_000,
  });

  await page.locator('nav a[href="#contact"]').first().click();

  await expect(page.locator('#contact')).toBeInViewport({ timeout: 5_000 });
});

test('navigating to /de scrolls to top', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'), {
    timeout: 15_000,
  });

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThan(50);
});
