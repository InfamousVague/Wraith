import { test, expect } from '@playwright/test';

test('debug asset page', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to asset page...');

  await page.goto('http://localhost:5173/asset/1', { timeout: 15000 });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'tests/asset-debug.png', fullPage: true });
  console.log('Screenshot saved to tests/asset-debug.png');

  // Get body text
  const bodyText = await page.locator('body').innerText();
  console.log('=== PAGE CONTENT ===');
  console.log(bodyText.substring(0, 1000));
  console.log('=== END CONTENT ===');

  // Check for any visible errors
  const html = await page.content();
  if (html.includes('Error') || html.includes('error')) {
    console.log('Found error-related content in HTML');
  }
});
