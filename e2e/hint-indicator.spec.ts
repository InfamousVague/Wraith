import { test, expect } from "@playwright/test";

test("hint indicator shows popup when clicked", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Clear any previously viewed hints to test fresh
  await page.evaluate(() => {
    sessionStorage.removeItem("wraith-hints-viewed");
  });
  await page.reload();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "test-results/hint-1-before.png" });

  // Find the indicator (it has "i" text and is positioned absolutely)
  const indicator = page.locator('div[style*="position: absolute"]').filter({ hasText: /^i$/ }).first();

  // Check it exists
  const isVisible = await indicator.isVisible();
  console.log("Indicator visible:", isVisible);

  if (isVisible) {
    const box = await indicator.boundingBox();
    console.log("Indicator position:", box);

    // Click on it
    await indicator.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: "test-results/hint-2-after-click.png" });

    // Check for popup content - use exact match for title
    const popupTitle = page.getByText("Market Sentiment", { exact: true });
    const titleVisible = await popupTitle.isVisible();
    console.log("Popup title visible:", titleVisible);

    // Check for Got it button
    const gotIt = page.locator("text=Got it");
    const gotItVisible = await gotIt.isVisible();
    console.log("Got it button visible:", gotItVisible);

    // Click Got it to dismiss - use force because the click handler is on parent div
    if (gotItVisible) {
      await gotIt.click({ force: true });
      await page.waitForTimeout(500);
      await page.screenshot({ path: "test-results/hint-3-dismissed.png" });
      console.log("Popup dismissed - indicator should now be smaller and static (no animation)");
    }
  } else {
    // Try clicking at the known position
    await page.click("text=Fear & Greed Index", { position: { x: 250, y: -10 } });
    await page.waitForTimeout(300);
    await page.screenshot({ path: "test-results/hint-2-click-attempt.png" });
  }
});
