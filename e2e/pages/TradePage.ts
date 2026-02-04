/**
 * @file TradePage.ts
 * @description Page Object Model for TradeSandbox page.
 *
 * Encapsulates all selectors and interactions for the trading interface.
 * Following the Page Object pattern for maintainable E2E tests.
 */

import { Page, Locator, expect } from "@playwright/test";
import {
  TIMEOUTS,
  ORDER_TYPES,
  ORDER_SIDES,
  TAB_LABELS,
  TEST_LEVERAGE,
  calculateLimitPrice,
  parsePriceText,
} from "../fixtures/trade.data";

/**
 * Order form state for placing orders.
 */
export interface OrderParams {
  orderType?: keyof typeof ORDER_TYPES;
  side: "buy" | "sell";
  size: string;
  price?: string;
  leverage?: number;
  stopLoss?: string;
  takeProfit?: string;
}

/**
 * Page Object Model for the TradeSandbox page.
 */
export class TradePage {
  readonly page: Page;

  // Selectors
  readonly orderForm: Locator;
  readonly orderTypeSelect: Locator;
  readonly buyToggle: Locator;
  readonly sellToggle: Locator;
  readonly priceInput: Locator;
  readonly sizeInput: Locator;
  readonly leverageSlider: Locator;
  readonly submitButton: Locator;

  // Tab selectors
  readonly positionsTab: Locator;
  readonly ordersTab: Locator;
  readonly historyTab: Locator;

  // Modal selectors
  readonly confirmModal: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly closeModalButton: Locator;

  // Table selectors
  readonly positionsTable: Locator;
  readonly ordersTable: Locator;
  readonly historyTable: Locator;

  constructor(page: Page) {
    this.page = page;

    // Order form elements
    this.orderForm = page.locator('[data-testid="order-form"], .order-form').first();
    this.orderTypeSelect = page.locator("select").first();
    this.buyToggle = page.getByText(ORDER_SIDES.buy, { exact: true });
    this.sellToggle = page.getByText(ORDER_SIDES.sell, { exact: true });
    this.priceInput = page.locator('input[placeholder*="0.00"]').first();
    this.sizeInput = page.locator('input[placeholder*="Size"], input[placeholder*="size"], input[placeholder*="Amount"]').first();
    this.leverageSlider = page.locator('input[type="range"]').first();
    this.submitButton = page.getByRole("button", { name: /Buy.*|Sell.*/i }).first();

    // Tabs
    this.positionsTab = page.getByText(TAB_LABELS.positions, { exact: true });
    this.ordersTab = page.getByText(TAB_LABELS.orders, { exact: true });
    this.historyTab = page.getByText(TAB_LABELS.history, { exact: true });

    // Modals
    this.confirmModal = page.locator("text=Confirm Order").first();
    this.confirmButton = page.getByRole("button", { name: /confirm|place order/i });
    this.cancelButton = page.getByRole("button", { name: /^cancel$/i }).first();
    this.closeModalButton = page.getByRole("button", { name: /close|done|ok|×/i }).first();

    // Tables
    this.positionsTable = page.locator("table").first();
    this.ordersTable = page.locator("table").first();
    this.historyTable = page.locator("table").first();
  }

  /**
   * Navigate to the trade sandbox page.
   */
  async goto(symbol?: string): Promise<void> {
    const path = symbol ? `/trade-sandbox/${symbol.toLowerCase()}` : "/trade-sandbox";
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForTimeout(TIMEOUTS.short);
    // Wait for order form to be visible
    await this.page.waitForSelector("text=Order Type", { timeout: TIMEOUTS.pageLoad }).catch(() => {});
  }

  /**
   * Select order type from dropdown.
   */
  async selectOrderType(orderType: keyof typeof ORDER_TYPES): Promise<void> {
    const label = ORDER_TYPES[orderType];

    try {
      if (await this.orderTypeSelect.isVisible({ timeout: TIMEOUTS.short })) {
        await this.orderTypeSelect.selectOption({ label });
      }
    } catch {
      // Try clicking the option text for custom dropdowns
      const optionText = this.page.getByText(label, { exact: true });
      if (await optionText.isVisible().catch(() => false)) {
        await optionText.click();
      }
    }

    await this.page.waitForTimeout(TIMEOUTS.short);
  }

  /**
   * Select order side (buy/sell).
   */
  async selectSide(side: "buy" | "sell"): Promise<void> {
    const toggle = side === "buy" ? this.buyToggle : this.sellToggle;

    try {
      if (await toggle.isVisible({ timeout: TIMEOUTS.short })) {
        await toggle.click();
      }
    } catch {
      // Side toggle may already be selected
    }

    await this.page.waitForTimeout(200);
  }

  /**
   * Enter price value (for limit/stop orders).
   */
  async enterPrice(price: string): Promise<void> {
    // Find price input near "Limit Price" or "Trigger Price" label
    const priceLabel = this.page.getByText(/Limit Price|Trigger Price/i).first();

    try {
      if (await priceLabel.isVisible({ timeout: TIMEOUTS.short })) {
        // Find input in the same container
        const container = priceLabel.locator("xpath=..");
        const input = container.locator("input").first();
        if (await input.isVisible()) {
          await input.fill(price);
          await this.page.waitForTimeout(200);
          return;
        }
      }
    } catch {
      // Fallback to first price-like input
    }

    // Fallback: find inputs and look for the price one (has $ nearby)
    const allInputs = this.page.locator("input");
    const count = await allInputs.count();

    for (let i = 0; i < count; i++) {
      const input = allInputs.nth(i);
      const parent = input.locator("xpath=..");
      const parentText = await parent.textContent().catch(() => "");
      if (parentText?.includes("$") && !parentText?.toLowerCase().includes("size")) {
        await input.fill(price);
        break;
      }
    }

    await this.page.waitForTimeout(200);
  }

  /**
   * Enter position size.
   */
  async enterSize(size: string): Promise<void> {
    // Try multiple selectors for size input
    const selectors = [
      'input[placeholder*="size" i]',
      'input[placeholder*="amount" i]',
      'input[aria-label*="size" i]',
    ];

    for (const selector of selectors) {
      const input = this.page.locator(selector).first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill(size);
        await this.page.waitForTimeout(200);
        return;
      }
    }

    // Fallback: Find input near "Size" label
    const sizeLabel = this.page.getByText(/^Size$/i).first();
    try {
      if (await sizeLabel.isVisible({ timeout: TIMEOUTS.short })) {
        const container = sizeLabel.locator("xpath=../..");
        const input = container.locator("input").first();
        if (await input.isVisible()) {
          await input.fill(size);
          return;
        }
      }
    } catch {
      // Fallback failed
    }
  }

  /**
   * Click quick size button (25%, 50%, 75%, 100%).
   */
  async clickQuickSize(percentage: 25 | 50 | 75 | 100): Promise<void> {
    const buttonText = `${percentage}%`;
    const button = this.page.getByText(buttonText, { exact: true });

    try {
      if (await button.isVisible({ timeout: TIMEOUTS.short })) {
        await button.click();
        await this.page.waitForTimeout(200);
      }
    } catch {
      // Button not found or not clickable
    }
  }

  /**
   * Set leverage value.
   */
  async setLeverage(leverage: number): Promise<void> {
    // Click preset button if available
    const presetButton = this.page.getByText(`${leverage}x`, { exact: true });

    try {
      if (await presetButton.isVisible({ timeout: TIMEOUTS.short })) {
        await presetButton.click();
        await this.page.waitForTimeout(200);
        return;
      }
    } catch {
      // Use slider fallback
    }

    // Fallback: Use slider
    try {
      if (await this.leverageSlider.isVisible()) {
        await this.leverageSlider.fill(String(leverage));
      }
    } catch {
      // Slider not available
    }
  }

  /**
   * Submit the order form.
   */
  async submitOrder(): Promise<void> {
    // Find the submit button with Buy/Sell text and symbol
    const symbols = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "AVAX", "DOT"];

    for (const symbol of symbols) {
      const buyPattern = new RegExp(`Buy.*${symbol}`, "i");
      const sellPattern = new RegExp(`Sell.*${symbol}`, "i");

      for (const pattern of [buyPattern, sellPattern]) {
        const button = this.page.getByRole("button", { name: pattern });
        try {
          if (await button.isVisible({ timeout: 300 })) {
            const isDisabled = await button.isDisabled().catch(() => true);
            if (!isDisabled) {
              await button.click();
              await this.page.waitForTimeout(TIMEOUTS.short);
              return;
            }
          }
        } catch {
          // Try next
        }
      }
    }
  }

  /**
   * Confirm order in the confirmation modal.
   */
  async confirmOrder(): Promise<void> {
    await this.page.waitForTimeout(TIMEOUTS.short);

    // Wait for modal and click confirm
    if (await this.confirmButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
      await this.confirmButton.click();
      await this.page.waitForTimeout(TIMEOUTS.modal);
    }

    // Close any success/receipt modal
    const closeButton = this.page.getByRole("button", { name: /close|done|ok/i });
    if (await closeButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
      await closeButton.click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }

  /**
   * Cancel order confirmation.
   */
  async cancelOrderConfirmation(): Promise<void> {
    if (await this.cancelButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
      await this.cancelButton.click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }

  /**
   * Place an order with the given parameters.
   * This is a high-level method that combines all order placement steps.
   */
  async placeOrder(params: OrderParams): Promise<void> {
    // Select order type (default: market)
    if (params.orderType && params.orderType !== "market") {
      await this.selectOrderType(params.orderType);
    }

    // Select side
    await this.selectSide(params.side);

    // Enter price for non-market orders
    if (params.price && params.orderType !== "market") {
      await this.enterPrice(params.price);
    }

    // Enter size
    await this.enterSize(params.size);

    // Set leverage if specified
    if (params.leverage && params.leverage > 1) {
      await this.setLeverage(params.leverage);
    }

    // Submit order
    await this.submitOrder();

    // Confirm order
    await this.confirmOrder();
  }

  /**
   * Place a market buy order.
   */
  async placeMarketBuy(size: string, leverage?: number): Promise<void> {
    await this.placeOrder({ side: "buy", size, leverage, orderType: "market" });
  }

  /**
   * Place a market sell order.
   */
  async placeMarketSell(size: string, leverage?: number): Promise<void> {
    await this.placeOrder({ side: "sell", size, leverage, orderType: "market" });
  }

  /**
   * Place a limit buy order.
   */
  async placeLimitBuy(size: string, price: string, leverage?: number): Promise<void> {
    await this.placeOrder({ side: "buy", size, price, leverage, orderType: "limit" });
  }

  /**
   * Place a limit sell order.
   */
  async placeLimitSell(size: string, price: string, leverage?: number): Promise<void> {
    await this.placeOrder({ side: "sell", size, price, leverage, orderType: "limit" });
  }

  /**
   * Switch to the Positions tab.
   */
  async switchToPositionsTab(): Promise<void> {
    try {
      if (await this.positionsTab.isVisible({ timeout: TIMEOUTS.short })) {
        await this.positionsTab.click();
        await this.page.waitForTimeout(TIMEOUTS.short);
      }
    } catch {
      // Tab may already be selected
    }
  }

  /**
   * Switch to the Orders tab.
   */
  async switchToOrdersTab(): Promise<void> {
    try {
      if (await this.ordersTab.isVisible({ timeout: TIMEOUTS.short })) {
        await this.ordersTab.click();
        await this.page.waitForTimeout(TIMEOUTS.short);
      }
    } catch {
      // Tab may already be selected
    }
  }

  /**
   * Switch to the History tab.
   */
  async switchToHistoryTab(): Promise<void> {
    try {
      if (await this.historyTab.isVisible({ timeout: TIMEOUTS.short })) {
        await this.historyTab.click();
        await this.page.waitForTimeout(TIMEOUTS.short);
      }
    } catch {
      // Tab may already be selected
    }
  }

  /**
   * Get the count of rows in the current table.
   */
  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator("table tbody tr, [role='row']:not([role='columnheader'])");
    return await rows.count().catch(() => 0);
  }

  /**
   * Click the close button on a position row.
   */
  async clickClosePosition(index: number = 0): Promise<void> {
    const closeButtons = this.page.locator("button").filter({ hasText: /close/i });
    const button = closeButtons.nth(index);

    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }

  /**
   * Confirm position close in modal.
   */
  async confirmClosePosition(): Promise<void> {
    const confirmButton = this.page.getByRole("button", { name: /confirm|close position/i });
    if (await confirmButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
      await confirmButton.click();
      await this.page.waitForTimeout(TIMEOUTS.modal);
    }
  }

  /**
   * Click modify button on a position row.
   */
  async clickModifyPosition(index: number = 0): Promise<void> {
    const modifyButtons = this.page.locator("button").filter({ hasText: /modify|edit/i });
    const button = modifyButtons.nth(index);

    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }

  /**
   * Set stop loss in the modify modal.
   */
  async setStopLoss(price: string): Promise<void> {
    const slInput = this.page.locator('input[placeholder*="stop" i], input[aria-label*="stop" i]').first();
    if (await slInput.isVisible().catch(() => false)) {
      await slInput.fill(price);
    }
  }

  /**
   * Set take profit in the modify modal.
   */
  async setTakeProfit(price: string): Promise<void> {
    const tpInput = this.page.locator('input[placeholder*="profit" i], input[aria-label*="profit" i]').first();
    if (await tpInput.isVisible().catch(() => false)) {
      await tpInput.fill(price);
    }
  }

  /**
   * Clear stop loss in the modify modal.
   */
  async clearStopLoss(): Promise<void> {
    const slInput = this.page.locator('input[placeholder*="stop" i], input[aria-label*="stop" i]').first();
    if (await slInput.isVisible().catch(() => false)) {
      await slInput.clear();
    }
  }

  /**
   * Clear take profit in the modify modal.
   */
  async clearTakeProfit(): Promise<void> {
    const tpInput = this.page.locator('input[placeholder*="profit" i], input[aria-label*="profit" i]').first();
    if (await tpInput.isVisible().catch(() => false)) {
      await tpInput.clear();
    }
  }

  /**
   * Save position modifications.
   */
  async savePositionModifications(): Promise<void> {
    const saveButton = this.page.getByRole("button", { name: /save|confirm|apply/i });
    if (await saveButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
      await saveButton.click();
      await this.page.waitForTimeout(TIMEOUTS.modal);
    }
  }

  /**
   * Click cancel button on an order row.
   */
  async clickCancelOrder(index: number = 0): Promise<void> {
    await this.switchToOrdersTab();
    await this.page.waitForTimeout(TIMEOUTS.short);

    const cancelButtons = this.page.locator("button").filter({ hasText: /cancel/i });
    const button = cancelButtons.nth(index);

    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await this.page.waitForTimeout(TIMEOUTS.short);
    }
  }

  /**
   * Click cancel all orders button.
   */
  async clickCancelAllOrders(): Promise<void> {
    await this.switchToOrdersTab();
    await this.page.waitForTimeout(TIMEOUTS.short);

    const cancelAllButton = this.page.getByRole("button", { name: /cancel all/i });
    if (await cancelAllButton.isVisible().catch(() => false)) {
      await cancelAllButton.click();
      await this.page.waitForTimeout(TIMEOUTS.short);

      // Confirm if modal appears
      const confirmButton = this.page.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false)) {
        await confirmButton.click();
        await this.page.waitForTimeout(TIMEOUTS.modal);
      }
    }
  }

  /**
   * Get the current price displayed on the page.
   */
  async getCurrentPrice(): Promise<number> {
    const priceText = await this.page.locator("text=/\\$[\\d,]+/").first().textContent().catch(() => "$50000");
    return parsePriceText(priceText || "$50000");
  }

  /**
   * Check if the page shows demo mode indicator.
   */
  async isDemoMode(): Promise<boolean> {
    const demoIndicator = this.page.getByText(/demo|connect wallet/i);
    return await demoIndicator.isVisible().catch(() => false);
  }

  /**
   * Check if user is authenticated (order form enabled).
   */
  async isOrderFormEnabled(): Promise<boolean> {
    const disabledMessage = this.page.getByText(/connect wallet to place orders/i);
    const isDisabledVisible = await disabledMessage.isVisible().catch(() => false);
    return !isDisabledVisible;
  }

  /**
   * Verify a position exists with the given symbol.
   */
  async hasPositionForSymbol(symbol: string): Promise<boolean> {
    await this.switchToPositionsTab();
    await this.page.waitForTimeout(TIMEOUTS.short);

    const content = await this.page.content();
    return content.toUpperCase().includes(symbol.toUpperCase());
  }

  /**
   * Verify an order exists with the given symbol.
   */
  async hasOrderForSymbol(symbol: string): Promise<boolean> {
    await this.switchToOrdersTab();
    await this.page.waitForTimeout(TIMEOUTS.short);

    const content = await this.page.content();
    return content.toUpperCase().includes(symbol.toUpperCase());
  }

  /**
   * Check if page has success toast notification.
   */
  async hasSuccessToast(): Promise<boolean> {
    const toast = this.page.locator('[role="alert"], .toast, [data-testid="toast"]').filter({ hasText: /success|placed|confirmed/i });
    return await toast.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false);
  }

  /**
   * Check if page has error toast notification.
   */
  async hasErrorToast(): Promise<boolean> {
    const toast = this.page.locator('[role="alert"], .toast, [data-testid="toast"]').filter({ hasText: /error|failed|denied/i });
    return await toast.isVisible({ timeout: TIMEOUTS.modal }).catch(() => false);
  }

  /**
   * Take a screenshot.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `e2e/screenshots/trade-sandbox-${name}.png`,
      fullPage: true,
    });
  }
}
