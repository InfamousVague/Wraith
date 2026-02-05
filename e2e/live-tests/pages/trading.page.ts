/**
 * Trading Page Object
 *
 * Represents the trade sandbox with order form, positions, orders, and history.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger, apiValidator } from '../utils';
import { stepDelay, waitForAnimations, waitForLoadingComplete, waitForValueChange } from '../utils/wait';
import { ValidationResult } from '../config';

export interface OrderFormData {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PositionData {
  id?: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  leverage?: number;
}

export interface OrderData {
  id?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  status: string;
  quantity: number;
  price?: number;
}

export class TradingPage extends BasePage {
  protected readonly pageName = 'Trading';
  protected readonly pageUrl = '/trade';

  // Selectors - based on actual Wraith component structure
  private selectors = {
    // Order Form - based on OrderForm.tsx, SideToggle.tsx, OrderTypeSelector.tsx
    symbolHeader: 'text=BTC, text=ETH',  // Symbol shown in order form header
    sideToggleBuy: 'text=Buy / Long',
    sideToggleSell: 'text=Sell / Short',
    orderTypeDropdown: 'text=Order Type',  // Label for the dropdown
    orderTypeMarket: 'text=Market',
    orderTypeLimit: 'text=Limit',
    orderTypeStopLoss: 'text=Stop Loss',
    orderTypeTakeProfit: 'text=Take Profit',
    quantityInput: 'input[placeholder*="0.00"], input[type="number"]',
    priceInput: 'input',  // Limit price input appears after selecting limit order
    leverageSlider: 'input[type="range"]',
    leveragePresets: 'button:has-text("1x"), button:has-text("5x"), button:has-text("10x")',
    quickSizeButtons: 'button:has-text("25%"), button:has-text("50%"), button:has-text("75%"), button:has-text("100%")',
    // Submit button shows "Buy / Long BTC" or "Sell / Short BTC" based on side
    placeOrderButtonBuy: 'button:has-text("Buy / Long")',
    placeOrderButtonSell: 'button:has-text("Sell / Short")',

    // Confirmation Modal - based on OrderConfirmModal.tsx
    confirmModal: '[role="dialog"], text=Confirm Order',
    confirmModalTitle: 'text=Confirm Order',
    confirmButton: 'button:has-text("Confirm Order")',
    cancelButton: 'button:has-text("Cancel")',
    confirmModalDetails: 'text=Side, text=Size, text=Leverage',

    // Trade Receipt Modal
    receiptModal: 'text=Trade Receipt, text=Order Filled',
    receiptClose: 'button:has-text("Close"), button:has-text("Done")',

    // Position Close Modal - ClosePositionModal.tsx
    closePositionModal: 'text=Close Position',
    confirmClosePosition: 'button:has-text("Close Position"), button:has-text("Confirm")',

    // Tabs - SegmentedControl in TradeSandbox.tsx
    tabPositions: 'button:has-text("Positions")',
    tabOrders: 'button:has-text("Orders")',
    tabHistory: 'button:has-text("History")',

    // Position Row - based on PositionsTable.tsx
    positionRow: 'text=LONG, text=SHORT',  // Rows contain side badge
    positionTable: 'text=Symbol >> xpath=ancestor::*[contains(@style, "flex")]',
    positionSymbol: 'text=BTC, text=ETH',  // Symbol in position row
    positionSide: 'text=LONG, text=SHORT',
    positionCloseButton: 'button:has-text("Close")',
    positionModifyButton: 'button:has-text("Modify")',
    noPositions: 'text=No open positions',

    // Order Row - OrdersTable.tsx
    orderRow: 'text=Pending, text=Open',
    orderCancelButton: 'button:has-text("Cancel")',
    cancelAllOrders: 'button:has-text("Cancel All")',
    noOrders: 'text=No open orders, text=No pending orders',

    // Order Book - AggregatedOrderBook
    orderBook: 'text=Order Book',
    bidRow: '[style*="background"][style*="green"], [style*="rgb(16, 185, 129)"]',
    askRow: '[style*="background"][style*="red"], [style*="rgb(239, 68, 68)"]',
    spread: 'text=Spread',

    // Chart
    chart: 'canvas',

    // Drawdown Warning
    drawdownWarning: 'text=Drawdown Warning, text=Trading Stopped',
    drawdownBypass: 'button:has-text("Bypass"), button:has-text("Trade Anyway")',
    drawdownReset: 'button:has-text("Reset Portfolio")',

    // Loading / Empty States
    loading: 'text=Loading, [class*="skeleton"]',
  };

  constructor(page: Page) {
    super(page);
  }

  // ========== Order Form Actions ==========

  /**
   * Navigate to trading page for a specific symbol
   */
  async navigateToSymbol(symbol: string): Promise<void> {
    await this.page.goto(`/trade/${symbol.toLowerCase()}`);
    await this.waitForReady();
    await stepDelay();
  }

  /**
   * Set order side (buy/sell)
   */
  async setSide(side: 'buy' | 'sell'): Promise<void> {
    if (side === 'buy') {
      await this.page.getByText('Buy / Long').click();
    } else {
      await this.page.getByText('Sell / Short').click();
    }
    await waitForAnimations();
    await stepDelay();
  }

  /**
   * Set order type using the Select dropdown
   */
  async setOrderType(type: 'market' | 'limit' | 'stop' | 'stop_limit'): Promise<void> {
    // Click on the order type dropdown
    const orderTypeLabels: Record<string, string> = {
      market: 'Market',
      limit: 'Limit',
      stop: 'Stop Loss',
      stop_limit: 'Take Profit',
    };

    // Find and click the Select component
    const selectButton = this.page.locator('button').filter({ hasText: /Market|Limit|Stop Loss|Take Profit/ }).first();
    await selectButton.click();
    await stepDelay();

    // Select the option
    await this.page.getByText(orderTypeLabels[type], { exact: true }).click();
    await waitForAnimations();
    await stepDelay();
  }

  /**
   * Enter quantity in the size input
   */
  async setQuantity(quantity: number): Promise<void> {
    // Find the size input - it's in the SizeInput component
    const sizeInput = this.page.locator('input[type="text"], input[type="number"]').filter({ hasText: '' }).first();
    await sizeInput.fill(String(quantity));
    await stepDelay();
  }

  /**
   * Enter price (for limit orders)
   */
  async setPrice(price: number): Promise<void> {
    // Price input appears after selecting limit order type
    const priceInputs = this.page.locator('input').filter({ hasText: '' });
    // The price input is typically the second one after size
    const priceInput = priceInputs.nth(1);
    if (await priceInput.isVisible()) {
      await priceInput.fill(String(price));
      await stepDelay();
    }
  }

  /**
   * Set leverage using slider or preset buttons
   */
  async setLeverage(leverage: number): Promise<void> {
    try {
      // Try preset buttons first (1x, 5x, 10x, etc.)
      const presetButton = this.page.getByRole('button', { name: `${leverage}x` });
      if (await presetButton.isVisible()) {
        await presetButton.click();
        await waitForAnimations();
        await stepDelay();
        return;
      }

      // Fall back to slider
      const slider = this.page.locator('input[type="range"]');
      if (await slider.isVisible()) {
        await slider.fill(String(leverage));
        await waitForAnimations();
        await stepDelay();
      }
    } catch {
      logger.verbose('Leverage control not available');
    }
  }

  /**
   * Use quick size buttons (25%, 50%, 75%, 100%)
   */
  async useQuickSize(percent: 25 | 50 | 75 | 100): Promise<void> {
    await this.page.getByRole('button', { name: `${percent}%` }).click();
    await stepDelay();
  }

  /**
   * Fill complete order form
   */
  async fillOrderForm(order: OrderFormData): Promise<void> {
    // Navigate to the symbol if needed
    const currentUrl = this.page.url();
    if (!currentUrl.includes(`/trade/${order.symbol.toLowerCase()}`)) {
      await this.navigateToSymbol(order.symbol);
    }

    await this.setSide(order.side);
    await this.setOrderType(order.type);
    await this.setQuantity(order.quantity);

    if (order.price && order.type !== 'market') {
      await this.setPrice(order.price);
    }

    if (order.leverage) {
      await this.setLeverage(order.leverage);
    }

    // SL/TP are typically set in a modify flow, not initial order
  }

  /**
   * Click place order button (Buy / Long or Sell / Short)
   */
  async clickPlaceOrder(side: 'buy' | 'sell' = 'buy'): Promise<void> {
    if (side === 'buy') {
      await this.page.getByRole('button', { name: /Buy \/ Long/i }).click();
    } else {
      await this.page.getByRole('button', { name: /Sell \/ Short/i }).click();
    }
    await stepDelay();
  }

  /**
   * Check if confirm modal is visible
   */
  async isConfirmModalVisible(): Promise<boolean> {
    return this.page.getByText('Confirm Order').isVisible().catch(() => false);
  }

  /**
   * Click confirm in modal
   */
  async confirmOrder(): Promise<void> {
    await this.page.getByRole('button', { name: /Confirm Order/i }).click();
    await waitForLoadingComplete(this.page);
    await stepDelay();
  }

  /**
   * Click cancel in modal
   */
  async cancelOrderModal(): Promise<void> {
    await this.page.getByRole('button', { name: /Cancel/i }).first().click();
    await stepDelay();
  }

  /**
   * Check if trade receipt is visible
   */
  async isReceiptVisible(): Promise<boolean> {
    const hasReceipt = await this.page.getByText('Trade Receipt').isVisible().catch(() => false);
    const hasOrderFilled = await this.page.getByText('Order Filled').isVisible().catch(() => false);
    return hasReceipt || hasOrderFilled;
  }

  /**
   * Close trade receipt
   */
  async closeReceipt(): Promise<void> {
    const closeBtn = this.page.getByRole('button', { name: /Close|Done/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await stepDelay();
    }
  }

  /**
   * Place complete order (fill form, submit, confirm)
   */
  async placeOrder(order: OrderFormData): Promise<void> {
    await this.fillOrderForm(order);
    await this.clickPlaceOrder(order.side);

    // Wait for and handle confirm modal if it appears
    await this.page.waitForTimeout(500);  // Brief wait for modal animation
    if (await this.isConfirmModalVisible()) {
      await this.confirmOrder();
    }

    await waitForLoadingComplete(this.page);

    // Close receipt if shown
    if (await this.isReceiptVisible()) {
      await this.closeReceipt();
    }
  }

  // ========== Tab Navigation ==========

  /**
   * Click positions tab
   */
  async goToPositions(): Promise<void> {
    await this.click(this.selectors.tabPositions, 'Positions tab');
    await waitForLoadingComplete(this.page);
  }

  /**
   * Click orders tab
   */
  async goToOrders(): Promise<void> {
    await this.click(this.selectors.tabOrders, 'Orders tab');
    await waitForLoadingComplete(this.page);
  }

  /**
   * Click history tab
   */
  async goToHistory(): Promise<void> {
    await this.click(this.selectors.tabHistory, 'History tab');
    await waitForLoadingComplete(this.page);
  }

  // ========== Position Actions ==========

  /**
   * Get count of open positions
   */
  async getPositionCount(): Promise<number> {
    await this.goToPositions();
    return this.count(this.selectors.positionRow);
  }

  /**
   * Get position data by index
   */
  async getPositionData(index: number = 0): Promise<PositionData | null> {
    try {
      const row = this.page.locator(this.selectors.positionRow).nth(index);

      const symbol = await row.locator(this.selectors.positionSymbol).textContent().catch(() => null);
      const sideText = await row.locator(this.selectors.positionSide).textContent().catch(() => null);
      const sizeText = await row.locator(this.selectors.positionSize).textContent().catch(() => null);
      const entryText = await row.locator(this.selectors.positionEntry).textContent().catch(() => null);
      const pnlText = await row.locator(this.selectors.positionPnl).textContent().catch(() => null);
      const leverageText = await row.locator(this.selectors.positionLeverage).textContent().catch(() => null);

      if (!symbol || !sizeText || !entryText) {
        return null;
      }

      return {
        symbol: symbol.trim(),
        side: sideText?.toLowerCase().includes('long') ? 'long' : 'short',
        size: parseFloat(sizeText.replace(/[^0-9.-]/g, '')),
        entryPrice: this.parsePrice(entryText),
        pnl: pnlText ? this.parsePrice(pnlText) : undefined,
        leverage: leverageText ? parseInt(leverageText.replace(/[^0-9]/g, '')) : undefined,
      };
    } catch (error) {
      logger.warn(`Failed to get position data: ${error}`);
      return null;
    }
  }

  /**
   * Click close button on first position
   */
  async clickClosePosition(index: number = 0): Promise<void> {
    const row = this.page.locator(this.selectors.positionRow).nth(index);
    await row.locator(this.selectors.positionCloseButton).click();
    await stepDelay();
  }

  /**
   * Confirm position close
   */
  async confirmClosePosition(): Promise<void> {
    if (await this.isVisible(this.selectors.closePositionModal)) {
      await this.click(this.selectors.confirmClosePosition, 'Confirm Close Position');
    }
    await waitForLoadingComplete(this.page);
  }

  /**
   * Close position completely (click close, confirm)
   */
  async closePosition(index: number = 0): Promise<void> {
    await this.clickClosePosition(index);
    await this.confirmClosePosition();
  }

  /**
   * Watch P&L change on position
   */
  async watchPnlChange(index: number = 0, durationMs: number = 5000): Promise<{ initial: string; final: string }> {
    const row = this.page.locator(this.selectors.positionRow).nth(index);
    const pnlElement = row.locator(this.selectors.positionPnl);

    const initialPnl = await pnlElement.textContent() ?? '';

    // Wait and check for change
    await new Promise(resolve => setTimeout(resolve, durationMs));

    const finalPnl = await pnlElement.textContent() ?? '';

    return { initial: initialPnl, final: finalPnl };
  }

  // ========== Order Actions ==========

  /**
   * Get count of open orders
   */
  async getOrderCount(): Promise<number> {
    await this.goToOrders();
    return this.count(this.selectors.orderRow);
  }

  /**
   * Get order data by index
   */
  async getOrderData(index: number = 0): Promise<OrderData | null> {
    try {
      const row = this.page.locator(this.selectors.orderRow).nth(index);

      const symbol = await row.locator(this.selectors.orderSymbol).textContent().catch(() => null);
      const sideText = await row.locator(this.selectors.orderSide).textContent().catch(() => null);
      const typeText = await row.locator(this.selectors.orderType).textContent().catch(() => null);
      const statusText = await row.locator(this.selectors.orderStatus).textContent().catch(() => null);
      const quantityText = await row.locator(this.selectors.orderQuantity).textContent().catch(() => null);
      const priceText = await row.locator(this.selectors.orderPrice).textContent().catch(() => null);

      if (!symbol || !statusText) {
        return null;
      }

      return {
        symbol: symbol.trim(),
        side: sideText?.toLowerCase().includes('buy') ? 'buy' : 'sell',
        type: typeText?.toLowerCase() ?? 'unknown',
        status: statusText.toLowerCase(),
        quantity: quantityText ? parseFloat(quantityText.replace(/[^0-9.-]/g, '')) : 0,
        price: priceText ? this.parsePrice(priceText) : undefined,
      };
    } catch (error) {
      logger.warn(`Failed to get order data: ${error}`);
      return null;
    }
  }

  /**
   * Cancel order by index
   */
  async cancelOrder(index: number = 0): Promise<void> {
    const row = this.page.locator(this.selectors.orderRow).nth(index);
    await row.locator(this.selectors.orderCancelButton).click();
    await stepDelay();

    // Handle confirm if needed
    const confirmVisible = await this.isVisible('[data-testid="confirm-cancel"]');
    if (confirmVisible) {
      await this.click('[data-testid="confirm-cancel"]', 'Confirm Cancel');
    }

    await waitForLoadingComplete(this.page);
  }

  // ========== Order Book ==========

  /**
   * Check if order book is visible
   */
  async isOrderBookVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.orderBook);
  }

  /**
   * Get bid count
   */
  async getBidCount(): Promise<number> {
    return this.count(this.selectors.bidRow);
  }

  /**
   * Get ask count
   */
  async getAskCount(): Promise<number> {
    return this.count(this.selectors.askRow);
  }

  // ========== Chart ==========

  /**
   * Check if chart is visible
   */
  async isChartVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.chart);
  }

  // ========== Validation ==========

  /**
   * Validate position against API
   */
  async validatePosition(index: number = 0): Promise<ValidationResult[]> {
    const position = await this.getPositionData(index);
    if (!position || !position.id) {
      return [{
        field: 'Position',
        uiValue: position,
        apiValue: null,
        match: false,
        error: 'Position not found or missing ID',
      }];
    }

    return apiValidator.validatePosition(position.id, position);
  }
}
