import { test, expect } from '@playwright/test';

test('loader traces the signet hexagon outline, then hands off to the app', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');

  // The self-drawing signet outline is present while the loader is on screen.
  const outline = page.getByTestId('loader-signet-outline');
  await expect(outline).toBeAttached();

  // It is dash-driven (stroke-dasharray set from the measured contour length),
  // which is what makes the line trace itself rather than appear all at once.
  const dashArray = await outline.evaluate((el) => el.style.strokeDasharray);
  expect(dashArray, 'outline should be dash-animated').not.toBe('');

  // The loader finishes and unmounts, revealing the app without runtime errors.
  await expect(outline).toHaveCount(0, { timeout: 12_000 });
  await expect(page.locator('#hero h1')).toBeVisible();

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);
});

test('under reduced motion the loader resolves immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/');
  await page.waitForURL(/\/(de|en)$/);

  // No lingering loading overlay; the app is interactive right away.
  await expect(page.locator('[role="status"][aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('#hero h1')).toBeVisible();

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.map((e) => e.message).join('\n')}`,
  ).toHaveLength(0);
});
