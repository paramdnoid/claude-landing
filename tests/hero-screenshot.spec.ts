import { test } from '@playwright/test';
import path from 'path';
import os from 'os';

test('hero 3d screenshot', async ({ page }) => {
  await page.goto('/de');
  // wait for WebGL + GSAP entrance to settle
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(os.tmpdir(), 'hero-3d.png'), fullPage: false });
});
