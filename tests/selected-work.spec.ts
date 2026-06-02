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

/**
 * Resolve only once window.scrollY has come to a *true* rest, and return that
 * settled value.
 *
 * Why this is needed: pressing an arrow key fires `lenis.scrollTo(..., { duration:
 * 0.6 })`, and the pinned ScrollTrigger then applies a `snap` (0.4 s power2.inOut)
 * that re-pulls scrollY toward the nearest slide boundary *after* the Lenis tween.
 * A naive `waitForFunction(scrollY > before)` resolves on the first frame scrollY
 * ticks past `before` — a transient mid-tween value, captured while both the 0.6 s
 * Lenis tween and the 0.4 s snap are still moving the page. Comparing two such
 * transients races the still-settling animations and flakes.
 *
 * The trap that makes naive "settled" detection wrong here is the **gap between
 * the two animation phases**. Empirically (Chromium, this layout) the 0.6 s Lenis
 * tween finishes, then scrollY sits *completely unchanged for ~380-400 ms* before
 * the snap tween fires and moves the page the rest of the way to the slide
 * boundary. During that gap Lenis has already dropped its `lenis-scrolling`
 * class, so any detector based on "class absent + a handful of identical frames"
 * resolves at the mid-sequence transient — exactly the original flake.
 *
 * So settle is detected purely from scrollY itself: it must stay byte-identical
 * for a continuous wall-clock window of `idleMs`, chosen comfortably longer than
 * that ~400 ms inter-phase gap so the still-pending snap re-arms the window
 * instead of being mistaken for rest. `lenis-scrolling` is intentionally NOT
 * consulted — it is unreliable across the gap.
 *
 * `expectMoveFrom` makes the wait *honest*: when the caller knows a press should
 * have moved the page, the resting value must differ from that baseline before it
 * counts as settled. This closes the trap where the helper could resolve at the
 * pre-press position (e.g. the tween hadn't engaged yet, or a regressed ArrowLeft
 * handler never moved at all) — such a case now times out and fails the test
 * rather than silently passing on a stale value.
 */
async function waitForScrollIdle(
  page: Page,
  opts: { idleMs?: number; timeout?: number; expectMoveFrom?: number; allowZero?: boolean } = {},
): Promise<number> {
  // The Lenis-tween-end → snap-start gap was measured at ~390-410 ms typical with
  // a ~475 ms cold-start outlier (Chromium, this layout). idleMs must comfortably
  // exceed that worst case so the still-pending snap re-arms the idle window rather
  // than being mistaken for rest; 700 ms gives ~225 ms margin over the outlier for
  // slower/jitterier CI without materially slowing the suite (the window only runs
  // after the *final* resting frame, adding ~150 ms over the prior 550 ms default).
  const idleMs = opts.idleMs ?? 700;
  const timeout = opts.timeout ?? 9_000;
  const expectMoveFrom = opts.expectMoveFrom ?? null;
  const allowZero = opts.allowZero ?? false;

  return page.evaluate(
    ({ idleMs, timeout, expectMoveFrom, allowZero }) =>
      new Promise<number>((resolve, reject) => {
        const startedAt = performance.now();
        let lastY = window.scrollY;
        let unchangedSince = startedAt;
        // When a baseline is given, the page must demonstrably leave it before any
        // resting value is accepted; without one, no movement is required.
        let hasMovedFromBaseline = expectMoveFrom === null;

        const poll = () => {
          const now = performance.now();
          const y = window.scrollY;

          // Any change to scrollY restarts the idle window — including the snap
          // re-pull that fires after the inter-phase gap.
          if (y !== lastY) {
            lastY = y;
            unchangedSince = now;
          }
          if (expectMoveFrom !== null && y !== expectMoveFrom) {
            hasMovedFromBaseline = true;
          }

          const idleLongEnough = now - unchangedSince >= idleMs;
          const nonZeroOk = allowZero || y !== 0;
          const settled = idleLongEnough && hasMovedFromBaseline && nonZeroOk;

          if (settled) {
            resolve(y);
            return;
          }
          if (now - startedAt >= timeout) {
            reject(
              new Error(
                `waitForScrollIdle timed out after ${timeout}ms (scrollY=${y}, ` +
                  `idleFor=${Math.round(now - unchangedSince)}ms, ` +
                  `hasMovedFromBaseline=${hasMovedFromBaseline})`,
              ),
            );
            return;
          }
          requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      }),
    { idleMs, timeout, expectMoveFrom, allowZero },
  );
}

const CAROUSEL = '[role="region"][aria-roledescription="carousel"]';

/**
 * Focus the carousel region, assert focus actually landed, then press an arrow.
 *
 * Why focus must be re-asserted on *every* press: the section is pinned via GSAP
 * `ScrollTrigger` (`pin: true`), which wraps the region in a pin-spacer and
 * re-parents the region node in the DOM on each `ScrollTrigger.refresh()`.
 * `SelectedWork` triggers refreshes asynchronously — once from
 * `document.fonts.ready` and once from the in-section image-decode `Promise.all`
 * — and DOM re-parenting *blurs the focused element*. Empirically, when one of
 * those one-shot refreshes lands in the gap between a `focus()` call and an arrow
 * press, `document.activeElement` has fallen back to `<body>`; the keydown then
 * never reaches `onCarouselKeyDown`, `lenis.scrollTo` is never called, and the
 * press silently no-ops. Whether a refresh lands in that gap is pure timing,
 * which is exactly the carousel's ~75 % flake.
 *
 * The post-focus assertion keeps the test honest: this helper only papers over
 * *environmental* focus theft, never a real handler regression. If the keydown
 * is dispatched at a genuinely focused carousel and the handler still fails to
 * move the page, the caller's `waitForScrollIdle({ expectMoveFrom })` times out
 * and the test fails — the behaviour under test is still truly asserted.
 */
async function pressArrowOnCarousel(
  page: Page,
  key: 'ArrowLeft' | 'ArrowRight',
): Promise<void> {
  const carousel = page.locator(CAROUSEL);
  await carousel.focus();
  // Confirm focus landed on the region (not <body>) at the instant of the press.
  await expect(carousel).toBeFocused();
  await page.keyboard.press(key);
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

    // Baseline: the carousel is pinned at the section top, so scrollY is already
    // > 0 here. Settle first so the starting point is a real resting position.
    const scrollStart = await waitForScrollIdle(page);

    // Advance one slide. `pressArrowOnCarousel` re-asserts focus on the region
    // immediately before the keypress: GSAP's `pin` re-parents the carousel node
    // on every `ScrollTrigger.refresh()` (fired async from `document.fonts.ready`
    // and the in-section image-decode `Promise.all`), and DOM re-parenting blurs
    // the focused element — so a press that lands after such a refresh would
    // otherwise hit <body>, never reach `onCarouselKeyDown`, and silently no-op.
    // That focus theft — not a mis-captured transient — is the dominant flake.
    //
    // We then capture the SETTLED forward position, after the 0.6 s Lenis tween
    // *and* the 0.4 s snap re-pull have both come to rest, not the transient first
    // frame where scrollY merely ticks above the baseline. `expectMoveFrom` forbids
    // resolving back at the baseline, so a press that never engaged the tween can
    // never be mistaken for "settled forward".
    await pressArrowOnCarousel(page, 'ArrowRight');
    const scrollForward = await waitForScrollIdle(page, { expectMoveFrom: scrollStart });
    expect(scrollForward).toBeGreaterThan(scrollStart);

    // Reverse, then compare SETTLED resting positions. Focus is re-asserted again
    // for the same reason. `expectMoveFrom` requires scrollY to differ from the
    // settled-forward value before it counts as at rest, so a genuinely regressed
    // ArrowLeft *handler* (one that is reached but fails to move the page) makes
    // this wait time out and the test fail instead of silently passing. A working
    // handler moves back toward the pin start, so the strict comparison below still
    // verifies real backward travel.
    await pressArrowOnCarousel(page, 'ArrowLeft');
    const scrollBack = await waitForScrollIdle(page, { expectMoveFrom: scrollForward });

    expect(scrollBack).toBeLessThan(scrollForward);
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

    // Forward, then fully settle (Lenis 0.6 s + snap 0.4 s) before reversing, so
    // ArrowLeft is not pressed mid-animation. `pressArrowOnCarousel` re-asserts
    // focus on the region right before each press, because GSAP's pin re-parents
    // the carousel node on every `ScrollTrigger.refresh()` and that blurs it — a
    // press landing on <body> would silently no-op (and, mid-animation, was what
    // surfaced sporadic uncaught errors and made this spec flaky).
    const start = await waitForScrollIdle(page);
    await pressArrowOnCarousel(page, 'ArrowRight');
    const forward = await waitForScrollIdle(page, { expectMoveFrom: start });

    // Backward, and settle again so any error thrown during the reverse tween +
    // snap has a chance to surface before we assert.
    await pressArrowOnCarousel(page, 'ArrowLeft');
    await waitForScrollIdle(page, { expectMoveFrom: forward });

    expect(
      pageErrors,
      `Uncaught page errors:\n${pageErrors.map((e) => e.message).join('\n')}`,
    ).toHaveLength(0);
  });
});
