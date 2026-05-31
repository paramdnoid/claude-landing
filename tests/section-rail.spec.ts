import { test, expect, type Page } from '@playwright/test';

// The rail is lg-only (hidden ... lg:flex, i.e. >=1024px). Desktop Chrome's
// default 1280px viewport already satisfies that, but pin it so the spec is
// robust to future config changes.
test.use({ viewport: { width: 1280, height: 800 } });

function waitForScrollReady(page: Page) {
  return page.waitForFunction(
    () => !document.documentElement.classList.contains('lenis-stopped'),
    { timeout: 15_000 },
  );
}

test('rail renders one tick per shared section id', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  const rail = page.getByTestId('section-rail');
  await expect(rail).toBeVisible();
  // manifesto, work, capabilities, process, contact
  await expect(rail.locator('[data-rail-tick]')).toHaveCount(5);
});

test('rail lights the tick for the section scrolled into view', async ({ page }) => {
  const railWarnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.text().includes('[SectionRail]')) railWarnings.push(msg.text());
  });

  await page.goto('/de');
  await page.waitForURL(/\/de$/);
  await waitForScrollReady(page);

  // Navigate via the real nav links and assert the matching rail tick activates.
  // Covers ids resolved directly (#contact) and indirectly via StickyStoryList
  // (#capabilities) -- the exact case the shared SECTION_IDS list guards against.
  for (const id of ['capabilities', 'contact'] as const) {
    await page.locator(`nav a[href="#${id}"]`).first().click();
    await expect(page.locator(`#${id}`)).toBeInViewport({ timeout: 5_000 });
    await expect(page.locator(`[data-rail-tick="${id}"]`)).toHaveAttribute(
      'data-active',
      'true',
      { timeout: 5_000 },
    );
  }

  // No section id should be missing -- the DEV warning must never fire.
  expect(
    railWarnings,
    `Unexpected SectionRail warnings:\n${railWarnings.join('\n')}`,
  ).toHaveLength(0);
});
