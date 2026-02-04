/**
 * Manual Balance Verification Test
 *
 * Opens the browser and pauses so you can log in manually.
 * After you're logged in, press Enter in the terminal to continue
 * and the test will verify the balance matches the API.
 *
 * Run with: npx playwright test e2e/manual-balance-check.spec.ts --headed --project=desktop
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3001";

test("manual verification - log in then verify balances", async ({ page }) => {
  // Step 1: Open the app
  console.log("\n=== Opening the app ===");
  console.log("Please log in if needed, then navigate to /portfolio");
  console.log("When ready, the test will automatically continue in 30 seconds...\n");

  await page.goto("/portfolio");
  await page.waitForLoadState("domcontentloaded");

  // Give you time to log in if needed
  await page.waitForTimeout(30000);

  // Step 2: Check current state
  console.log("\n=== Checking auth state ===");
  const url = page.url();
  console.log("Current URL:", url);

  const authState = await page.evaluate(() => ({
    sessionToken: localStorage.getItem("wraith_session_token"),
    serverProfile: localStorage.getItem("wraith_server_profile"),
  }));

  console.log("Session token:", authState.sessionToken ? "present" : "missing");

  if (!authState.sessionToken) {
    console.log("Not logged in - skipping verification");
    await page.screenshot({ path: "e2e/screenshots/manual-not-logged-in.png", fullPage: true });
    return;
  }

  const serverProfile = authState.serverProfile ? JSON.parse(authState.serverProfile) : null;
  console.log("User ID:", serverProfile?.id);

  // Step 3: Fetch portfolio from API
  console.log("\n=== Fetching portfolio from API ===");
  const portfolioResponse = await page.request.get(
    `${API_BASE}/api/trading/portfolios?user_id=${serverProfile?.id}`,
    { headers: { Authorization: `Bearer ${authState.sessionToken}` } }
  );

  const portfolioJson = await portfolioResponse.json();
  console.log("API Response:", JSON.stringify(portfolioJson, null, 2));

  const portfolio = portfolioJson.data?.[0];

  // Step 4: Take screenshot
  await page.screenshot({ path: "e2e/screenshots/manual-portfolio-page.png", fullPage: true });

  // Step 5: Report findings
  console.log("\n=== RESULTS ===");
  if (portfolio) {
    console.log("API Portfolio Data:");
    console.log("  ID:", portfolio.id);
    console.log("  Cash Balance:", portfolio.cashBalance);
    console.log("  Total Value:", portfolio.totalValue);
    console.log("  Margin Used:", portfolio.marginUsed);
    console.log("  Margin Available:", portfolio.marginAvailable);
    console.log("  Unrealized P&L:", portfolio.unrealizedPnl);
    console.log("  Realized P&L:", portfolio.realizedPnl);
  } else {
    console.log("No portfolio found for this user");
    console.log("The app should have created a default portfolio when you visited /portfolio");
  }

  // Check what's visible in the UI
  const pageContent = await page.content();

  // Look for dollar amounts
  const dollarMatches = pageContent.match(/\$[\d,]+(\.\d{2})?/g);
  console.log("\nDollar amounts found in UI:", dollarMatches?.slice(0, 20));

  // Look for specific balance indicators
  if (portfolio?.cashBalance) {
    const balanceStr = portfolio.cashBalance.toLocaleString();
    const found = pageContent.includes(balanceStr);
    console.log(`\nLooking for balance ${balanceStr} in UI:`, found ? "FOUND" : "NOT FOUND");
  }
});

test("check bot_grandma portfolio directly", async ({ request }) => {
  console.log("\n=== Checking bot_grandma portfolio ===");

  const response = await request.get(`${API_BASE}/api/trading/portfolios?user_id=bot_grandma`);
  const json = await response.json();

  const portfolio = json.data?.[0];
  if (portfolio) {
    console.log("bot_grandma portfolio:");
    console.log("  ID:", portfolio.id);
    console.log("  Cash Balance:", portfolio.cashBalance);
    console.log("  Total Value:", portfolio.totalValue);
  } else {
    console.log("No portfolio found for bot_grandma");
  }
});
