/**
 * Asset Detail Page Object
 *
 * Represents the asset detail page with charts, signals, and predictions.
 */

import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { logger, apiValidator } from '../utils';
import { stepDelay, waitForAnimations, waitForLoadingComplete } from '../utils/wait';
import { ValidationResult } from '../config';

export interface SignalData {
  compositeScore: number;
  direction: string;
  rsi?: number;
  macd?: number;
  trend?: number;
  momentum?: number;
  volatility?: number;
  volume?: number;
}

export class AssetDetailPage extends BasePage {
  protected readonly pageName = 'Asset Detail';
  protected readonly pageUrl = '/asset';
  private currentSymbol: string = '';

  // Selectors
  private selectors = {
    priceDisplay: '[data-testid="asset-price"], [class*="price-display"], .current-price',
    priceChange: '[data-testid="price-change"], [class*="change"]',
    chartCanvas: 'canvas, [data-testid="chart"]',
    timeframe1H: '[data-testid="tf-1h"], button:has-text("1H")',
    timeframe1D: '[data-testid="tf-1d"], button:has-text("1D")',
    timeframe1W: '[data-testid="tf-1w"], button:has-text("1W")',
    timeframe1M: '[data-testid="tf-1m"], button:has-text("1M")',
    signalScore: '[data-testid="signal-score"], [class*="signal-score"]',
    signalDirection: '[data-testid="signal-direction"], [class*="direction"]',
    indicatorRSI: '[data-testid="indicator-rsi"], [class*="rsi"]',
    indicatorMACD: '[data-testid="indicator-macd"], [class*="macd"]',
    trendScore: '[data-testid="trend-score"], [class*="trend"]',
    momentumScore: '[data-testid="momentum-score"], [class*="momentum"]',
    volatilityScore: '[data-testid="volatility-score"], [class*="volatility"]',
    volumeScore: '[data-testid="volume-score"], [class*="volume-score"]',
    generatePredictions: '[data-testid="generate-predictions"], button:has-text("Generate")',
    predictionAccuracy: '[data-testid="prediction-accuracy"], [class*="accuracy"]',
    tradeButton: '[data-testid="trade-button"], button:has-text("Trade")',
    backButton: '[data-testid="back-button"], [aria-label="back"], .back-button',
    loading: '[data-testid="loading"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to specific asset detail
   */
  async navigateToAsset(symbol: string): Promise<void> {
    this.currentSymbol = symbol;
    await this.page.goto(`/asset/${symbol}`);
    await this.waitForReady();
    await stepDelay();
  }

  /**
   * Get current displayed price
   */
  async getPrice(): Promise<number> {
    const priceText = await this.getText(this.selectors.priceDisplay);
    return this.parsePrice(priceText);
  }

  /**
   * Get 24h price change
   */
  async getPriceChange(): Promise<number> {
    const changeText = await this.getText(this.selectors.priceChange);
    return this.parsePercent(changeText);
  }

  /**
   * Validate price against API
   */
  async validatePrice(): Promise<ValidationResult> {
    const uiPrice = await this.getPrice();
    return apiValidator.validateAssetPrice(this.currentSymbol, uiPrice);
  }

  /**
   * Validate 24h change against API
   */
  async validatePriceChange(): Promise<ValidationResult> {
    const uiChange = await this.getPriceChange();
    return apiValidator.validateAsset24hChange(this.currentSymbol, uiChange);
  }

  /**
   * Check if chart is rendered
   */
  async isChartVisible(): Promise<boolean> {
    return this.isVisible(this.selectors.chartCanvas);
  }

  /**
   * Change chart timeframe
   */
  async changeTimeframe(timeframe: '1H' | '1D' | '1W' | '1M'): Promise<void> {
    const selectorMap = {
      '1H': this.selectors.timeframe1H,
      '1D': this.selectors.timeframe1D,
      '1W': this.selectors.timeframe1W,
      '1M': this.selectors.timeframe1M,
    };

    try {
      await this.click(selectorMap[timeframe], `Timeframe: ${timeframe}`);
    } catch {
      // Try by text
      await this.page.getByRole('button', { name: timeframe }).click();
      await stepDelay();
    }

    await waitForLoadingComplete(this.page);
    await waitForAnimations();
  }

  /**
   * Get signal score
   */
  async getSignalScore(): Promise<number | null> {
    try {
      const scoreText = await this.getText(this.selectors.signalScore);
      return parseFloat(scoreText);
    } catch {
      logger.verbose('Signal score not found');
      return null;
    }
  }

  /**
   * Get signal direction
   */
  async getSignalDirection(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.signalDirection);
    } catch {
      return null;
    }
  }

  /**
   * Get all signal data
   */
  async getSignalData(): Promise<SignalData | null> {
    try {
      const compositeScore = await this.getSignalScore();
      if (compositeScore === null) return null;

      return {
        compositeScore,
        direction: await this.getSignalDirection() ?? 'unknown',
        rsi: await this.getIndicatorValue('rsi'),
        macd: await this.getIndicatorValue('macd'),
        trend: await this.getIndicatorValue('trend'),
        momentum: await this.getIndicatorValue('momentum'),
        volatility: await this.getIndicatorValue('volatility'),
        volume: await this.getIndicatorValue('volume'),
      };
    } catch (error) {
      logger.warn(`Failed to get signal data: ${error}`);
      return null;
    }
  }

  /**
   * Get specific indicator value
   */
  private async getIndicatorValue(indicator: string): Promise<number | undefined> {
    try {
      const selectorMap: Record<string, string> = {
        rsi: this.selectors.indicatorRSI,
        macd: this.selectors.indicatorMACD,
        trend: this.selectors.trendScore,
        momentum: this.selectors.momentumScore,
        volatility: this.selectors.volatilityScore,
        volume: this.selectors.volumeScore,
      };

      const text = await this.getText(selectorMap[indicator]);
      return parseFloat(text);
    } catch {
      return undefined;
    }
  }

  /**
   * Validate signal score against API
   */
  async validateSignalScore(): Promise<ValidationResult> {
    const uiScore = await this.getSignalScore();
    if (uiScore === null) {
      return {
        field: `${this.currentSymbol} signal score`,
        uiValue: null,
        apiValue: null,
        match: false,
        error: 'Signal score not found in UI',
      };
    }
    return apiValidator.validateSignalScore(this.currentSymbol, uiScore);
  }

  /**
   * Click generate predictions button
   */
  async generatePredictions(): Promise<void> {
    await this.click(this.selectors.generatePredictions, 'Generate Predictions');
    await waitForLoadingComplete(this.page);
  }

  /**
   * Get prediction accuracy
   */
  async getPredictionAccuracy(): Promise<number | null> {
    try {
      const text = await this.getText(this.selectors.predictionAccuracy);
      return this.parsePercent(text);
    } catch {
      return null;
    }
  }

  /**
   * Click trade button to navigate to trading
   */
  async clickTrade(): Promise<void> {
    await this.click(this.selectors.tradeButton, 'Trade');
  }

  /**
   * Click back button
   */
  async goBack(): Promise<void> {
    try {
      await this.click(this.selectors.backButton, 'Back');
    } catch {
      await this.page.goBack();
      await stepDelay();
    }
  }

  /**
   * Run all validations for asset detail
   */
  async validateAll(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate price
    const priceResult = await this.validatePrice();
    results.push(priceResult);
    logger.validation(priceResult);

    // Validate change
    const changeResult = await this.validatePriceChange();
    results.push(changeResult);
    logger.validation(changeResult);

    // Validate signal if available
    const signalResult = await this.validateSignalScore();
    results.push(signalResult);
    logger.validation(signalResult);

    return results;
  }
}
