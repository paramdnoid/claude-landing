import { test, expect } from '@playwright/test';

test.describe('Connect form — demo mode (inline conversational form)', () => {
  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    await page.locator('a[href="#contact"]').first().click();
    // Open the inline form via the "Spuren hinterlassen" pill
    await page.getByRole('button', { name: /Spuren hinterlassen/i }).click();
    await page.locator('#contact form').waitFor({ state: 'visible' });

    await page.getByRole('button', { name: /Übertragung senden/i }).click();

    // Name is optional now → only email + message can fail.
    await expect(page.locator('#connect-email[aria-invalid="true"]')).toBeVisible();
    await expect(page.locator('#connect-message[aria-invalid="true"]')).toBeVisible();
  });

  test('happy path: fills form, submits, shows success state then resets', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    await page.locator('a[href="#contact"]').first().click();
    await page.getByRole('button', { name: /Spuren hinterlassen/i }).click();
    const form = page.locator('#contact form');
    await form.waitFor({ state: 'visible' });

    await page.fill('#connect-name', 'Ada Lovelace');
    await page.fill('#connect-email', 'ada@example.com');
    await page.fill('#connect-message', 'Hallo, ich würde gerne zusammenarbeiten.');

    await page.getByRole('button', { name: /Übertragung senden/i }).click();

    const success = page.locator('#contact').getByText(/Danke, Ada/);
    await expect(success).toBeVisible({ timeout: 3_000 });

    await page.getByRole('button', { name: /Weitere Nachricht senden/i }).click();

    // After reset the form is closed again — reopen via the pill.
    await page.getByRole('button', { name: /Spuren hinterlassen/i }).click();
    await expect(form).toBeVisible();
    await expect(page.locator('#connect-email')).toHaveValue('');
  });

  test('EN locale shows English success copy', async ({ page }) => {
    await page.goto('/en');
    await page.waitForURL(/\/en$/);

    await page.locator('a[href="#contact"]').first().click();
    await page.getByRole('button', { name: /Leave a trace/i }).click();
    const form = page.locator('#contact form');
    await form.waitFor({ state: 'visible' });

    await page.fill('#connect-name', 'Grace Hopper');
    await page.fill('#connect-email', 'grace@example.com');
    await page.fill('#connect-message', 'Let us build something.');

    await page.getByRole('button', { name: /send transmission/i }).click();

    await expect(page.locator('#contact').getByText(/Thanks, Grace/)).toBeVisible({ timeout: 3_000 });
  });
});
