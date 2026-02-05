/**
 * Full Flow Walkthrough Suite
 *
 * Complete end-to-end test of the entire application:
 * 1. Start as guest
 * 2. Browse dashboard
 * 3. View asset details
 * 4. Create account
 * 5. Connect to server
 * 6. Place market order
 * 7. Watch position P&L
 * 8. Close position
 * 9. Check portfolio
 * 10. Check leaderboard
 * 11. Change settings
 * 12. Logout
 */

import { Page } from '@playwright/test';
import { SuiteResult, ValidationResult } from '../config';
import { logger } from '../utils';
import { DashboardPage } from '../pages/dashboard.page';
import { AssetDetailPage } from '../pages/asset-detail.page';
import { TradingPage } from '../pages/trading.page';
import { PortfolioPage } from '../pages/portfolio.page';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { ProfilePage } from '../pages/profile.page';
import { SettingsPage } from '../pages/settings.page';
import { screenshotManager } from '../utils/screenshot';
import { stepDelay, waitForLoadingComplete } from '../utils/wait';

export async function runFullFlowSuite(page: Page): Promise<SuiteResult> {
  const dashboard = new DashboardPage(page);
  const assetDetail = new AssetDetailPage(page);
  const trading = new TradingPage(page);
  const portfolio = new PortfolioPage(page);
  const leaderboard = new LeaderboardPage(page);
  const profile = new ProfilePage(page);
  const settings = new SettingsPage(page);

  const result: SuiteResult = {
    name: 'Full Flow Walkthrough',
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
    // ========== PHASE 1: Browse as Guest ==========
    logger.info('--- Phase 1: Browse as Guest ---');

    // Step 8.1: Navigate to dashboard
    {
      const stepStart = Date.now();
      logger.stepStart('8.1', 'Navigate to dashboard');

      try {
        await dashboard.navigate();
        const screenshot = await screenshotManager.capture(page, '08-full-dashboard');
        logger.stepPass('8.1', Date.now() - stepStart);
        recordStep('8.1', 'Navigate to dashboard', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.1', errorMsg);
        recordStep('8.1', 'Navigate to dashboard', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.2: View asset prices
    {
      const stepStart = Date.now();
      logger.stepStart('8.2', 'View asset prices');

      try {
        await dashboard.waitForAssetsToLoad();
        const assets = await dashboard.getTopAssets(3);
        for (const asset of assets) {
          logger.info(`${asset.symbol}: $${asset.price.toLocaleString()}`);
        }
        logger.stepPass('8.2', Date.now() - stepStart, `${assets.length} assets loaded`);
        recordStep('8.2', 'View asset prices', assets.length > 0, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.2', errorMsg);
        recordStep('8.2', 'View asset prices', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.3: View BTC detail
    {
      const stepStart = Date.now();
      logger.stepStart('8.3', 'View BTC detail');

      try {
        await assetDetail.navigateToAsset('BTC');
        const price = await assetDetail.getPrice();
        const screenshot = await screenshotManager.capture(page, '08-full-btc');
        logger.stepPass('8.3', Date.now() - stepStart, `Price: $${price.toLocaleString()}`);
        recordStep('8.3', 'View BTC detail', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.3', errorMsg);
        recordStep('8.3', 'View BTC detail', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 2: Create Account & Connect ==========
    logger.info('--- Phase 2: Create Account & Connect ---');

    // Step 8.4: Create account
    {
      const stepStart = Date.now();
      logger.stepStart('8.4', 'Create account');

      try {
        await profile.navigate();
        const isGuest = await profile.isGuest();
        if (isGuest) {
          await profile.createAccount();
        }
        const screenshot = await screenshotManager.capture(page, '08-full-account');
        logger.stepPass('8.4', Date.now() - stepStart);
        recordStep('8.4', 'Create account', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.4', errorMsg);
        recordStep('8.4', 'Create account', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.5: Connect to server
    {
      const stepStart = Date.now();
      logger.stepStart('8.5', 'Connect to server');

      try {
        const connected = await profile.isConnectedToServer();
        if (!connected) {
          await profile.connectToServer();
        }
        const screenshot = await screenshotManager.capture(page, '08-full-connected');
        logger.stepPass('8.5', Date.now() - stepStart);
        recordStep('8.5', 'Connect to server', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.5', errorMsg);
        recordStep('8.5', 'Connect to server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 3: Trading ==========
    logger.info('--- Phase 3: Trading ---');

    // Step 8.6: Place market order
    {
      const stepStart = Date.now();
      logger.stepStart('8.6', 'Place market order');

      try {
        await trading.navigate();
        await trading.placeOrder({
          symbol: 'BTC',
          side: 'buy',
          type: 'market',
          quantity: 0.1,
          leverage: 2,
        });
        const screenshot = await screenshotManager.capture(page, '08-full-order');
        logger.stepPass('8.6', Date.now() - stepStart);
        recordStep('8.6', 'Place market order', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.6', errorMsg);
        recordStep('8.6', 'Place market order', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.7: Watch position P&L
    {
      const stepStart = Date.now();
      logger.stepStart('8.7', 'Watch position P&L');

      try {
        await trading.goToPositions();
        const { initial, final } = await trading.watchPnlChange(0, 5000);
        const screenshot = await screenshotManager.capture(page, '08-full-pnl');
        logger.stepPass('8.7', Date.now() - stepStart, `P&L: ${initial} → ${final}`);
        recordStep('8.7', 'Watch position P&L', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.7', errorMsg);
        recordStep('8.7', 'Watch position P&L', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.8: Close position
    {
      const stepStart = Date.now();
      logger.stepStart('8.8', 'Close position');

      try {
        await trading.closePosition(0);
        const screenshot = await screenshotManager.capture(page, '08-full-closed');
        logger.stepPass('8.8', Date.now() - stepStart);
        recordStep('8.8', 'Close position', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.8', errorMsg);
        recordStep('8.8', 'Close position', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 4: Verify Portfolio ==========
    logger.info('--- Phase 4: Verify Portfolio ---');

    // Step 8.9: Check portfolio
    {
      const stepStart = Date.now();
      logger.stepStart('8.9', 'Check portfolio');

      try {
        await portfolio.navigate();
        const summary = await portfolio.getSummary();
        const screenshot = await screenshotManager.capture(page, '08-full-portfolio');

        if (summary) {
          logger.info(`Cash: $${summary.cashBalance.toLocaleString()}`);
          logger.info(`Realized P&L: $${summary.realizedPnl.toLocaleString()}`);
        }

        logger.stepPass('8.9', Date.now() - stepStart);
        recordStep('8.9', 'Check portfolio', summary !== null, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.9', errorMsg);
        recordStep('8.9', 'Check portfolio', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.10: Check trade history
    {
      const stepStart = Date.now();
      logger.stepStart('8.10', 'Check trade history');

      try {
        const hasTrades = await portfolio.hasRecentTrades();
        logger.stepPass('8.10', Date.now() - stepStart, hasTrades ? 'Trades found' : 'No trades');
        recordStep('8.10', 'Check trade history', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.10', errorMsg);
        recordStep('8.10', 'Check trade history', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 5: Leaderboard ==========
    logger.info('--- Phase 5: Leaderboard ---');

    // Step 8.11: Check leaderboard
    {
      const stepStart = Date.now();
      logger.stepStart('8.11', 'Check leaderboard');

      try {
        await leaderboard.navigate();
        const hasData = await leaderboard.hasData();
        const screenshot = await screenshotManager.capture(page, '08-full-leaderboard');
        logger.stepPass('8.11', Date.now() - stepStart, hasData ? 'Rankings loaded' : 'No data');
        recordStep('8.11', 'Check leaderboard', hasData, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.11', errorMsg);
        recordStep('8.11', 'Check leaderboard', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.12: Check my rank
    {
      const stepStart = Date.now();
      logger.stepStart('8.12', 'Check my rank');

      try {
        const myRank = await leaderboard.getMyRank();
        if (myRank) {
          logger.info(`My rank: #${myRank.rank}`);
        }
        logger.stepPass('8.12', Date.now() - stepStart, myRank ? `Rank #${myRank.rank}` : 'Not ranked');
        recordStep('8.12', 'Check my rank', true, Date.now() - stepStart);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.12', errorMsg);
        recordStep('8.12', 'Check my rank', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 6: Settings ==========
    logger.info('--- Phase 6: Settings ---');

    // Step 8.13: Change settings
    {
      const stepStart = Date.now();
      logger.stepStart('8.13', 'Change settings');

      try {
        await settings.navigate();
        await settings.setSpeed('2x');
        const screenshot = await screenshotManager.capture(page, '08-full-settings');
        logger.stepPass('8.13', Date.now() - stepStart);
        recordStep('8.13', 'Change settings', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.13', errorMsg);
        recordStep('8.13', 'Change settings', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.14: Switch server
    {
      const stepStart = Date.now();
      logger.stepStart('8.14', 'Switch server');

      try {
        const servers = await settings.getServers();
        if (servers.length > 1) {
          await settings.switchServerByIndex(1);
          await stepDelay();
          await settings.switchServerByIndex(0); // Switch back
        }
        const screenshot = await screenshotManager.capture(page, '08-full-server-switch');
        logger.stepPass('8.14', Date.now() - stepStart);
        recordStep('8.14', 'Switch server', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.14', errorMsg);
        recordStep('8.14', 'Switch server', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // ========== PHASE 7: Logout ==========
    logger.info('--- Phase 7: Logout ---');

    // Step 8.15: Logout
    {
      const stepStart = Date.now();
      logger.stepStart('8.15', 'Logout');

      try {
        await profile.navigate();
        await profile.logout();
        const screenshot = await screenshotManager.capture(page, '08-full-logout');
        logger.stepPass('8.15', Date.now() - stepStart);
        recordStep('8.15', 'Logout', true, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.15', errorMsg);
        recordStep('8.15', 'Logout', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

    // Step 8.16: Verify logged out
    {
      const stepStart = Date.now();
      logger.stepStart('8.16', 'Verify logged out');

      try {
        await stepDelay();
        const isGuest = await profile.isGuest();
        const screenshot = await screenshotManager.capture(page, '08-full-complete');
        logger.stepPass('8.16', Date.now() - stepStart, isGuest ? 'Logged out' : 'Still logged in');
        recordStep('8.16', 'Verify logged out', isGuest, Date.now() - stepStart, screenshot ?? undefined);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.stepFail('8.16', errorMsg);
        recordStep('8.16', 'Verify logged out', false, Date.now() - stepStart, undefined, undefined, errorMsg);
      }
    }

  } catch (error) {
    logger.error(`Suite failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}
