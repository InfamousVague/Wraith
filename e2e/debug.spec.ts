import { test, expect } from '@playwright/test';

test('debug asset detail page', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Go to the main page first
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);

  // Take screenshot of main page
  await page.screenshot({ path: 'e2e/screenshots/main-page.png', fullPage: true });

  // Try to navigate to asset detail
  await page.goto('http://localhost:5173/asset/1');
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'e2e/screenshots/asset-detail.png', fullPage: true });

  // Print errors
  console.log('Console errors:', errors);

  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
});
