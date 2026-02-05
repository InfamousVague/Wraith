/**
 * Portfolio Walkthrough Suite
 *
 * Tests portfolio page functionality:
 * - Summary metrics
 * - Equity curve
 * - Holdings list
 * - Recent trades
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { PortfolioPage } from '../pages/portfolio.page';
import { screenshotManager } from '../utils/screenshot';

export async function runPortfolioSuite(page: Page): Promise<SuiteResult> {
  const portfolio = new PortfolioPage(page);
  const result: SuiteResult = {
    name: 'Portfolio Walkthrough',
    steps: [],
    totalSteps: 0,
    passedSteps: 0,
    duration: 0,
    screenshots: [],
  };

  const startTime = Date.now();

  const recordStep = (
    id: string,
    description: string,
    passed: boolean,
    duration: number,
    screenshot?: string,
    validations?: ValidationResult[],
    error?: string
  ) => {
    result.steps.push({ id, description, passed, duration, screenshot, validations, error });
    result.totalSteps++;
    if (passed) result.passedSteps++;
  };

  try {
    // Step 4.1: Navigate to portfolio
    {
      const stepStart = Date.now();
      logger.stepStart('4.1', 'Navigate to portfolio');

      try {
        await portfolio.navigate();
        const screenshot = await screenshotManager.capture(page, '04-portfolio-load');
        logger.stepPass('4.1', Date.now() - stepStart);
        recordStep('4.1', 'Navigate to portfolio', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.1', errorMsg);
        recordStep('4.1', 'Navigate to portfolio', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.2: Verify summary metrics
    {
      const stepStart = Date.now();
      logger.stepStart('4.2', 'Verify summary metrics');

      try {
        const summary = await portfolio.getSummary();
        const screenshot = await screenshotManager.capture(page, '04-summary');

        if (summary) {
          logger.info(`Cash: $${summary.cashBalance.toLocaleString()}`);
          logger.info(`Margin: $${summary.marginUsed.toLocaleString()}`);
          logger.info(`P&L: $${summary.unrealizedPnl.toLocaleString()}`);
        }

        logger.stepPass('4.2', Date.now() - stepStart);
        recordStep('4.2', 'Verify summary metrics', summary !== null, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.2', errorMsg);
        recordStep('4.2', 'Verify summary metrics', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.3: Check cash balance
    {
      const stepStart = Date.now();
      logger.stepStart('4.3', 'Check cash balance');

      try {
        const cash = await portfolio.getCashBalance();
        const validation: ValidationResult = {
          field: 'Cash balance',
          uiValue: cash,
          apiValue: null,
          match: cash >= 0,
        };
        logger.validation(validation);
        logger.stepPass('4.3', Date.now() - stepStart, `$${cash.toLocaleString()}`);
        recordStep('4.3', 'Check cash balance', cash >= 0, Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.3', errorMsg);
        recordStep('4.3', 'Check cash balance', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.4: Check margin used
    {
      const stepStart = Date.now();
      logger.stepStart('4.4', 'Check margin used');

      try {
        const margin = await portfolio.getMarginUsed();
        const validation: ValidationResult = {
          field: 'Margin used',
          uiValue: margin,
          apiValue: null,
          match: margin >= 0,
        };
        logger.validation(validation);
        logger.stepPass('4.4', Date.now() - stepStart, `$${margin.toLocaleString()}`);
        recordStep('4.4', 'Check margin used', margin >= 0, Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.4', errorMsg);
        recordStep('4.4', 'Check margin used', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.5: Check unrealized P&L
    {
      const stepStart = Date.now();
      logger.stepStart('4.5', 'Check unrealized P&L');

      try {
        const pnl = await portfolio.getUnrealizedPnl();
        const validation: ValidationResult = {
          field: 'Unrealized P&L',
          uiValue: pnl,
          apiValue: null,
          match: !isNaN(pnl),
        };
        logger.validation(validation);
        logger.stepPass('4.5', Date.now() - stepStart, `$${pnl.toLocaleString()}`);
        recordStep('4.5', 'Check unrealized P&L', !isNaN(pnl), Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.5', errorMsg);
        recordStep('4.5', 'Check unrealized P&L', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.6: Check realized P&L
    {
      const stepStart = Date.now();
      logger.stepStart('4.6', 'Check realized P&L');

      try {
        const pnl = await portfolio.getRealizedPnl();
        const validation: ValidationResult = {
          field: 'Realized P&L',
          uiValue: pnl,
          apiValue: null,
          match: !isNaN(pnl),
        };
        logger.validation(validation);
        logger.stepPass('4.6', Date.now() - stepStart, `$${pnl.toLocaleString()}`);
        recordStep('4.6', 'Check realized P&L', !isNaN(pnl), Date.now() - stepStart, undefined, [validation]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.6', errorMsg);
        recordStep('4.6', 'Check realized P&L', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.7: Verify equity curve
    {
      const stepStart = Date.now();
      logger.stepStart('4.7', 'Verify equity curve');

      try {
        const chartVisible = await portfolio.isEquityCurveVisible();
        const screenshot = await screenshotManager.capture(page, '04-equity-curve');
        logger.stepPass('4.7', Date.now() - stepStart, chartVisible ? 'Chart visible' : 'No chart');
        recordStep('4.7', 'Verify equity curve', chartVisible, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.7', errorMsg);
        recordStep('4.7', 'Verify equity curve', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.8: Verify holdings list
    {
      const stepStart = Date.now();
      logger.stepStart('4.8', 'Verify holdings list');

      try {
        const hasHoldings = await portfolio.hasHoldings();
        const holdingsCount = await portfolio.getHoldingsCount();
        const screenshot = await screenshotManager.capture(page, '04-holdings');
        logger.stepPass('4.8', Date.now() - stepStart, hasHoldings ? `${holdingsCount} holdings` : 'No holdings');
        recordStep('4.8', 'Verify holdings list', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.8', errorMsg);
        recordStep('4.8', 'Verify holdings list', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.9: Check recent trades
    {
      const stepStart = Date.now();
      logger.stepStart('4.9', 'Check recent trades');

      try {
        const hasTrades = await portfolio.hasRecentTrades();
        const tradesCount = await portfolio.getRecentTradesCount();
        const screenshot = await screenshotManager.capture(page, '04-recent-trades');
        logger.stepPass('4.9', Date.now() - stepStart, hasTrades ? `${tradesCount} recent trades` : 'No recent trades');
        recordStep('4.9', 'Check recent trades', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.9', errorMsg);
        recordStep('4.9', 'Check recent trades', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 4.10: Validate portfolio against API
    {
      const stepStart = Date.now();
      logger.stepStart('4.10', 'Validate against API');

      try {
        const validations = await portfolio.validateSummary();
        for (const v of validations) {
          logger.validation(v);
        }
        const allPassed = validations.every(v => v.match);
        logger.stepPass('4.10', Date.now() - stepStart);
        recordStep('4.10', 'Validate against API', allPassed, Date.now() - stepStart, undefined, validations);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('4.10', errorMsg);
        recordStep('4.10', 'Validate against API', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
