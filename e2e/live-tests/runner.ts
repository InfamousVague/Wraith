/**
 * Live Test Runner
 *
 * Main orchestrator for running live browser tests.
 * Runs tests slowly in headed mode so you can watch.
 */

import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { LIVE_TEST_CONFIG, SuiteResult } from './config';
import { logger, screenshotManager } from './utils';

// Import test suites
import { runDashboardSuite } from './suites/01-dashboard.suite';
import { runAssetDetailSuite } from './suites/02-asset-detail.suite';
import { runTradingSuite } from './suites/03-trading.suite';
import { runPortfolioSuite } from './suites/04-portfolio.suite';
import { runLeaderboardSuite } from './suites/05-leaderboard.suite';
import { runProfileSuite } from './suites/06-profile.suite';
import { runSettingsSuite } from './suites/07-settings.suite';
import { runFullFlowSuite } from './suites/08-full-flow.suite';

interface RunOptions {
  suites?: string[];
  slow?: boolean;
  browser?: 'chromium' | 'firefox' | 'webkit';
}

class LiveTestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private results: SuiteResult[] = [];

  async setup(options?: RunOptions): Promise<void> {
    const browserType = options?.browser ?? 'chromium';

    logger.banner('Wraith Trading Platform');
    logger.info(`Launching ${browserType} browser in headed mode...`);

    // Launch browser with headed mode
    this.browser = await chromium.launch({
      headless: false,
      slowMo: options?.slow ? LIVE_TEST_CONFIG.SLOW_MO * 2 : LIVE_TEST_CONFIG.SLOW_MO,
    });

    this.context = await this.browser.newContext({
      viewport: LIVE_TEST_CONFIG.VIEWPORT,
      baseURL: LIVE_TEST_CONFIG.BASE_URL,
    });

    this.page = await this.context.newPage();

    // Clean up old screenshots
    await screenshotManager.cleanupOldScreenshots();
  }

  async teardown(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  async runSuite(
    name: string,
    runner: (page: Page) => Promise<SuiteResult>
  ): Promise<SuiteResult> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    screenshotManager.setSuite(name);
    screenshotManager.clearScreenshots();

    logger.suiteStart(name);

    const result = await runner(this.page);
    result.screenshots = screenshotManager.getScreenshots();

    logger.suiteEnd(result);
    this.results.push(result);

    return result;
  }

  async runAll(options?: RunOptions): Promise<SuiteResult[]> {
    await this.setup(options);

    try {
      const suiteRunners: Record<string, (page: Page) => Promise<SuiteResult>> = {
        'dashboard': runDashboardSuite,
        'asset-detail': runAssetDetailSuite,
        'trading': runTradingSuite,
        'portfolio': runPortfolioSuite,
        'leaderboard': runLeaderboardSuite,
        'profile': runProfileSuite,
        'settings': runSettingsSuite,
        'full-flow': runFullFlowSuite,
      };

      // Filter suites if specified
      const suitesToRun = options?.suites ?? Object.keys(suiteRunners);

      for (const suiteName of suitesToRun) {
        const runner = suiteRunners[suiteName];
        if (runner) {
          await this.runSuite(suiteName, runner);
        } else {
          logger.warn(`Unknown suite: ${suiteName}`);
        }
      }

      logger.finalSummary(this.results);

      return this.results;
    } finally {
      await this.teardown();
    }
  }
}

// CLI Entry Point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: RunOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--suite' || arg === '-s') {
      const suites = args[++i]?.split(',') ?? [];
      options.suites = suites;
    } else if (arg === '--slow') {
      options.slow = true;
    } else if (arg === '--browser' || arg === '-b') {
      const browser = args[++i] as 'chromium' | 'firefox' | 'webkit';
      options.browser = browser;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Live Browser Test Runner

Usage:
  npx tsx e2e/live-tests/runner.ts [options]

Options:
  --suite, -s <names>   Comma-separated list of suites to run
                        Available: dashboard, asset-detail, trading,
                        portfolio, leaderboard, profile, settings, full-flow
  --slow                Run with extra slow mode (2x slower)
  --browser, -b <name>  Browser to use: chromium, firefox, webkit
  --help, -h            Show this help

Examples:
  npx tsx e2e/live-tests/runner.ts
  npx tsx e2e/live-tests/runner.ts --suite dashboard,trading
  npx tsx e2e/live-tests/runner.ts --slow
  npx tsx e2e/live-tests/runner.ts --suite full-flow --slow
      `);
      process.exit(0);
    }
  }

  const runner = new LiveTestRunner();
  const results = await runner.runAll(options);

  // Exit with error code if any tests failed
  const totalFailed = results.reduce((sum, r) => sum + (r.totalSteps - r.passedSteps), 0);
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Export for programmatic use
export { LiveTestRunner };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
