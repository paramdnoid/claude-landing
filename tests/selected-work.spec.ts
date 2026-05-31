import { test, expect, type Page } from '@playwright/test';

/**
 * SelectedWork horizontal carousel.
 *
 * The carousel uses a GSAP ScrollTrigger pin: scrolling vertically through
 * the section's spacer drives horizontal slide movement.  The keyboard
 * handler maps ArrowRight/Down/PageDown → lenis.scrollTo(scrollY + step)
 * and ArrowLeft/Up/PageUp → reverse, where step = viewport.clientHeight.
 *
 * Covered here:
 *   - ARIA landmark structure and slide count
 *   - sr-only keyboard-navigation hint for screen-reader users
 *   - ArrowRight advances window.scrollY (forward through slides)
 *   - ArrowLeft decreases window.scrollY (backward through slides)
 *   - No uncaught page errors while navigating by keyboard
 */

function waitForScrollReady(page: Page) {
  // The Loader stops Lenis during its ~4 s intro; this guard waits until
  // the app is scrollable before any scroll-dependent assertion.
  return page.waitForFunction(
    () => !document.documentElement.classList.contains('lenis-stopped'),
    { timeout: 15_000 },
  );
}

test.describe('SelectedWork carousel', () => {
  test('section exposes correct ARIA landmark, tabindex and five slides', async ({ page }) => {
    await page.goto('/en');
    await page.waitForURL(/\/en$/);

    const carousel = page.locator('[role="region"][aria-roledescription="carousel"]');

    // Present in the DOM (may be below the fold — no need to scroll for structural checks).
    await expect(carousel).toBeAttached();

    // tabIndex={0} makes the region keyboard-focusable without being in the
    // natural Tab order of every interactive element.
    await expect(carousel).toHaveAttribute('tabindex', '0');

    // Five case-study slides, each with a positional aria-label "N / 5: title".
    const slides = carousel.locator('[aria-roledescription="slide"]');
    await expect(slides).toHaveCount(5);
    await expect(slides.first()).toHaveAttribute('aria-label', /^1 \/ 5: /);
    await expect(slides.last()).toHaveAttribute('aria-label', /^5 \/ 5: /);
  });

  test('sr-only keyboard-navigation hint is present for screen readers', async ({ page }) => {
    await page.goto('/en');
    await page.waitForURL(/\/en$/);

    // The hint must exist in the DOM so assistive technology can describe how
    // to browse the carousel. It is intentionally hidden from sighted users
    // via Tailwind's sr-only class — we only assert DOM presence here.
    await expect(
      page.getByText('Use the arrow keys to browse cases.'),
    ).toBeAttached();
  });

  test('ArrowRight while the carousel is focused advances window.scrollY', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);
    await waitForScrollReady(page);

    // Navigate to the work section via the header nav link.
    await page.locator('nav a[href="#work"]').first().click();
    const carousel = page.locator('[role="region"][aria-roledescription="carousel"]');

    // Wait until GSAP has pinned the section and it is visible.
    await expect(carousel).toBeInViewport({ timeout: 5_000 });

    await carousel.focus();
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await page.keyboard.press('ArrowRight');

    // Lenis animates at duration:0.6 s; waitForFunction polls without a
    // fixed sleep so the test is as fast as the browser allows.
    await page.waitForFunction(
      (before: number) => window.scrollY > before,
      scrollBefore,
      { timeout: 3_000 },
    );

    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
  });

  test('ArrowLeft reverses scroll after an ArrowRight', async ({ page }) => {
    await page.goto('/de');
    await page.waitForURL(/\/de$/);
    await waitForScrollReady(page);

    await page.locator('nav a[href="#work"]').first().click();
    const carousel = page.locator('[role="region"][aria-roledescription="carousel"]');
    await expect(carousel).toBeInViewport({ timeout: 5_000 });

    await carousel.focus();

    // Advance one slide and wait for Lenis to settle.
    const scrollStart = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      (before: number) => window.scrollY > before,
      scrollStart,
      { timeout: 3_000 },
    );
    const scrollForward = await page.evaluate(() => window.scrollY);

    // Reverse — scroll must decrease back toward the pin start.
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(
      (mid: number) => window.scrollY < mid,
      scrollForward,
      { timeout: 3_000 },
    );

    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(scrollForward);
  });

  test('keyboard navigation produces no uncaught page errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/de');
    await page.waitForURL(/\/de$/);
    await waitForScrollReady(page);

    await page.locator('nav a[href="#work"]').first().click();
    const carousel = page.locator('[role="region"][aria-roledescription="carousel"]');
    await expect(carousel).toBeInViewport({ timeout: 5_000 });

    await carousel.focus();

    // Forward — wait for each scroll to settle before pressing again.
    const s0 = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction((b: number) => window.scrollY > b, s0, { timeout: 3_000 });

    // Backward.
    const s1 = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction((b: number) => window.scrollY < b, s1, { timeout: 3_000 });

    expect(
      pageErrors,
      `Uncaught page errors:\n${pageErrors.map((e) => e.message).join('\n')}`,
    ).toHaveLength(0);
  });
});
