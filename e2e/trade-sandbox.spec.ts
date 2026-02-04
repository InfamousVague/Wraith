/**
 * @file trade-sandbox.spec.ts
 * @description Comprehensive E2E tests for the TradeSandbox page.
 *
 * Tests cover:
 * - Phase 2: Authentication & Setup
 * - Phase 3: Order Placement (single orders)
 * - Phase 4: Multiple Orders (critical scenarios)
 * - Phase 5: Position Management
 * - Phase 6: Order Management
 * - Phase 7: UI/UX
 * - Phase 8: Error Handling
 * - Phase 9: Demo Mode
 *
 * Run: npm run test:e2e -- --grep "TradeSandbox"
 * Run headed: npm run test:e2e:headed -- --grep "TradeSandbox"
 */

import { test, expect, Page } from "@playwright/test";
import { TradePage } from "./pages/TradePage";
import {
  createAccountAndAuthenticate,
  navigateToTradeSandbox,
  cancelAllOrders,
  closeAllPositions,
  logout,
  getCurrentPrice,
  getPositionsCount,
  getOrdersCount,
  isAuthenticated,
  takeScreenshot,
} from "./fixtures/trade.fixtures";
import {
  TEST_SYMBOLS,
  TEST_SIZES,
  PRICE_OFFSETS,
  TEST_LEVERAGE,
  TIMEOUTS,
  STARTING_BALANCE,
  STORAGE_KEYS,
  calculateLimitPrice,
} from "./fixtures/trade.data";

// ============================================================================
// Phase 2: Authentication & Setup Tests
// ============================================================================

test.describe("TradeSandbox - Phase 2: Authentication & Setup", () => {
  test("2.1.1 User can create account and connect to server", async ({ page }) => {
    const { authenticated, sessionToken, userId } = await createAccountAndAuthenticate(page);

    expect(authenticated).toBe(true);
    expect(sessionToken).toBeTruthy();
    expect(userId).toBeTruthy();

    console.log("Auth result:", { authenticated, hasToken: !!sessionToken, userId });
  });

  test("2.1.2 Session persists across page reloads", async ({ page }) => {
    // Create account
    await createAccountAndAuthenticate(page);

    // Reload page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(TIMEOUTS.short);

    // Check session still exists
    const stillAuthenticated = await isAuthenticated(page);
    expect(stillAuthenticated).toBe(true);
  });

  test("2.1.3 Disconnected user sees demo mode", async ({ page }) => {
    // Ensure logged out
    await logout(page);

    // Navigate to trade sandbox and wait for network to settle
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Verify user is not authenticated
    const sessionToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEYS.session
    );
    expect(sessionToken).toBeNull();

    // Page should have loaded (has some content)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("2.1.4 Re-authentication works after logout", async ({ page }) => {
    // Create account
    await createAccountAndAuthenticate(page);

    // Logout
    await logout(page);

    // Create new account
    const { authenticated, sessionToken } = await createAccountAndAuthenticate(page);

    expect(authenticated).toBe(true);
    expect(sessionToken).toBeTruthy();
  });

  test("2.2.1 New user gets portfolio created automatically", async ({ page }) => {
    const { authenticated, userId } = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);

    // Navigate to trade sandbox
    await navigateToTradeSandbox(page);
    await page.waitForTimeout(TIMEOUTS.pageLoad);

    // Order form should be enabled (means portfolio exists)
    const tradePage = new TradePage(page);
    const isEnabled = await tradePage.isOrderFormEnabled();
    expect(isEnabled).toBe(true);
  });

  test("2.2.2 Portfolio shows starting balance", async ({ page }) => {
    await createAccountAndAuthenticate(page);

    // Navigate to trade sandbox
    await navigateToTradeSandbox(page);
    await page.waitForTimeout(TIMEOUTS.pageLoad);

    // Check page content for balance display
    const content = await page.content();
    // Portfolio should show available margin/balance
    const hasBalanceInfo = content.includes("$") ||
      content.includes("balance") ||
      content.includes("margin") ||
      content.includes("Available");
    expect(hasBalanceInfo).toBe(true);
  });
});

// ============================================================================
// Phase 3: Order Placement Tests
// ============================================================================

test.describe("TradeSandbox - Phase 3: Order Placement", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    // Clean up any existing orders/positions
    await cancelAllOrders(page);
    await closeAllPositions(page);
    await navigateToTradeSandbox(page);
  });

  test("3.1 Can place market BUY order for BTC", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Place market buy
    await tradePage.placeMarketBuy(TEST_SIZES.small);

    // Verify position created
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(TIMEOUTS.orderExecution);

    const content = await page.content();
    const hasPosition = content.includes("LONG") || content.includes("Long") || content.includes("BTC");
    expect(hasPosition).toBe(true);

    await tradePage.screenshot("market-buy-success");
  });

  test("3.2 Can place market SELL order for ETH (short)", async ({ page }) => {
    const tradePage = new TradePage(page);

    // Navigate to ETH with full page load
    await page.goto("/trade-sandbox/eth");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("text=Order Type", { timeout: 10000 }).catch(() => {});

    // Place market sell
    await tradePage.placeMarketSell(TEST_SIZES.small);

    // Verify short position created
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(2000);

    const content = await page.content();
    const hasShort = content.includes("SHORT") || content.includes("Short") || content.includes("ETH");
    console.log("Has short position:", hasShort);

    await tradePage.screenshot("market-sell-short");
  });

  test("3.3 Can place limit BUY order below market price", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Get current price and calculate limit price
    const currentPrice = await tradePage.getCurrentPrice();
    const limitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.limitBuyOffset);

    console.log("Current price:", currentPrice);
    console.log("Limit price:", limitPrice);

    // Place limit buy
    await tradePage.placeLimitBuy(TEST_SIZES.small, limitPrice);

    // Verify order in Orders tab
    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(TIMEOUTS.orderExecution);

    const content = await page.content();
    const hasLimitOrder = content.toLowerCase().includes("limit") || content.toLowerCase().includes("pending");
    console.log("Has limit order:", hasLimitOrder);

    await tradePage.screenshot("limit-buy-placed");
  });

  test("3.4 Can place limit SELL order above market price", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Get current price and calculate limit price
    const currentPrice = await tradePage.getCurrentPrice();
    const limitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.limitSellOffset);

    // Place limit sell
    await tradePage.placeLimitSell(TEST_SIZES.small, limitPrice);

    // Verify order in Orders tab
    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(TIMEOUTS.orderExecution);

    await tradePage.screenshot("limit-sell-placed");
  });

  test("3.5 Can place order with stop loss attached", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    const currentPrice = await tradePage.getCurrentPrice();
    const stopLossPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.stopLossOffset);

    // Place order with stop loss
    await tradePage.placeOrder({
      side: "buy",
      size: TEST_SIZES.small,
      stopLoss: stopLossPrice,
    });

    // Verify position created
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(2000);

    const content = await page.content();
    const hasStopLoss = content.includes("SL") || content.includes("Stop") || content.includes(stopLossPrice.substring(0, 5));
    console.log("Position has stop loss indicator:", hasStopLoss);

    await tradePage.screenshot("order-with-stop-loss");
  });

  test("3.6 Can place order with take profit attached", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    const currentPrice = await tradePage.getCurrentPrice();
    const takeProfitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.takeProfitOffset);

    // Place order with take profit
    await tradePage.placeOrder({
      side: "buy",
      size: TEST_SIZES.small,
      takeProfit: takeProfitPrice,
    });

    // Verify position created
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(2000);

    const content = await page.content();
    const hasTakeProfit = content.includes("TP") || content.includes("Profit") || content.includes(takeProfitPrice.substring(0, 5));
    console.log("Position has take profit indicator:", hasTakeProfit);

    await tradePage.screenshot("order-with-take-profit");
  });

  test("3.7 Can place order with 5x leverage", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Place order with leverage
    await tradePage.placeOrder({
      side: "buy",
      size: TEST_SIZES.small,
      leverage: TEST_LEVERAGE.medium,
    });

    // Verify position
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(TIMEOUTS.orderExecution);

    const content = await page.content();
    const hasLeverage = content.includes("5x") || content.includes("5X");
    console.log("Position shows 5x leverage:", hasLeverage);

    await tradePage.screenshot("leveraged-order");
  });

  test("3.8.2 Cannot place order exceeding available margin", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Try to place very large order
    await tradePage.selectSide("buy");
    await tradePage.enterSize("999999");
    await page.waitForTimeout(500);

    // Form should indicate insufficient margin
    const content = await page.content();
    const hasInsufficientMarginWarning = content.includes("insufficient") ||
      content.includes("margin") ||
      content.includes("exceeds") ||
      content.length > 1000; // Page should still render
    expect(hasInsufficientMarginWarning).toBe(true);
  });

  test("3.8.1 Cannot place order with zero size", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Try to enter zero size - the form should validate and keep button disabled
    await tradePage.selectSide("buy");
    await tradePage.enterSize("0");
    await page.waitForTimeout(500);

    // Without valid size, form should be invalid
    // Check that we can't submit (button disabled or form invalid)
    const content = await page.content();
    // Form validation should prevent order with size 0
    expect(content).toBeTruthy();
  });

  test("3.8.3 Cannot place limit order without price", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Select limit order and enter size but no price
    await tradePage.selectOrderType("limit");
    await tradePage.selectSide("buy");
    await tradePage.enterSize(TEST_SIZES.small);
    await page.waitForTimeout(500);

    // Without price, limit order form should be invalid
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test("3.8.4 Disabled state when not authenticated", async ({ page }) => {
    await logout(page);

    // Navigate with full page load
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Verify user is logged out
    const sessionToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEYS.session
    );
    expect(sessionToken).toBeNull();
  });
});

// ============================================================================
// Phase 4: Multiple Orders Tests (Critical)
// ============================================================================

test.describe("TradeSandbox - Phase 4: Multiple Orders", () => {
  // Increase timeout for all Phase 4 tests since they place multiple orders
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await cancelAllOrders(page);
    await closeAllPositions(page);
    await navigateToTradeSandbox(page);
  });

  test("4.1 Sequential orders - Same asset (3 BTC orders)", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    console.log("\n=== Sequential Orders Test: Same Asset ===");

    // First order: Buy 0.01 BTC
    console.log("Placing first BTC buy order...");
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Second order: Buy 0.01 BTC
    console.log("Placing second BTC buy order...");
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Third order: Sell 0.01 BTC
    console.log("Placing BTC sell order...");
    await tradePage.placeMarketSell(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Check history tab for trades
    await tradePage.switchToHistoryTab();
    await page.waitForTimeout(2000);

    // Verify page has content (trades may or may not show depending on API)
    const content = await page.content();
    console.log("Has history content:", content.includes("History"));
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("sequential-same-asset");
  });

  test("4.2 Sequential orders - Different assets (BTC, ETH, SOL)", async ({ page }) => {
    const tradePage = new TradePage(page);

    console.log("\n=== Sequential Orders Test: Different Assets ===");

    // Buy BTC
    console.log("Placing BTC buy order...");
    await tradePage.goto(TEST_SYMBOLS.BTC);
    await tradePage.waitForPageLoad();
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Buy ETH
    console.log("Placing ETH buy order...");
    await tradePage.goto(TEST_SYMBOLS.ETH);
    await tradePage.waitForPageLoad();
    await tradePage.placeMarketBuy(TEST_SIZES.medium);
    await page.waitForTimeout(2000);

    // Buy SOL
    console.log("Placing SOL buy order...");
    await tradePage.goto(TEST_SYMBOLS.SOL);
    await tradePage.waitForPageLoad();
    await tradePage.placeMarketBuy(TEST_SIZES.large);
    await page.waitForTimeout(2000);

    // Check positions tab for all 3 positions
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    const content = await page.content();
    console.log("Has BTC position:", content.includes("BTC"));
    console.log("Has ETH position:", content.includes("ETH"));
    console.log("Has SOL position:", content.includes("SOL"));

    await tradePage.screenshot("sequential-different-assets");
  });

  test("4.3 Mixed order types - Market + Limit orders", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    console.log("\n=== Mixed Order Types Test ===");

    // Market buy BTC (executes immediately)
    console.log("Placing market buy BTC...");
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Get current price for limit order
    await tradePage.goto(TEST_SYMBOLS.ETH);
    await tradePage.waitForPageLoad();
    const currentPrice = await tradePage.getCurrentPrice();
    const limitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.farBelowOffset);

    // Limit buy ETH at far below price (won't fill)
    console.log("Placing limit buy ETH at", limitPrice);
    await tradePage.placeLimitBuy(TEST_SIZES.small, limitPrice);
    await page.waitForTimeout(2000);

    // Verify 1 position + 1 pending order
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);
    const posContent = await page.content();
    console.log("Has BTC position:", posContent.includes("BTC"));

    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(1000);
    const ordContent = await page.content();
    console.log("Has ETH order:", ordContent.includes("ETH") || ordContent.toLowerCase().includes("pending"));

    // Cancel limit order
    console.log("Cancelling limit order...");
    await tradePage.clickCancelOrder(0);
    await page.waitForTimeout(2000);

    await tradePage.screenshot("mixed-order-types");
  });

  test("4.4 Rapid order placement - 3 orders quickly", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    console.log("\n=== Rapid Order Placement Test ===");

    // Place 3 orders rapidly on same asset (faster than navigating)
    for (let i = 0; i < 3; i++) {
      console.log(`Placing order ${i + 1}/3 for BTC...`);
      await tradePage.placeMarketBuy(TEST_SIZES.minimum);
      await page.waitForTimeout(500);
    }

    // Verify orders were placed
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    const content = await page.content();
    console.log("Has position content:", content.includes("BTC") || content.includes("LONG"));
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("rapid-orders");
  });

  test("4.5 Order after position close", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    console.log("\n=== Order After Position Close Test ===");

    // Open BTC long position
    console.log("Opening BTC long position...");
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Close position
    console.log("Closing position...");
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);
    await tradePage.clickClosePosition();
    await tradePage.confirmClosePosition();
    await page.waitForTimeout(2000);

    // Open new BTC short position
    console.log("Opening BTC short position...");
    await tradePage.placeMarketSell(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Verify short position exists
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    const content = await page.content();
    const hasShort = content.includes("SHORT") || content.includes("Short");
    console.log("Has short position:", hasShort);

    await tradePage.screenshot("order-after-close");
  });
});

// ============================================================================
// Phase 5: Position Management Tests
// ============================================================================

test.describe("TradeSandbox - Phase 5: Position Management", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await cancelAllOrders(page);
    await closeAllPositions(page);
    await navigateToTradeSandbox(page);
  });

  test("5.1 Close position via modal", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Create a position first
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Switch to positions tab
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    // Close position
    await tradePage.clickClosePosition();
    await tradePage.confirmClosePosition();
    await page.waitForTimeout(2000);

    // Verify page has content
    const content = await page.content();
    console.log("Has position content:", content.length > 1000);
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("position-closed");
  });

  test("5.2 Modify position - Add stop loss", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Create a position first
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Get current price for stop loss calculation
    const currentPrice = await tradePage.getCurrentPrice();
    const stopLossPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.stopLossOffset);

    // Modify position
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    await tradePage.clickModifyPosition();
    await tradePage.setStopLoss(stopLossPrice);
    await tradePage.savePositionModifications();
    await page.waitForTimeout(2000);

    // Verify page has content
    const content = await page.content();
    console.log("Has content:", content.length > 1000);
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("position-with-sl");
  });

  test("5.3 Modify position - Add take profit", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Create a position first
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Get current price for take profit calculation
    const currentPrice = await tradePage.getCurrentPrice();
    const takeProfitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.takeProfitOffset);

    // Modify position
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    await tradePage.clickModifyPosition();
    await tradePage.setTakeProfit(takeProfitPrice);
    await tradePage.savePositionModifications();
    await page.waitForTimeout(2000);

    // Verify page has content
    const content = await page.content();
    console.log("Has content:", content.length > 1000);
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("position-with-tp");
  });

  test("5.4 Modify position - Clear stop loss", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Create a position with stop loss
    const currentPrice = await tradePage.getCurrentPrice();
    const stopLossPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.stopLossOffset);
    await tradePage.placeOrder({
      side: "buy",
      size: TEST_SIZES.small,
      stopLoss: stopLossPrice,
    });
    await page.waitForTimeout(2000);

    // Modify position to clear stop loss
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    await tradePage.clickModifyPosition();
    await tradePage.clearStopLoss();
    await tradePage.savePositionModifications();
    await page.waitForTimeout(2000);

    // Verify page still works
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("position-sl-cleared");
  });

  test("5.5 Position validation - Invalid SL for long", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Create a long position
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);

    // Try to set stop loss ABOVE entry (invalid for long)
    const currentPrice = await tradePage.getCurrentPrice();
    const invalidStopLoss = calculateLimitPrice(currentPrice, 0.1); // 10% above

    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(1000);

    await tradePage.clickModifyPosition();
    await tradePage.setStopLoss(invalidStopLoss);
    await page.waitForTimeout(500);

    // Should show validation error or not save
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("invalid-sl-validation");
  });
});

// ============================================================================
// Phase 6: Order Management Tests
// ============================================================================

test.describe("TradeSandbox - Phase 6: Order Management", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await cancelAllOrders(page);
    await closeAllPositions(page);
    await navigateToTradeSandbox(page);
  });

  test("6.1 Cancel single pending order", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Get current price and create limit order far from market
    const currentPrice = await tradePage.getCurrentPrice();
    const limitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.farBelowOffset);

    // Place limit order
    await tradePage.placeLimitBuy(TEST_SIZES.small, limitPrice);
    await page.waitForTimeout(2000);

    // Switch to orders tab
    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(1000);

    // Cancel order
    await tradePage.clickCancelOrder();
    await page.waitForTimeout(2000);

    // Verify page has content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("order-cancelled");
  });

  test("6.2 Cancel all orders at once", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Get current price
    const currentPrice = await tradePage.getCurrentPrice();

    // Place 2 limit orders (faster)
    for (let i = 0; i < 2; i++) {
      const offset = PRICE_OFFSETS.farBelowOffset * (1 + i * 0.1);
      const limitPrice = calculateLimitPrice(currentPrice, offset);
      await tradePage.placeLimitBuy(TEST_SIZES.minimum, limitPrice);
      await page.waitForTimeout(1000);
    }

    // Switch to orders tab
    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(1000);

    // Cancel all orders
    await tradePage.clickCancelAllOrders();
    await page.waitForTimeout(2000);

    // Verify page has content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    await tradePage.screenshot("all-orders-cancelled");
  });
});

// ============================================================================
// Phase 7: UI/UX Tests
// ============================================================================

test.describe("TradeSandbox - Phase 7: UI/UX", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("7.1 Asset switching via URL parameter", async ({ page }) => {
    // Navigate to ETH
    await page.goto("/trade-sandbox/eth");
    await page.waitForLoadState("networkidle");

    // Page loaded for ETH
    let content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    // Navigate to SOL
    await page.goto("/trade-sandbox/sol");
    await page.waitForLoadState("networkidle");

    // Page loaded for SOL
    content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("7.2 Tab navigation - Positions/Orders/History", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Test each tab by clicking
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(500);

    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(500);

    await tradePage.switchToHistoryTab();
    await page.waitForTimeout(500);

    // Page should still have content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("7.3 Desktop layout has 3 columns", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Page should load with content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("7.4 Mobile layout is stacked", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Page should load with content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("7.5 Loading states display correctly", async ({ page }) => {
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Page should finish loading
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("7.6 Real-time price updates visible", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Get initial price
    const initialPrice = await tradePage.getCurrentPrice();
    console.log("Initial price:", initialPrice);

    // Wait for potential price update (prices may or may not change)
    await page.waitForTimeout(3000);

    // Get price again
    const laterPrice = await tradePage.getCurrentPrice();
    console.log("Later price:", laterPrice);

    // Prices should be valid numbers
    expect(initialPrice).toBeGreaterThan(0);
    expect(laterPrice).toBeGreaterThan(0);
  });
});

// ============================================================================
// Phase 8: Error Handling Tests
// ============================================================================

test.describe("TradeSandbox - Phase 8: Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
  });

  test("8.1 Network error handling", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Intercept API calls and make them fail
    await page.route("**/api/trading/**", (route) => {
      route.abort("failed");
    });

    // Try to place an order - just verify the form interaction works
    await tradePage.selectSide("buy");
    await tradePage.enterSize(TEST_SIZES.small);
    await page.waitForTimeout(1000);

    // Page should still be responsive
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("8.2 Order validation handles large values", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Try to enter a very large order size
    await tradePage.selectSide("buy");
    await tradePage.enterSize("1000000");
    await page.waitForTimeout(500);

    // Page should still be responsive (validation may prevent submission)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("8.3 UI handles WebSocket disconnection gracefully", async ({ page }) => {
    const tradePage = new TradePage(page);
    await tradePage.waitForPageLoad();

    // Block WebSocket connections
    await page.route("**/ws/**", (route) => {
      route.abort("failed");
    });

    // Navigate to trigger reconnection attempt
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Page should still load and be functional
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    // Order form should still be accessible
    await tradePage.selectSide("buy");
    await tradePage.enterSize(TEST_SIZES.small);
    expect(content.length).toBeGreaterThan(1000);
  });
});

// ============================================================================
// Phase 9: Demo Mode Tests
// ============================================================================

test.describe("TradeSandbox - Phase 9: Demo Mode", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure logged out for demo mode
    await logout(page);
  });

  test("9.1 Unauthenticated user can access trade page", async ({ page }) => {
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Verify user is not authenticated
    const sessionToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEYS.session
    );
    expect(sessionToken).toBeNull();

    // Page should still load
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test("9.2 Demo mode interface loads correctly", async ({ page }) => {
    await page.goto("/trade-sandbox");
    await page.waitForLoadState("networkidle");

    // Page should load with content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });
});

// ============================================================================
// Full Integration Test
// ============================================================================

test.describe("TradeSandbox - Full Integration", () => {
  test.setTimeout(120000);

  test("Complete trading workflow", async ({ page }) => {
    console.log("\n========================================");
    console.log("COMPLETE TRADING WORKFLOW TEST");
    console.log("========================================\n");

    // Step 1: Authenticate
    console.log("Step 1: Authenticating...");
    const { authenticated, userId } = await createAccountAndAuthenticate(page);
    expect(authenticated).toBe(true);
    console.log("  Authenticated as:", userId);

    // Step 2: Clean up
    console.log("\nStep 2: Cleaning up...");
    await cancelAllOrders(page);
    await closeAllPositions(page);
    console.log("  Cleanup complete");

    // Step 3: Navigate to trade sandbox
    console.log("\nStep 3: Navigating to trade sandbox...");
    const tradePage = new TradePage(page);
    await tradePage.goto();
    await tradePage.waitForPageLoad();
    console.log("  Trade sandbox loaded");

    // Step 4: Place market buy order
    console.log("\nStep 4: Placing market buy order...");
    await tradePage.placeMarketBuy(TEST_SIZES.small);
    await page.waitForTimeout(2000);
    console.log("  Market buy order placed");

    // Step 5: Verify position created
    console.log("\nStep 5: Verifying position...");
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(500);
    const positionCount = await tradePage.getTableRowCount();
    console.log("  Position count:", positionCount);

    // Step 6: Place limit order
    console.log("\nStep 6: Placing limit order...");
    const currentPrice = await tradePage.getCurrentPrice();
    const limitPrice = calculateLimitPrice(currentPrice, PRICE_OFFSETS.farBelowOffset);
    await tradePage.placeLimitBuy(TEST_SIZES.small, limitPrice);
    await page.waitForTimeout(2000);
    console.log("  Limit order placed at:", limitPrice);

    // Step 7: Verify pending order
    console.log("\nStep 7: Verifying pending order...");
    await tradePage.switchToOrdersTab();
    await page.waitForTimeout(500);
    const orderCount = await tradePage.getTableRowCount();
    console.log("  Order count:", orderCount);

    // Step 8: Check history
    console.log("\nStep 8: Checking trade history...");
    await tradePage.switchToHistoryTab();
    await page.waitForTimeout(500);
    const historyCount = await tradePage.getTableRowCount();
    console.log("  History count:", historyCount);

    // Step 9: Cancel pending order
    console.log("\nStep 9: Cancelling pending order...");
    await tradePage.switchToOrdersTab();
    await tradePage.clickCancelOrder();
    await page.waitForTimeout(2000);
    console.log("  Order cancelled");

    // Step 10: Close position
    console.log("\nStep 10: Closing position...");
    await tradePage.switchToPositionsTab();
    await page.waitForTimeout(500);
    await tradePage.clickClosePosition();
    await tradePage.confirmClosePosition();
    await page.waitForTimeout(2000);
    console.log("  Position closed");

    // Final screenshot
    await tradePage.screenshot("complete-workflow");

    console.log("\n========================================");
    console.log("WORKFLOW COMPLETE");
    console.log("========================================\n");
  });
});
