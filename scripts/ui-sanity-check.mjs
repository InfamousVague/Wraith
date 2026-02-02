#!/usr/bin/env node
/**
 * UI Sanity Check Script
 * Run with: node scripts/ui-sanity-check.mjs
 *
 * This script performs headless browser testing to verify the frontend loads correctly.
 * Use this after any UI changes to catch runtime errors.
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '../.sanity-screenshots');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const TIMEOUT_MS = 30000;

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logError(message) { log(colors.red, 'ERROR', message); }
function logSuccess(message) { log(colors.green, 'PASS', message); }
function logWarn(message) { log(colors.yellow, 'WARN', message); }
function logInfo(message) { log(colors.blue, 'INFO', message); }

async function runSanityCheck() {
  const startTime = Date.now();
  const errors = [];
  const warnings = [];
  const consoleMessages = [];

  logInfo(`Starting UI sanity check against ${FRONTEND_URL}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });

      if (type === 'error') {
        errors.push(`Console error: ${text}`);
      } else if (type === 'warning' && !text.includes('DevTools')) {
        warnings.push(`Console warning: ${text}`);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
      console.log(`\n${colors.red}STACK TRACE:${colors.reset}`);
      console.log(error.stack);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      const url = request.url();
      // Ignore some expected failures
      if (!url.includes('favicon') && !url.includes('.map')) {
        errors.push(`Request failed: ${url} - ${request.failure()?.errorText}`);
      }
    });

    logInfo('Navigating to frontend...');

    // Navigate with timeout
    const response = await page.goto(FRONTEND_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT_MS,
    });

    if (!response.ok()) {
      errors.push(`HTTP ${response.status()}: ${response.statusText()}`);
    }

    logInfo('Page loaded, waiting for app to render...');

    // Wait a bit for React to hydrate
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if the page has content
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      const root = document.getElementById('root');

      return {
        bodyHTML: body?.innerHTML?.substring(0, 500),
        rootHTML: root?.innerHTML?.substring(0, 500),
        rootChildCount: root?.childElementCount || 0,
        bodyBgColor: window.getComputedStyle(body).backgroundColor,
        hasVisibleContent: root && root.innerHTML.length > 100,
        pageTitle: document.title,
      };
    });

    logInfo(`Page title: ${bodyContent.pageTitle}`);
    logInfo(`Root element children: ${bodyContent.rootChildCount}`);
    logInfo(`Body background: ${bodyContent.bodyBgColor}`);

    if (!bodyContent.hasVisibleContent) {
      errors.push('Root element has no visible content - app may have crashed');
      logInfo(`Root HTML preview: ${bodyContent.rootHTML}`);
    }

    // Check for React error boundary or crash indicators
    const crashIndicators = await page.evaluate(() => {
      const html = document.body.innerHTML.toLowerCase();
      return {
        hasErrorBoundary: html.includes('error boundary') || html.includes('something went wrong'),
        hasChunkError: html.includes('loading chunk') || html.includes('failed to fetch'),
        hasBlankRoot: document.getElementById('root')?.innerHTML === '',
        errorElements: Array.from(document.querySelectorAll('[class*="error"], [class*="Error"]')).map(el => el.textContent?.substring(0, 100)),
      };
    });

    if (crashIndicators.hasBlankRoot) {
      errors.push('React root is completely empty - app failed to render');
    }
    if (crashIndicators.hasErrorBoundary) {
      errors.push('Error boundary detected - app crashed during render');
    }
    if (crashIndicators.hasChunkError) {
      errors.push('Chunk loading error detected');
    }
    if (crashIndicators.errorElements.length > 0) {
      errors.push(`Error elements found: ${crashIndicators.errorElements.join(', ')}`);
    }

    // Check for specific components
    const componentChecks = await page.evaluate(() => {
      return {
        // Check for key UI elements
        hasNavbar: !!document.querySelector('[class*="navbar"], [class*="Navbar"], nav'),
        hasTicker: !!document.querySelector('[class*="ticker"], [class*="Ticker"]'),
        hasCards: document.querySelectorAll('[class*="card"], [class*="Card"]').length,
        hasScrollView: !!document.querySelector('[class*="scroll"], [class*="Scroll"]'),
        // Check for loading states
        isLoading: !!document.querySelector('[class*="loading"], [class*="Loading"], [class*="skeleton"], [class*="Skeleton"]'),
        loadingText: document.body.innerText.includes('Loading') || document.body.innerText.includes('Connecting'),
      };
    });

    logInfo(`Components found: Navbar=${componentChecks.hasNavbar}, Ticker=${componentChecks.hasTicker}, Cards=${componentChecks.hasCards}`);

    if (componentChecks.isLoading) {
      logWarn('App appears to be stuck in loading state');
    }

    // Take screenshots
    const fs = await import('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(SCREENSHOT_DIR, `sanity-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logInfo(`Screenshot saved: ${screenshotPath}`);

    // Get any React DevTools errors if available
    const reactErrors = await page.evaluate(() => {
      // Check for React fiber errors
      const fiberRoot = document.getElementById('root')?._reactRootContainer;
      return {
        hasFiber: !!fiberRoot,
      };
    });

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('SANITY CHECK SUMMARY');
    console.log('='.repeat(60));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logInfo(`Duration: ${duration}s`);

    if (errors.length === 0) {
      logSuccess('All checks passed!');
    } else {
      console.log(`\n${colors.red}ERRORS (${errors.length}):${colors.reset}`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (warnings.length > 0) {
      console.log(`\n${colors.yellow}WARNINGS (${warnings.length}):${colors.reset}`);
      warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }

    // Show relevant console messages
    const relevantLogs = consoleMessages.filter(m =>
      m.type === 'error' ||
      (m.type === 'log' && (m.text.includes('Error') || m.text.includes('error')))
    );

    if (relevantLogs.length > 0) {
      console.log(`\n${colors.cyan}CONSOLE OUTPUT:${colors.reset}`);
      relevantLogs.slice(0, 10).forEach(m => {
        console.log(`  [${m.type}] ${m.text.substring(0, 200)}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    return errors.length === 0;

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the check
runSanityCheck().then(success => {
  process.exit(success ? 0 : 1);
});
