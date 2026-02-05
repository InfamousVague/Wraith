/**
 * Portfolio Page Object
 *
 * Represents the portfolio page with balances, holdings, and equity curve.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger, apiValidator } from '../utils';
import { stepDelay, waitForLoadingComplete } from '../utils/wait';
import { ValidationResult } from '../config';

export interface PortfolioSummary {
  cashBalance: number;
  marginUsed: number;
  equity: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalValue: number;
}

export interface HoldingData {
  symbol: string;
  quantity: number;
  value: number;
  pnl?: number;
  allocation?: number;
}

export class PortfolioPage extends BasePage {
  protected readonly pageName = 'Portfolio';
  protected readonly pageUrl = '/portfolio';

  // Selectors
  private selectors = {
    // Summary Metrics
    cashBalance: '[data-testid="cash-balance"], [class*="cash-balance"]',
    marginUsed: '[data-testid="margin-used"], [class*="margin-used"]',
    equity: '[data-testid="equity"], [class*="equity"]',
    unrealizedPnl: '[data-testid="unrealized-pnl"], [class*="unrealized"]',
    realizedPnl: '[data-testid="realized-pnl"], [class*="realized"]',
    totalValue: '[data-testid="total-value"], [class*="total-value"]',

    // Equity Curve
    equityCurve: '[data-testid="equity-curve"], canvas, [class*="equity-chart"]',

    // Holdings
    holdingsList: '[data-testid="holdings-list"], [class*="holdings"]',
    holdingRow: '[data-testid="holding-row"], [class*="holding-item"]',
    holdingSymbol: '[data-testid="holding-symbol"]',
    holdingQuantity: '[data-testid="holding-quantity"]',
    holdingValue: '[data-testid="holding-value"]',
    holdingPnl: '[data-testid="holding-pnl"]',
    holdingAllocation: '[data-testid="holding-allocation"]',

    // Recent Trades
    recentTradesList: '[data-testid="recent-trades"], [class*="recent-trades"]',
    tradeRow: '[data-testid="trade-row"], [class*="trade-item"]',
    tradeSymbol: '[data-testid="trade-symbol"]',
    tradeSide: '[data-testid="trade-side"]',
    tradeQuantity: '[data-testid="trade-quantity"]',
    tradePrice: '[data-testid="trade-price"]',
    tradePnl: '[data-testid="trade-pnl"]',
    tradeTime: '[data-testid="trade-time"]',

    // Empty States
    noHoldings: '[data-testid="no-holdings"], [class*="empty"]',
    noTrades: '[data-testid="no-trades"]',

    // Loading
    loading: '[data-testid="loading"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get portfolio summary data
   */
  async getSummary(): Promise<PortfolioSummary | null> {
    try {
      const cashText = await this.getText(this.selectors.cashBalance).catch(() => null);
      const marginText = await this.getText(this.selectors.marginUsed).catch(() => null);
      const equityText = await this.getText(this.selectors.equity).catch(() => null);
      const unrealizedText = await this.getText(this.selectors.unrealizedPnl).catch(() => null);
      const realizedText = await this.getText(this.selectors.realizedPnl).catch(() => null);
      const totalText = await this.getText(this.selectors.totalValue).catch(() => null);

      return {
        cashBalance: cashText ? this.parsePrice(cashText) : 0,
        marginUsed: marginText ? this.parsePrice(marginText) : 0,
        equity: equityText ? this.parsePrice(equityText) : 0,
        unrealizedPnl: unrealizedText ? this.parsePrice(unrealizedText) : 0,
        realizedPnl: realizedText ? this.parsePrice(realizedText) : 0,
        totalValue: totalText ? this.parsePrice(totalText) : 0,
      };
    } catch (error) {
      logger.warn(`Failed to get portfolio summary: ${error}`);
      return null;
    }
  }

  /**
   * Get cash balance
   */
  async getCashBalance(): Promise<number> {
    const text = await this.getText(this.selectors.cashBalance);
    return this.parsePrice(text);
  }

  /**
   * Get margin used
   */
  async getMarginUsed(): Promise<number> {
    const text = await this.getText(this.selectors.marginUsed);
    return this.parsePrice(text);
  }

  /**
   * Get unrealized P&L
   */
  async getUnrealizedPnl(): Promise<number> {
    const text = await this.getText(this.selectors.unrealizedPnl);
    return this.parsePrice(text);
  }

  /**
   * Get realized P&L
   */
  async getRealizedPnl(): Promise<number> {
    const text = await this.getText(this.selectors.realizedPnl);
    return this.parsePrice(text);
  }

  /**
   * Check if equity curve is visible
   */
  async isEquityCurveVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.equityCurve);
  }

  /**
   * Get holdings count
   */
  async getHoldingsCount(): Promise<number> {
    return this.count(this.selectors.holdingRow);
  }

  /**
   * Get holding data by index
   */
  async getHoldingData(index: number = 0): Promise<HoldingData | null> {
    try {
      const row = this.page.locator(this.selectors.holdingRow).nth(index);

      const symbol = await row.locator(this.selectors.holdingSymbol).textContent().catch(() => null);
      const quantityText = await row.locator(this.selectors.holdingQuantity).textContent().catch(() => null);
      const valueText = await row.locator(this.selectors.holdingValue).textContent().catch(() => null);
      const pnlText = await row.locator(this.selectors.holdingPnl).textContent().catch(() => null);
      const allocationText = await row.locator(this.selectors.holdingAllocation).textContent().catch(() => null);

      if (!symbol) {
        return null;
      }

      return {
        symbol: symbol.trim(),
        quantity: quantityText ? parseFloat(quantityText.replace(/[^0-9.-]/g, '')) : 0,
        value: valueText ? this.parsePrice(valueText) : 0,
        pnl: pnlText ? this.parsePrice(pnlText) : undefined,
        allocation: allocationText ? this.parsePercent(allocationText) : undefined,
      };
    } catch (error) {
      logger.warn(`Failed to get holding data: ${error}`);
      return null;
    }
  }

  /**
   * Get all holdings
   */
  async getAllHoldings(): Promise<HoldingData[]> {
    const holdings: HoldingData[] = [];
    const count = await this.getHoldingsCount();

    for (let i = 0; i < count; i++) {
      const holding = await this.getHoldingData(i);
      if (holding) {
        holdings.push(holding);
      }
    }

    return holdings;
  }

  /**
   * Click on a holding to navigate to asset
   */
  async clickHolding(index: number = 0): Promise<void> {
    const row = this.page.locator(this.selectors.holdingRow).nth(index);
    await row.click();
    await stepDelay();
  }

  /**
   * Get recent trades count
   */
  async getRecentTradesCount(): Promise<number> {
    return this.count(this.selectors.tradeRow);
  }

  /**
   * Validate portfolio summary against API
   */
  async validateSummary(): Promise<ValidationResult[]> {
    const summary = await this.getSummary();
    if (!summary) {
      return [{
        field: 'Portfolio summary',
        uiValue: null,
        apiValue: null,
        match: false,
        error: 'Could not get portfolio summary from UI',
      }];
    }

    return apiValidator.validatePortfolio({
      cashBalance: summary.cashBalance,
      marginUsed: summary.marginUsed,
      unrealizedPnl: summary.unrealizedPnl,
    });
  }

  /**
   * Check if portfolio has holdings
   */
  async hasHoldings(): Promise<boolean> {
    const noHoldingsVisible = await this.isVisible(this.selectors.noHoldings);
    if (noHoldingsVisible) return false;

    const count = await this.getHoldingsCount();
    return count > 0;
  }

  /**
   * Check if portfolio has recent trades
   */
  async hasRecentTrades(): Promise<boolean> {
    const noTradesVisible = await this.isVisible(this.selectors.noTrades);
    if (noTradesVisible) return false;

    const count = await this.getRecentTradesCount();
    return count > 0;
  }
}
