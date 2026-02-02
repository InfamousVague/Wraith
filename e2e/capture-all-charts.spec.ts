import { test, expect } from '@playwright/test';

test('capture all chart variations', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout

  // Navigate to BTC
  await page.goto('http://localhost:5173/asset/1');
  await page.waitForTimeout(5000);

  // 1. Area chart (default) - 1W
  await page.screenshot({ path: 'e2e/screenshots/01-btc-area-1w.png', fullPage: true });
  console.log('1. Area chart 1W captured');

  // Find time range buttons using text content - they're inside a segmented control
  const timeButtons = page.locator('[data-selected]');
  const allButtons = await page.locator('button').all();
  console.log(`Found ${allButtons.length} buttons`);

  // 2. Change to 1D - look for button with text content "1D"
  const dayButton = page.getByText('1D', { exact: true }).first();
  if (await dayButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dayButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/02-btc-area-1d.png', fullPage: true });
    console.log('2. Area chart 1D captured');
  } else {
    console.log('1D button not found, skipping');
  }

  // 3. Change to 1M
  const monthButton = page.getByText('1M', { exact: true }).first();
  if (await monthButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await monthButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/03-btc-area-1m.png', fullPage: true });
    console.log('3. Area chart 1M captured');
  }

  // 4. Switch to Line chart
  const lineButton = page.getByText('Line', { exact: true }).first();
  if (await lineButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await lineButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/04-btc-line.png', fullPage: true });
    console.log('4. Line chart captured');
  }

  // 5. Switch to Candle chart
  const candleButton = page.getByText('Candle', { exact: true }).first();
  if (await candleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await candleButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/05-btc-candle.png', fullPage: true });
    console.log('5. Candle chart captured');
  }

  // 6. Enable SMA indicator
  const smaButton = page.getByText('SMA', { exact: true }).first();
  if (await smaButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await smaButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/06-btc-candle-sma.png', fullPage: true });
    console.log('6. Candle + SMA captured');
  }

  // 7. Enable EMA indicator
  const emaButton = page.getByText('EMA', { exact: true }).first();
  if (await emaButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emaButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/07-btc-candle-sma-ema.png', fullPage: true });
    console.log('7. Candle + SMA + EMA captured');
  }

  // 8. Enable Bollinger Bands
  const bbButton = page.getByText('BB', { exact: true }).first();
  if (await bbButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await bbButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/08-btc-all-indicators.png', fullPage: true });
    console.log('8. All indicators captured');
  }

  // 9. Switch back to Area with indicators
  const areaButton = page.getByText('Area', { exact: true }).first();
  if (await areaButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await areaButton.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/09-btc-area-all-indicators.png', fullPage: true });
    console.log('9. Area + all indicators captured');
  }

  console.log('All chart variations captured!');
});

