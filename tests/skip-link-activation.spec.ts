import { test, expect } from '@playwright/test';

/**
 * Skip-link contract.
 *
 * focus-visible.spec.ts already proves that the first Tab from any page
 * lands focus on the .skip-link element.  These tests cover the two
 * behaviours that spec leaves open:
 *
 *   1. The link must slide into the viewport when it receives keyboard
 *      focus (CSS transform: translateY(-150%) → translateY(0)).
 *   2. Activating the link must move focus to the <main id="main"> landmark
 *      so keyboard and screen-reader users can bypass the header entirely.
 */
test.describe('Skip link', () => {
  test('slides into view when focused by keyboard', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    // Pressing Tab puts Chromium into keyboard-input modality so the
    // :focus-visible rule fires and applies transform: translateY(0).
    await page.keyboard.press('Tab');

    // The CSS transition takes 200 ms; toBeInViewport polls up to the
    // deadline so it always catches the element after it slides in.
    await expect(page.locator('a.skip-link')).toBeInViewport({ timeout: 1_000 });
  });

  test('activating the skip link moves focus to the <main> landmark', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);

    // Tab → skip link receives :focus-visible.
    // Enter → browser follows href="#main" and programmatically focuses the
    // element.  <main id="main" tabIndex={-1}> has tabIndex so the browser
    // sets focus there on hash navigation (spec behaviour, not JS).
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? { id: el.id, tag: el.tagName.toLowerCase() } : null;
    });

    expect(focused?.id, 'activeElement must be #main').toBe('main');
    expect(focused?.tag, 'activeElement must be a <main> element').toBe('main');
  });
});
