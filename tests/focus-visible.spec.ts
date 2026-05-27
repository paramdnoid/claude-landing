import { test, expect, type Page } from '@playwright/test';

// Press Tab once before evaluating to put Chromium into keyboard input modality,
// so subsequent programmatic focus matches :focus-visible (the heuristic we want
// to assert against — purely script-driven focus is not keyboard-equivalent).
async function hasVisibleFocusIndicator(page: Page, selector: string): Promise<boolean> {
  await page.keyboard.press('Tab');
  return await page.locator(selector).first().evaluate((el) => {
    (el as HTMLElement).focus();
    const cs = window.getComputedStyle(el);
    const outlineWidth = parseFloat(cs.outlineWidth || '0');
    const hasOutline = cs.outlineStyle !== 'none' && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && outlineWidth > 0;
    const hasShadow = cs.boxShadow !== 'none' && cs.boxShadow !== '';
    return hasOutline || hasShadow;
  });
}

test('header nav anchor has a visible focus indicator', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('lenis-stopped'),
    { timeout: 15_000 },
  );

  expect(await hasVisibleFocusIndicator(page, 'nav a[href="#contact"]')).toBe(true);
});

test('LangToggle button has a visible focus indicator', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  expect(await hasVisibleFocusIndicator(page, 'button[aria-pressed]')).toBe(true);
});

test('Contact form inputs have a visible focus indicator', async ({ page }) => {
  await page.goto('/de');
  await page.locator('nav a[href="#contact"]').first().click();
  await page.locator('#contact form').waitFor({ state: 'visible' });

  expect(await hasVisibleFocusIndicator(page, '#contact-name')).toBe(true);
  expect(await hasVisibleFocusIndicator(page, '#contact-email')).toBe(true);
  expect(await hasVisibleFocusIndicator(page, '#contact-message')).toBe(true);
});

test('AiDemo chat input has a visible focus indicator', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);
  await page.waitForFunction(
    () => !document.documentElement.classList.contains('lenis-stopped'),
    { timeout: 15_000 },
  );

  const input = page.locator('#ai-demo input[type="text"]').first();
  await input.scrollIntoViewIfNeeded();
  await page.keyboard.press('Tab');
  expect(
    await input.evaluate((el) => {
      (el as HTMLElement).focus();
      const cs = window.getComputedStyle(el);
      const outlineWidth = parseFloat(cs.outlineWidth || '0');
      const hasOutline = cs.outlineStyle !== 'none' && cs.outlineColor !== 'rgba(0, 0, 0, 0)' && outlineWidth > 0;
      const hasShadow = cs.boxShadow !== 'none' && cs.boxShadow !== '';
      return hasOutline || hasShadow;
    }),
  ).toBe(true);
});

test('first Tab from page load focuses the skip link', async ({ page }) => {
  await page.goto('/de');
  await page.waitForURL(/\/de$/);

  await page.keyboard.press('Tab');

  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    return { tag: el.tagName, className: el.className, href: (el as HTMLAnchorElement).href ?? null };
  });

  expect(focused?.className).toContain('skip-link');
});
