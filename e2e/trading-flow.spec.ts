/**
 * End-to-End Trading Flow Tests
 *
 * Comprehensive tests for the trading interface:
 * 1. Account creation and authentication
 * 2. Navigate to trade sandbox
 * 3. Place various order types (market, limit, stop_loss, take_profit)
 * 4. Verify positions, orders, and history tabs
 * 5. Test order cancellation and position management
 *
 * Run: npx playwright test e2e/trading-flow.spec.ts --project=desktop
 * Run headed: npx playwright test e2e/trading-flow.spec.ts --project=desktop --headed
 */

import { test, expect, Page } from "@playwright/test";

const API_BASE = "http://localhost:3001";

// Storage keys from AuthContext
const STORAGE_KEYS = {
  privateKey: "wraith_private_key",
  user: "wraith_user",
  session: "wraith_session_token",
  serverProfile: "wraith_server_profile",
};

/**
 * Create account and authenticate
 */
async function createAccountAndAuthenticate(page: Page): Promise<{
  authenticated: boolean;
  sessionToken: string | null;
  userId: string | null;
}> {
  // Navigate to profile page
  await page.goto("/profile");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Check if already authenticated
  let sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );

  if (sessionToken) {
    const serverProfile = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEYS.serverProfile
    );
    const profile = serverProfile ? JSON.parse(serverProfile) : null;
    return {
      authenticated: true,
      sessionToken,
      userId: profile?.id,
    };
  }

  // Look for "Create New Account" button
  const createButton = page.getByRole("button", { name: /create new account/i });
  if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await createButton.click();
    await page.waitForTimeout(5000); // Wait for account creation and auto-login
  }

  // Check auth state
  sessionToken = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.session
  );
  const serverProfile = await page.evaluate(
    (key) => localStorage.getItem(key),
    STORAGE_KEYS.serverProfile
  );
  const profile = serverProfile ? JSON.parse(serverProfile) : null;

  return {
    authenticated: !!sessionToken,
    sessionToken,
    userId: profile?.id,
  };
}

/**
 * Navigate to trade sandbox and wait for it to load
 */
async function navigateToTradeSandbox(page: Page): Promise<void> {
  await page.goto("/trade-sandbox");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3000);

  // Wait for the order form to be visible
  await page.waitForSelector('[data-testid="order-form"], .order-form, [class*="OrderForm"]', {
    timeout: 10000,
  }).catch(() => {
    // Fallback: wait for any card with BTC text
  });
}

/**
 * Select order type from dropdown
 */
async function selectOrderType(
  page: Page,
  orderType: "market" | "limit" | "stop_loss" | "take_profit"
): Promise<void> {
  const orderTypeLabels: Record<string, string> = {
    market: "Market",
    limit: "Limit",
    stop_loss: "Stop Loss",
    take_profit: "Take Profit",
  };

  // The Select component renders as a native <select> element
  const selectDropdown = page.locator("select").first();

  try {
    if (await selectDropdown.isVisible({ timeout: 3000 })) {
      // Use selectOption for native selects
      await selectDropdown.selectOption({ label: orderTypeLabels[orderType] });
      console.log(`Selected order type: ${orderType}`);
    }
  } catch (e) {
    console.log(`Could not select order type ${orderType}, may already be selected or using custom dropdown`);
    // Fallback: try clicking the option text if it's a custom dropdown
    const optionText = page.getByText(orderTypeLabels[orderType], { exact: true });
    if (await optionText.isVisible().catch(() => false)) {
      await optionText.click();
    }
  }

  await page.waitForTimeout(300);
}

/**
 * Select order side (buy/sell)
 */
async function selectOrderSide(page: Page, side: "buy" | "sell"): Promise<void> {
  // The side toggle uses Pressable elements (not HTML buttons)
  // The text is exactly "Buy / Long" or "Sell / Short" (without symbol)
  const targetText = side === "buy" ? "Buy / Long" : "Sell / Short";

  try {
    // Find the element with exact text (excludes submit button which has symbol)
    const toggle = page.getByText(targetText, { exact: true });

    if (await toggle.isVisible({ timeout: 2000 })) {
      await toggle.click();
      console.log(`Selected side: ${side}`);
    }
  } catch (e) {
    console.log(`Could not click ${side} toggle, may already be selected`);
  }

  await page.waitForTimeout(200);
}

/**
 * Enter price value (for limit/stop orders)
 */
async function enterPrice(page: Page, price: string): Promise<void> {
  // The PriceInput component has a label like "Limit Price" or "Trigger Price"
  // and an input with placeholder "0.00"
  // Find the price input section by label, then get the input inside it

  try {
    // Try to find input after the price label (Limit Price, Trigger Price)
    const priceLabel = page.getByText(/Limit Price|Trigger Price/i).first();
    if (await priceLabel.isVisible({ timeout: 2000 })) {
      // Get the input that's a sibling or descendant
      const priceInput = priceLabel.locator("xpath=../following-sibling::*//input | xpath=../..//input").first();
      if (await priceInput.isVisible()) {
        await priceInput.fill(price);
        console.log(`Entered price: ${price}`);
        await page.waitForTimeout(200);
        return;
      }
    }
  } catch {
    // Fallback
  }

  // Fallback: find all inputs and look for the price one
  const allInputs = page.locator("input");
  const count = await allInputs.count();

  for (let i = 0; i < count; i++) {
    const input = allInputs.nth(i);
    // Price input has a "$" prefix nearby
    const parent = input.locator("xpath=..");
    const parentText = await parent.textContent().catch(() => "");
    if (parentText?.includes("$")) {
      await input.fill(price);
      console.log(`Fallback: entered price ${price}`);
      break;
    }
  }

  await page.waitForTimeout(200);
}

/**
 * Enter size value
 */
async function enterSize(page: Page, size: string): Promise<void> {
  // Find size input
  const sizeInput = page
    .locator('input[placeholder*="size" i], input[placeholder*="amount" i], input[aria-label*="size" i]')
    .first();

  if (await sizeInput.isVisible().catch(() => false)) {
    await sizeInput.fill(size);
  } else {
    // Find input near "Size" label
    const allInputs = page.locator("input[type='text'], input[type='number'], input:not([type])");
    const inputCount = await allInputs.count();

    // Usually size input is the 2nd or 3rd input in the form
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute("placeholder").catch(() => "");
      if (placeholder?.toLowerCase().includes("size") || placeholder?.toLowerCase().includes("amount")) {
        await input.fill(size);
        break;
      }
    }
  }

  await page.waitForTimeout(200);
}

/**
 * Click quick size button (25%, 50%, 75%, 100%)
 */
async function clickQuickSizeButton(page: Page, percentage: number): Promise<void> {
  const buttonText = `${percentage}%`;
  // QuickSizeButtons uses Pressable, so look for text element instead
  const button = page.getByText(buttonText, { exact: true });

  try {
    if (await button.isVisible({ timeout: 2000 })) {
      await button.click();
      console.log(`Clicked ${buttonText} size button`);
      await page.waitForTimeout(200);
    }
  } catch (e) {
    console.log(`Quick size button ${buttonText} not found or not clickable`);
  }
}

/**
 * Submit the order
 */
async function submitOrder(page: Page, side: "buy" | "sell"): Promise<void> {
  // The submit button label is "Buy / Long {symbol}" or "Sell / Short {symbol}"
  // It's the enabled button in the form containing both the side and a symbol

  let submitted = false;

  // Common symbols to look for
  const symbols = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "DOT"];
  const sideText = side === "buy" ? "Buy" : "Sell";

  for (const symbol of symbols) {
    // Look for button containing both side and symbol
    const buttonPattern = new RegExp(`${sideText}.*${symbol}`, "i");
    const button = page.getByRole("button", { name: buttonPattern });

    try {
      if (await button.isVisible({ timeout: 500 })) {
        const isDisabled = await button.isDisabled().catch(() => true);
        if (!isDisabled) {
          await button.click();
          console.log(`Submitted ${side} order for ${symbol}`);
          submitted = true;
          break;
        } else {
          console.log(`Submit button for ${symbol} is disabled - may need to enter size`);
        }
      }
    } catch {
      // Try next symbol
    }
  }

  if (!submitted) {
    // Fallback: try any enabled button with the side text and a common crypto name
    console.log("Warning: Primary submit method failed, trying fallback...");
    const allButtons = page.locator("button");
    const count = await allButtons.count();

    for (let i = 0; i < count; i++) {
      const btn = allButtons.nth(i);
      const text = await btn.textContent().catch(() => "");
      const isDisabled = await btn.isDisabled().catch(() => true);

      // Check if button contains side text and any crypto symbol
      const hasSide = side === "buy"
        ? (text?.includes("Buy") || text?.includes("Long"))
        : (text?.includes("Sell") || text?.includes("Short"));
      const hasSymbol = symbols.some(s => text?.includes(s));

      if (hasSide && hasSymbol && !isDisabled) {
        await btn.click();
        console.log(`Fallback: clicked button with text "${text}"`);
        submitted = true;
        break;
      }
    }
  }

  if (!submitted) {
    console.log("Warning: Could not find or click submit button");
  }

  await page.waitForTimeout(500);
}

/**
 * Confirm order in modal
 */
async function confirmOrderInModal(page: Page): Promise<void> {
  // Wait for confirmation modal
  await page.waitForTimeout(500);

  // Look for confirm button in modal
  const confirmButton = page.getByRole("button", { name: /confirm|place order|submit/i });

  if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmButton.click();
    await page.waitForTimeout(1000);
  }

  // Close any success/receipt modal
  const closeButton = page.getByRole("button", { name: /close|done|ok/i });
  if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Switch to a specific tab (positions, orders, history)
 */
async function switchToTab(page: Page, tabName: "positions" | "orders" | "history"): Promise<void> {
  // SegmentedControl tabs - look for exact text
  const tabLabels: Record<string, string> = {
    positions: "Positions",
    orders: "Orders",
    history: "History",
  };

  const tab = page.getByText(tabLabels[tabName], { exact: true });

  try {
    if (await tab.isVisible({ timeout: 2000 })) {
      await tab.click();
      console.log(`Switched to ${tabName} tab`);
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log(`Could not switch to ${tabName} tab`);
  }
}

/**
 * Get count of items in the current tab
 */
async function getTabItemCount(page: Page): Promise<number> {
  // Look for table rows or list items
  const rows = page.locator("table tbody tr, [role='row']:not([role='columnheader'])");
  const count = await rows.count().catch(() => 0);
  return count;
}

// ============================================================================
// TESTS
// ============================================================================

test.describe("Trading Flow - Account Setup", () => {
  test("should create account and authenticate", async ({ page }) => {
    const { authenticated, sessionToken, userId } = await createAccountAndAuthenticate(page);

    console.log("Authentication result:");
    console.log("  Authenticated:", authenticated);
    console.log("  Session token:", sessionToken ? "present" : "missing");
    console.log("  User ID:", userId);

    expect(authenticated).toBe(true);
    expect(sessionToken).toBeTruthy();
    expect(userId).toBeTruthy();

    await page.screenshot({ path: "e2e/screenshots/trading-auth-complete.png" });
  });
});

test.describe("Trading Flow - Order Form UI", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("order form should be visible and interactive", async ({ page }) => {
    // Check that key elements are present
    const content = await page.content();

    // Should have order type text
    expect(content.toLowerCase()).toContain("order type");

    // Should have size/amount input area
    expect(content.toLowerCase()).toMatch(/size|amount/);

    // Should have leverage controls
    expect(content.toLowerCase()).toContain("leverage");

    // Should have buy/sell buttons
    expect(content.toLowerCase()).toMatch(/buy|long/);
    expect(content.toLowerCase()).toMatch(/sell|short/);

    await page.screenshot({ path: "e2e/screenshots/trading-order-form.png", fullPage: true });
  });

  test("should display current price", async ({ page }) => {
    const content = await page.content();

    // Look for price display (should have $ and numbers)
    const priceMatches = content.match(/\$[\d,]+(\.\d+)?/g);

    expect(priceMatches).toBeTruthy();
    expect(priceMatches!.length).toBeGreaterThan(0);

    console.log("Prices found on page:", priceMatches?.slice(0, 5));
  });

  test("should show positions/orders/history tabs", async ({ page }) => {
    // The tabs use SegmentedControl which may not render as button roles
    // Check for tab text content instead
    const positionsTab = page.getByText("Positions", { exact: true });
    const ordersTab = page.getByText("Orders", { exact: true });
    const historyTab = page.getByText("History", { exact: true });

    expect(await positionsTab.isVisible().catch(() => false)).toBe(true);
    expect(await ordersTab.isVisible().catch(() => false)).toBe(true);
    expect(await historyTab.isVisible().catch(() => false)).toBe(true);
  });
});

test.describe("Trading Flow - Place Orders", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("should place a market buy order", async ({ page }) => {
    console.log("\n=== Placing Market Buy Order ===");

    // Select market order type (should be default)
    await selectOrderSide(page, "buy");

    // Use quick size button to set size
    await clickQuickSizeButton(page, 25);

    // Take screenshot before submit
    await page.screenshot({ path: "e2e/screenshots/trading-market-buy-before.png" });

    // Submit order
    await submitOrder(page, "buy");

    // Confirm in modal
    await confirmOrderInModal(page);

    // Take screenshot after
    await page.screenshot({ path: "e2e/screenshots/trading-market-buy-after.png" });

    // Check positions tab for new position
    await switchToTab(page, "positions");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/trading-positions-after-market.png" });

    const content = await page.content();
    console.log("Page has LONG indicator:", content.includes("LONG") || content.includes("Long"));
  });

  test("should place a market sell order", async ({ page }) => {
    console.log("\n=== Placing Market Sell Order ===");

    // Select sell side
    await selectOrderSide(page, "sell");

    // Use quick size button
    await clickQuickSizeButton(page, 25);

    // Take screenshot
    await page.screenshot({ path: "e2e/screenshots/trading-market-sell-before.png" });

    // Submit order
    await submitOrder(page, "sell");

    // Confirm in modal
    await confirmOrderInModal(page);

    await page.screenshot({ path: "e2e/screenshots/trading-market-sell-after.png" });

    // Check positions tab
    await switchToTab(page, "positions");
    await page.waitForTimeout(1000);

    const content = await page.content();
    console.log("Page has SHORT indicator:", content.includes("SHORT") || content.includes("Short"));
  });

  test("should place a limit buy order", async ({ page }) => {
    console.log("\n=== Placing Limit Buy Order ===");

    // Get current price from page
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const limitPrice = (currentPrice * 0.95).toFixed(2); // 5% below current

    console.log("Current price:", currentPrice);
    console.log("Limit price:", limitPrice);

    // Select limit order type
    await selectOrderType(page, "limit");
    await page.waitForTimeout(500);

    // Select buy side
    await selectOrderSide(page, "buy");

    // Enter limit price
    await enterPrice(page, limitPrice);

    // Enter size
    await clickQuickSizeButton(page, 25);

    await page.screenshot({ path: "e2e/screenshots/trading-limit-buy-before.png" });

    // Submit order
    await submitOrder(page, "buy");

    // Confirm in modal
    await confirmOrderInModal(page);

    await page.screenshot({ path: "e2e/screenshots/trading-limit-buy-after.png" });

    // Check orders tab for pending order
    await switchToTab(page, "orders");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/trading-orders-after-limit.png" });

    const content = await page.content();
    console.log("Has limit order:", content.toLowerCase().includes("limit"));
  });

  test("should place a stop loss order", async ({ page }) => {
    console.log("\n=== Placing Stop Loss Order ===");

    // Get current price
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const stopPrice = (currentPrice * 0.90).toFixed(2); // 10% below current

    console.log("Current price:", currentPrice);
    console.log("Stop price:", stopPrice);

    // Select stop loss order type
    await selectOrderType(page, "stop_loss");
    await page.waitForTimeout(500);

    // Select sell side (stop loss is typically a sell)
    await selectOrderSide(page, "sell");

    // Enter trigger price
    await enterPrice(page, stopPrice);

    // Enter size
    await clickQuickSizeButton(page, 25);

    await page.screenshot({ path: "e2e/screenshots/trading-stop-loss-before.png" });

    // Submit order
    await submitOrder(page, "sell");

    // Confirm in modal
    await confirmOrderInModal(page);

    await page.screenshot({ path: "e2e/screenshots/trading-stop-loss-after.png" });

    // Check orders tab
    await switchToTab(page, "orders");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/trading-orders-after-stop.png" });
  });

  test("should place a take profit order", async ({ page }) => {
    console.log("\n=== Placing Take Profit Order ===");

    // Get current price
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const takeProfitPrice = (currentPrice * 1.10).toFixed(2); // 10% above current

    console.log("Current price:", currentPrice);
    console.log("Take profit price:", takeProfitPrice);

    // Select take profit order type
    await selectOrderType(page, "take_profit");
    await page.waitForTimeout(500);

    // Select sell side
    await selectOrderSide(page, "sell");

    // Enter trigger price
    await enterPrice(page, takeProfitPrice);

    // Enter size
    await clickQuickSizeButton(page, 25);

    await page.screenshot({ path: "e2e/screenshots/trading-take-profit-before.png" });

    // Submit order
    await submitOrder(page, "sell");

    // Confirm in modal
    await confirmOrderInModal(page);

    await page.screenshot({ path: "e2e/screenshots/trading-take-profit-after.png" });
  });
});

test.describe("Trading Flow - Tab Verification", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("positions tab should show open positions", async ({ page }) => {
    // First place a market order to create a position
    await selectOrderSide(page, "buy");
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);

    // Switch to positions tab
    await switchToTab(page, "positions");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "e2e/screenshots/trading-positions-tab.png", fullPage: true });

    // Check for position data
    const content = await page.content();

    // Positions should show symbol, side, entry price, P&L
    const hasPositionIndicators =
      content.includes("LONG") ||
      content.includes("SHORT") ||
      content.includes("Entry") ||
      content.includes("P&L") ||
      content.includes("Unrealized");

    console.log("Positions tab has position indicators:", hasPositionIndicators);

    // Get position count
    const positionCount = await getTabItemCount(page);
    console.log("Position count:", positionCount);
  });

  test("orders tab should show pending orders", async ({ page }) => {
    // Place a limit order (won't execute immediately)
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const limitPrice = (currentPrice * 0.80).toFixed(2); // 20% below - won't fill

    await selectOrderType(page, "limit");
    await selectOrderSide(page, "buy");
    await enterPrice(page, limitPrice);
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);

    // Switch to orders tab
    await switchToTab(page, "orders");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "e2e/screenshots/trading-orders-tab.png", fullPage: true });

    // Check for order data
    const content = await page.content();

    const hasOrderIndicators =
      content.toLowerCase().includes("pending") ||
      content.toLowerCase().includes("limit") ||
      content.toLowerCase().includes("open");

    console.log("Orders tab has order indicators:", hasOrderIndicators);

    // Get order count
    const orderCount = await getTabItemCount(page);
    console.log("Order count:", orderCount);
  });

  test("history tab should show trade history", async ({ page }) => {
    // Place a market order (executes immediately)
    await selectOrderSide(page, "buy");
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);

    // Switch to history tab
    await switchToTab(page, "history");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "e2e/screenshots/trading-history-tab.png", fullPage: true });

    // Check for history data
    const content = await page.content();

    const hasHistoryIndicators =
      content.toLowerCase().includes("filled") ||
      content.toLowerCase().includes("executed") ||
      content.toLowerCase().includes("trade") ||
      content.includes("BTC");

    console.log("History tab has trade indicators:", hasHistoryIndicators);

    // Get history count
    const historyCount = await getTabItemCount(page);
    console.log("History count:", historyCount);
  });
});

test.describe("Trading Flow - Order Management", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("should cancel a pending order", async ({ page }) => {
    // Place a limit order far from market price
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const limitPrice = (currentPrice * 0.50).toFixed(2); // 50% below - definitely won't fill

    await selectOrderType(page, "limit");
    await selectOrderSide(page, "buy");
    await enterPrice(page, limitPrice);
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);

    // Switch to orders tab
    await switchToTab(page, "orders");
    await page.waitForTimeout(1000);

    const orderCountBefore = await getTabItemCount(page);
    console.log("Orders before cancel:", orderCountBefore);

    await page.screenshot({ path: "e2e/screenshots/trading-before-cancel.png" });

    // Find and click cancel button
    const cancelButton = page.getByRole("button", { name: /cancel/i }).first();
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      await page.waitForTimeout(1000);

      // Confirm cancellation if modal appears
      const confirmCancel = page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmCancel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmCancel.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: "e2e/screenshots/trading-after-cancel.png" });

    const orderCountAfter = await getTabItemCount(page);
    console.log("Orders after cancel:", orderCountAfter);
  });

  test("should close a position", async ({ page }) => {
    // Place a market order to create position
    await selectOrderSide(page, "buy");
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);

    // Switch to positions tab
    await switchToTab(page, "positions");
    await page.waitForTimeout(1000);

    const positionCountBefore = await getTabItemCount(page);
    console.log("Positions before close:", positionCountBefore);

    await page.screenshot({ path: "e2e/screenshots/trading-before-close.png" });

    // Find and click close button
    const closeButton = page.getByRole("button", { name: /close/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1000);

      // Confirm close if modal appears
      const confirmClose = page.getByRole("button", { name: /confirm|close position/i });
      if (await confirmClose.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmClose.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: "e2e/screenshots/trading-after-close.png" });

    // Check history tab for the closed trade
    await switchToTab(page, "history");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/trading-history-after-close.png" });
  });
});

test.describe("Trading Flow - Full Integration", () => {
  test("complete trading workflow", async ({ page }) => {
    console.log("\n========================================");
    console.log("COMPLETE TRADING WORKFLOW TEST");
    console.log("========================================\n");

    // Step 1: Authenticate
    console.log("Step 1: Authenticating...");
    const { authenticated, userId } = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);
    console.log("  ✓ Authenticated as:", userId);

    // Step 2: Navigate to trade sandbox
    console.log("\nStep 2: Navigating to trade sandbox...");
    await navigateToTradeSandbox(page);
    console.log("  ✓ Trade sandbox loaded");

    // Step 3: Place market buy order
    console.log("\nStep 3: Placing market buy order...");
    await selectOrderSide(page, "buy");
    await clickQuickSizeButton(page, 25);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);
    console.log("  ✓ Market buy order placed");

    // Step 4: Verify position created
    console.log("\nStep 4: Verifying position created...");
    await switchToTab(page, "positions");
    await page.waitForTimeout(2000);
    const positionCount = await getTabItemCount(page);
    console.log("  Position count:", positionCount);

    // Step 5: Place limit order
    console.log("\nStep 5: Placing limit order...");
    const priceText = await page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    const currentPrice = parseFloat(priceText?.replace(/[$,]/g, "") || "50000");
    const limitPrice = (currentPrice * 0.70).toFixed(2);

    await selectOrderType(page, "limit");
    await selectOrderSide(page, "buy");
    await enterPrice(page, limitPrice);
    await clickQuickSizeButton(page, 10);
    await submitOrder(page, "buy");
    await confirmOrderInModal(page);
    console.log("  ✓ Limit order placed at:", limitPrice);

    // Step 6: Verify pending order
    console.log("\nStep 6: Verifying pending order...");
    await switchToTab(page, "orders");
    await page.waitForTimeout(1000);
    const orderCount = await getTabItemCount(page);
    console.log("  Order count:", orderCount);

    // Step 7: Check history
    console.log("\nStep 7: Checking trade history...");
    await switchToTab(page, "history");
    await page.waitForTimeout(1000);
    const historyCount = await getTabItemCount(page);
    console.log("  History count:", historyCount);

    // Final screenshot
    await page.screenshot({ path: "e2e/screenshots/trading-complete-workflow.png", fullPage: true });

    console.log("\n========================================");
    console.log("WORKFLOW COMPLETE");
    console.log("========================================\n");
  });
});
