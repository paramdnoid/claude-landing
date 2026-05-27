import { test, expect } from '@playwright/test';

test.describe('Contact form — demo mode', () => {
  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    await page.locator('a[href="#contact"]').first().click();
    await page.locator('#contact form').waitFor({ state: 'visible' });

    await page.getByRole('button', { name: /Nachricht senden/i }).click();

    const alerts = page.locator('[role="alert"]');
    await expect(alerts).toHaveCount(3);
    await expect(page.locator('#contact-name[aria-invalid="true"]')).toBeVisible();
    await expect(page.locator('#contact-email[aria-invalid="true"]')).toBeVisible();
  });

  test('happy path: fills form, submits, shows success state then resets', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    await page.locator('a[href="#contact"]').first().click();
    const form = page.locator('#contact form');
    await form.waitFor({ state: 'visible' });

    await page.fill('#contact-name', 'Ada Lovelace');
    await page.fill('#contact-email', 'ada@example.com');
    await page.fill('#contact-message', 'Hallo, ich würde gerne zusammenarbeiten.');

    await page.getByRole('button', { name: /Nachricht senden/i }).click();

    const success = page.locator('#contact').getByText(/Danke, Ada/);
    await expect(success).toBeVisible({ timeout: 3_000 });

    await page.getByRole('button', { name: /Weitere Nachricht senden/i }).click();

    await expect(form).toBeVisible();
    await expect(page.locator('#contact-name')).toHaveValue('');
  });

  test('EN locale shows English success copy', async ({ page }) => {
    await page.goto('/en');
    await page.waitForURL(/\/en$/);

    await page.locator('a[href="#contact"]').first().click();
    const form = page.locator('#contact form');
    await form.waitFor({ state: 'visible' });

    await page.fill('#contact-name', 'Grace Hopper');
    await page.fill('#contact-email', 'grace@example.com');
    await page.fill('#contact-message', 'Let us build something.');

    await page.getByRole('button', { name: /Send message/i }).click();

    await expect(page.locator('#contact').getByText(/Thanks, Grace/)).toBeVisible({ timeout: 3_000 });
  });
});
