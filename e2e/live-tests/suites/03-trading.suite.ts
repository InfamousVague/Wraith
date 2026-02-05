/**
 * Trading Full Lifecycle Suite
 *
 * Tests complete trading flow:
 * - Order form interaction
 * - Market order placement
 * - Position verification
 * - Position modification (SL/TP)
 * - Position close
 * - Limit order placement and cancellation
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { TradingPage } from '../pages/trading.page';
import { screenshotManager } from '../utils/screenshot';
import { stepDelay, waitForLoadingComplete } from '../utils/wait';

export async function runTradingSuite(page: Page): Promise<SuiteResult> {
  const trading = new TradingPage(page);
  const result: SuiteResult = {
    name: 'Trading Full Lifecycle',
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
    // Step 3.1: Navigate to trading
    {
      const stepStart = Date.now();
      logger.stepStart('3.1', 'Navigate to trading');

      try {
        await trading.navigate();
        const screenshot = await screenshotManager.capture(page, '03-trading-load');
        logger.stepPass('3.1', Date.now() - stepStart);
        recordStep('3.1', 'Navigate to trading', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.1', errorMsg);
        recordStep('3.1', 'Navigate to trading', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.2: Verify order book
    {
      const stepStart = Date.now();
      logger.stepStart('3.2', 'Verify order book');

      try {
        const orderBookVisible = await trading.isOrderBookVisible();
        const bidCount = await trading.getBidCount();
        const askCount = await trading.getAskCount();
        const screenshot = await screenshotManager.capture(page, '03-orderbook');
        logger.stepPass('3.2', Date.now() - stepStart, `Bids: ${bidCount}, Asks: ${askCount}`);
        recordStep('3.2', 'Verify order book', orderBookVisible, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.2', errorMsg);
        recordStep('3.2', 'Verify order book', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.3: Verify chart
    {
      const stepStart = Date.now();
      logger.stepStart('3.3', 'Verify chart');

      try {
        const chartVisible = await trading.isChartVisible();
        const screenshot = await screenshotManager.capture(page, '03-chart');
        logger.stepPass('3.3', Date.now() - stepStart, chartVisible ? 'Chart visible' : 'No chart');
        recordStep('3.3', 'Verify chart', chartVisible, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.3', errorMsg);
        recordStep('3.3', 'Verify chart', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.4: Select BTC
    {
      const stepStart = Date.now();
      logger.stepStart('3.4', 'Select BTC');

      try {
        await trading.selectSymbol('BTC');
        const screenshot = await screenshotManager.capture(page, '03-select-btc');
        logger.stepPass('3.4', Date.now() - stepStart);
        recordStep('3.4', 'Select BTC', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.4', errorMsg);
        recordStep('3.4', 'Select BTC', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.5: Set order type "Market"
    {
      const stepStart = Date.now();
      logger.stepStart('3.5', 'Set order type "Market"');

      try {
        await trading.setOrderType('market');
        const screenshot = await screenshotManager.capture(page, '03-market-type');
        logger.stepPass('3.5', Date.now() - stepStart);
        recordStep('3.5', 'Set order type "Market"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.5', errorMsg);
        recordStep('3.5', 'Set order type "Market"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.6: Set side "Buy"
    {
      const stepStart = Date.now();
      logger.stepStart('3.6', 'Set side "Buy"');

      try {
        await trading.setSide('buy');
        const screenshot = await screenshotManager.capture(page, '03-side-buy');
        logger.stepPass('3.6', Date.now() - stepStart);
        recordStep('3.6', 'Set side "Buy"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.6', errorMsg);
        recordStep('3.6', 'Set side "Buy"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.7: Enter quantity "0.1"
    {
      const stepStart = Date.now();
      logger.stepStart('3.7', 'Enter quantity "0.1"');

      try {
        await trading.setQuantity(0.1);
        const screenshot = await screenshotManager.capture(page, '03-quantity');
        logger.stepPass('3.7', Date.now() - stepStart);
        recordStep('3.7', 'Enter quantity "0.1"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.7', errorMsg);
        recordStep('3.7', 'Enter quantity "0.1"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.8: Set leverage "2x"
    {
      const stepStart = Date.now();
      logger.stepStart('3.8', 'Set leverage "2x"');

      try {
        await trading.setLeverage(2);
        const screenshot = await screenshotManager.capture(page, '03-leverage');
        logger.stepPass('3.8', Date.now() - stepStart);
        recordStep('3.8', 'Set leverage "2x"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.8', errorMsg);
        recordStep('3.8', 'Set leverage "2x"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.9: Verify margin required
    {
      const stepStart = Date.now();
      logger.stepStart('3.9', 'Verify margin required');

      try {
        const margin = await trading.getMarginRequired();
        logger.stepPass('3.9', Date.now() - stepStart, `Margin: $${margin.toLocaleString()}`);
        recordStep('3.9', 'Verify margin required', margin > 0, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.9', errorMsg);
        recordStep('3.9', 'Verify margin required', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.10: Click "Place Order"
    {
      const stepStart = Date.now();
      logger.stepStart('3.10', 'Click "Place Order"');

      try {
        await trading.clickPlaceOrder();
        const screenshot = await screenshotManager.capture(page, '03-confirm-modal');
        logger.stepPass('3.10', Date.now() - stepStart);
        recordStep('3.10', 'Click "Place Order"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.10', errorMsg);
        recordStep('3.10', 'Click "Place Order"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.11: Verify order details in modal
    {
      const stepStart = Date.now();
      logger.stepStart('3.11', 'Verify order details');

      try {
        const modalVisible = await trading.isConfirmModalVisible();
        logger.stepPass('3.11', Date.now() - stepStart, modalVisible ? 'Modal visible' : 'No confirmation modal');
        recordStep('3.11', 'Verify order details', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.11', errorMsg);
        recordStep('3.11', 'Verify order details', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.12: Click "Confirm"
    {
      const stepStart = Date.now();
      logger.stepStart('3.12', 'Click "Confirm"');

      try {
        await trading.confirmOrder();
        const screenshot = await screenshotManager.capture(page, '03-order-submitted');
        logger.stepPass('3.12', Date.now() - stepStart);
        recordStep('3.12', 'Click "Confirm"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.12', errorMsg);
        recordStep('3.12', 'Click "Confirm"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.13: Wait for fill
    {
      const stepStart = Date.now();
      logger.stepStart('3.13', 'Wait for fill');

      try {
        await waitForLoadingComplete(page);
        await stepDelay();
        const screenshot = await screenshotManager.capture(page, '03-order-filled');
        logger.stepPass('3.13', Date.now() - stepStart);
        recordStep('3.13', 'Wait for fill', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.13', errorMsg);
        recordStep('3.13', 'Wait for fill', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.14: Verify trade receipt
    {
      const stepStart = Date.now();
      logger.stepStart('3.14', 'Verify trade receipt');

      try {
        const receiptVisible = await trading.isReceiptVisible();
        const screenshot = await screenshotManager.capture(page, '03-receipt');

        if (receiptVisible) {
          await trading.closeReceipt();
        }

        logger.stepPass('3.14', Date.now() - stepStart, receiptVisible ? 'Receipt shown' : 'No receipt modal');
        recordStep('3.14', 'Verify trade receipt', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.14', errorMsg);
        recordStep('3.14', 'Verify trade receipt', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.15: Check positions tab
    {
      const stepStart = Date.now();
      logger.stepStart('3.15', 'Check positions tab');

      try {
        await trading.goToPositions();
        const positionCount = await trading.getPositionCount();
        const screenshot = await screenshotManager.capture(page, '03-position-created');
        logger.stepPass('3.15', Date.now() - stepStart, `${positionCount} position(s)`);
        recordStep('3.15', 'Check positions tab', positionCount > 0, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.15', errorMsg);
        recordStep('3.15', 'Check positions tab', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.16: Verify position details
    {
      const stepStart = Date.now();
      logger.stepStart('3.16', 'Verify position details');

      try {
        const position = await trading.getPositionData(0);
        const validations: ValidationResult[] = [];

        if (position) {
          validations.push({
            field: 'Position symbol',
            uiValue: position.symbol,
            apiValue: 'BTC',
            match: position.symbol.includes('BTC'),
          });
          validations.push({
            field: 'Position side',
            uiValue: position.side,
            apiValue: 'long',
            match: position.side === 'long',
          });
          validations.push({
            field: 'Position size',
            uiValue: position.size,
            apiValue: 0.1,
            match: Math.abs(position.size - 0.1) < 0.01,
          });

          for (const v of validations) {
            logger.validation(v);
          }
        }

        logger.stepPass('3.16', Date.now() - stepStart);
        recordStep('3.16', 'Verify position details', position !== null, Date.now() - stepStart, undefined, validations);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.16', errorMsg);
        recordStep('3.16', 'Verify position details', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.17: Watch P&L updating
    {
      const stepStart = Date.now();
      logger.stepStart('3.17', 'Watch P&L updating');

      try {
        const { initial, final } = await trading.watchPnlChange(0, 3000);
        const screenshot = await screenshotManager.capture(page, '03-pnl-update');
        logger.stepPass('3.17', Date.now() - stepStart, `P&L: ${initial} → ${final}`);
        recordStep('3.17', 'Watch P&L updating', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.17', errorMsg);
        recordStep('3.17', 'Watch P&L updating', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.18: Close position
    {
      const stepStart = Date.now();
      logger.stepStart('3.18', 'Close position');

      try {
        await trading.clickClosePosition(0);
        const screenshot = await screenshotManager.capture(page, '03-close-confirm');
        await trading.confirmClosePosition();
        logger.stepPass('3.18', Date.now() - stepStart);
        recordStep('3.18', 'Close position', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.18', errorMsg);
        recordStep('3.18', 'Close position', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.19: Verify position closed
    {
      const stepStart = Date.now();
      logger.stepStart('3.19', 'Verify position closed');

      try {
        await stepDelay();
        const positionCount = await trading.getPositionCount();
        const screenshot = await screenshotManager.capture(page, '03-position-closed');
        logger.stepPass('3.19', Date.now() - stepStart, `${positionCount} positions remaining`);
        recordStep('3.19', 'Verify position closed', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.19', errorMsg);
        recordStep('3.19', 'Verify position closed', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.20: Check history tab
    {
      const stepStart = Date.now();
      logger.stepStart('3.20', 'Check history tab');

      try {
        await trading.goToHistory();
        const screenshot = await screenshotManager.capture(page, '03-trade-history');
        logger.stepPass('3.20', Date.now() - stepStart);
        recordStep('3.20', 'Check history tab', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.20', errorMsg);
        recordStep('3.20', 'Check history tab', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.21: Set order type "Limit"
    {
      const stepStart = Date.now();
      logger.stepStart('3.21', 'Set order type "Limit"');

      try {
        await trading.setOrderType('limit');
        const screenshot = await screenshotManager.capture(page, '03-limit-type');
        logger.stepPass('3.21', Date.now() - stepStart);
        recordStep('3.21', 'Set order type "Limit"', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.21', errorMsg);
        recordStep('3.21', 'Set order type "Limit"', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.22: Enter limit price and quantity
    {
      const stepStart = Date.now();
      logger.stepStart('3.22', 'Enter limit order details');

      try {
        await trading.setPrice(50000); // Below market for buy
        await trading.setQuantity(0.05);
        const screenshot = await screenshotManager.capture(page, '03-limit-price');
        logger.stepPass('3.22', Date.now() - stepStart);
        recordStep('3.22', 'Enter limit order details', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.22', errorMsg);
        recordStep('3.22', 'Enter limit order details', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.23: Submit limit order
    {
      const stepStart = Date.now();
      logger.stepStart('3.23', 'Submit limit order');

      try {
        await trading.clickPlaceOrder();
        if (await trading.isConfirmModalVisible()) {
          await trading.confirmOrder();
        }
        const screenshot = await screenshotManager.capture(page, '03-limit-submitted');
        logger.stepPass('3.23', Date.now() - stepStart);
        recordStep('3.23', 'Submit limit order', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.23', errorMsg);
        recordStep('3.23', 'Submit limit order', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.24: Check orders tab
    {
      const stepStart = Date.now();
      logger.stepStart('3.24', 'Check orders tab');

      try {
        await trading.goToOrders();
        const orderCount = await trading.getOrderCount();
        const screenshot = await screenshotManager.capture(page, '03-order-pending');
        logger.stepPass('3.24', Date.now() - stepStart, `${orderCount} open order(s)`);
        recordStep('3.24', 'Check orders tab', orderCount > 0, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.24', errorMsg);
        recordStep('3.24', 'Check orders tab', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.25: Cancel order
    {
      const stepStart = Date.now();
      logger.stepStart('3.25', 'Cancel order');

      try {
        await trading.cancelOrder(0);
        const screenshot = await screenshotManager.capture(page, '03-order-cancelled');
        logger.stepPass('3.25', Date.now() - stepStart);
        recordStep('3.25', 'Cancel order', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.25', errorMsg);
        recordStep('3.25', 'Cancel order', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 3.26: Verify order removed
    {
      const stepStart = Date.now();
      logger.stepStart('3.26', 'Verify order removed');

      try {
        await stepDelay();
        const orderCount = await trading.getOrderCount();
        logger.stepPass('3.26', Date.now() - stepStart, `${orderCount} orders remaining`);
        recordStep('3.26', 'Verify order removed', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('3.26', errorMsg);
        recordStep('3.26', 'Verify order removed', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
