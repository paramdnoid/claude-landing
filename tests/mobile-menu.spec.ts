import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Mobile menu', () => {
  test('toggle button opens the menu and updates aria-expanded', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    const mobileNav = page.locator('#mobile-nav');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).toHaveAttribute('aria-hidden', 'true');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileNav).toHaveAttribute('aria-hidden', 'false');
  });

  test('clicking an in-menu anchor closes the menu and scrolls section into view', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);
    await page.waitForFunction(
      () => !document.documentElement.classList.contains('lenis-stopped'),
      { timeout: 15_000 },
    );

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    const mobileNav = page.locator('#mobile-nav');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await mobileNav.locator('a[href="#contact"]').click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#contact')).toBeInViewport({ timeout: 5_000 });
  });

  test('pressing Escape closes the menu', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    const mobileNav = page.locator('#mobile-nav');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).toHaveAttribute('aria-hidden', 'true');
  });

  test('route change (brand link to legal page) closes the menu', async ({ page }) => {
    await page.goto('/de/impressum');
    await page.waitForURL(/\/de\/impressum$/);

    const toggle = page.locator('button[aria-controls="mobile-nav"]');
    const mobileNav = page.locator('#mobile-nav');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Brand link in header navigates back to /de — pathname effect should close the menu.
    await page.locator('header a[aria-label]').first().click();
    await page.waitForURL(/\/de$/);

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileNav).toHaveAttribute('aria-hidden', 'true');
  });
});
