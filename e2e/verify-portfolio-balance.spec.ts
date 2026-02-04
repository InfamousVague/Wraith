/**
 * Portfolio Balance Verification Test
 *
 * This test verifies that the Portfolio page displays the correct balance from the API.
 * It preserves browser state between runs to use your existing login session.
 *
 * Run with: npx playwright test e2e/verify-portfolio-balance.spec.ts --headed --project=desktop
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3001";

test.describe("Portfolio Balance Verification", () => {
  // Use persistent browser context to preserve login
  test.use({
    storageState: undefined, // Don't use saved state, let the test handle it
  });

  test("verify portfolio balance matches API", async ({ page }) => {
    // Step 1: Go to portfolio page (will redirect to profile if not logged in)
    console.log("\n=== Step 1: Navigate to Portfolio ===");
    await page.goto("/portfolio");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Check if we're on the portfolio page or redirected to login
    const url = page.url();
    console.log("Current URL:", url);

    if (url.includes("/profile")) {
      console.log("Not logged in - please log in manually first, then re-run this test");
      await page.screenshot({ path: "e2e/screenshots/verify-not-logged-in.png", fullPage: true });
      test.skip();
      return;
    }

    // Step 2: Get localStorage data
    console.log("\n=== Step 2: Check Auth State ===");
    const authState = await page.evaluate(() => {
      return {
        sessionToken: localStorage.getItem("wraith_session_token"),
        serverProfile: localStorage.getItem("wraith_server_profile"),
        user: localStorage.getItem("wraith_user"),
      };
    });

    console.log("Session token:", authState.sessionToken ? "present" : "missing");

    if (!authState.sessionToken) {
      console.log("No session token found - user not authenticated");
      test.skip();
      return;
    }

    const serverProfile = authState.serverProfile ? JSON.parse(authState.serverProfile) : null;
    console.log("Server Profile ID:", serverProfile?.id);

    // Step 3: Fetch portfolio data from API
    console.log("\n=== Step 3: Fetch Portfolio from API ===");
    const portfolioResponse = await page.request.get(
      `${API_BASE}/api/trading/portfolios?user_id=${serverProfile?.id}`,
      {
        headers: {
          Authorization: `Bearer ${authState.sessionToken}`,
        },
      }
    );

    const portfolioJson = await portfolioResponse.json();
    console.log("API Response:", JSON.stringify(portfolioJson, null, 2));

    const apiPortfolio = portfolioJson.data?.[0];
    if (!apiPortfolio) {
      console.log("No portfolio found for this user in API");
      // Take screenshot anyway
      await page.screenshot({ path: "e2e/screenshots/verify-no-portfolio.png", fullPage: true });
      return;
    }

    console.log("\n=== API Portfolio Data ===");
    console.log("ID:", apiPortfolio.id);
    console.log("Cash Balance:", apiPortfolio.cashBalance);
    console.log("Total Value:", apiPortfolio.totalValue);
    console.log("Margin Used:", apiPortfolio.marginUsed);
    console.log("Margin Available:", apiPortfolio.marginAvailable);
    console.log("Unrealized P&L:", apiPortfolio.unrealizedPnl);
    console.log("Realized P&L:", apiPortfolio.realizedPnl);

    // Step 4: Check UI values
    console.log("\n=== Step 4: Check UI Values ===");
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: "e2e/screenshots/verify-portfolio-page.png", fullPage: true });

    // Get page content
    const pageContent = await page.content();

    // Format expected values
    const formatCurrency = (value: number) => {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toFixed(2);
    };

    const expectedBalance = apiPortfolio.cashBalance;
    const expectedFormatted = [
      expectedBalance.toLocaleString(),
      formatCurrency(expectedBalance),
      `$${expectedBalance.toLocaleString()}`,
      `$${formatCurrency(expectedBalance)}`,
    ];

    console.log("Expected balance formats:", expectedFormatted);

    // Check if any expected format appears in the page
    let balanceFound = false;
    for (const format of expectedFormatted) {
      if (pageContent.includes(format)) {
        console.log(`✓ Found balance in UI: ${format}`);
        balanceFound = true;
        break;
      }
    }

    if (!balanceFound) {
      console.log("✗ Balance not found in expected formats");

      // Try to find any dollar amounts on the page
      const dollarMatches = pageContent.match(/\$[\d,]+(\.\d{2})?/g);
      console.log("Dollar amounts found on page:", dollarMatches?.slice(0, 10));
    }

    // Step 5: Summary
    console.log("\n=== Summary ===");
    console.log("API Cash Balance:", `$${apiPortfolio.cashBalance.toLocaleString()}`);
    console.log("Balance displayed correctly:", balanceFound ? "YES" : "NO");

    // The test passes if we can verify the balance
    if (apiPortfolio.cashBalance > 0) {
      expect(balanceFound).toBe(true);
    }
  });

  test("direct API verification for known users", async ({ request }) => {
    console.log("\n=== Direct API Check ===\n");

    // Check bot_grandma portfolio
    const response = await request.get(`${API_BASE}/api/trading/portfolios?user_id=bot_grandma`);
    const json = await response.json();

    console.log("bot_grandma portfolio:");
    if (json.data?.[0]) {
      const p = json.data[0];
      console.log("  Cash Balance:", p.cashBalance);
      console.log("  Total Value:", p.totalValue);
      console.log("  Margin Available:", p.marginAvailable);
    } else {
      console.log("  No portfolio found");
    }

    expect(response.ok()).toBe(true);
  });
});
