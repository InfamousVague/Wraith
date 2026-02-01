const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = './screenshots/test';
const BASE_URL = 'http://localhost:5173';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('HEADLESS BROWSER TEST');
  console.log('='.repeat(60));
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Collect console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    };
    consoleLogs.push(logEntry);

    // Print to terminal with color coding
    const prefix = `[${msg.type().toUpperCase()}]`;
    if (msg.type() === 'error') {
      console.log('\x1b[31m%s\x1b[0m', `${prefix} ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log('\x1b[33m%s\x1b[0m', `${prefix} ${msg.text()}`);
    } else {
      console.log('\x1b[36m%s\x1b[0m', `${prefix} ${msg.text()}`);
    }
  });

  // Collect network requests
  const networkRequests = [];
  page.on('request', (request) => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    });
  });

  // Collect network responses
  const networkResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();

    // Only log API requests
    if (url.includes('/api/')) {
      const entry = {
        url,
        status,
        ok: response.ok(),
      };
      networkResponses.push(entry);

      const statusColor = status >= 200 && status < 300 ? '\x1b[32m' : '\x1b[31m';
      console.log(`${statusColor}[API] ${status} ${url}\x1b[0m`);

      // Try to get response body for API calls
      try {
        const body = await response.text();
        if (body.length < 500) {
          console.log(`  Response: ${body.substring(0, 200)}...`);
        }
      } catch (e) {
        // Ignore body read errors
      }
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
    });
    console.log('\x1b[31m[PAGE ERROR]\x1b[0m', error.message);
  });

  try {
    // Test 1: Load the main page (List View)
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 1: Loading main page (List View)');
    console.log('-'.repeat(60));

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-list-view.png'),
      fullPage: false
    });
    console.log('Screenshot saved: 01-list-view.png');

    // Test 2: Switch to Charts View
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 2: Switching to Charts View');
    console.log('-'.repeat(60));

    // Find and click the Charts button using XPath or text content
    const clicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, span, button');
      for (const el of elements) {
        if (el.textContent === 'Charts' || el.textContent.trim() === 'Charts') {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log('Clicked Charts button');
    } else {
      console.log('Could not find Charts button');
    }

    await sleep(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-charts-view.png'),
      fullPage: false
    });
    console.log('Screenshot saved: 02-charts-view.png');

    // Test 3: Full page screenshot
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 3: Full page screenshot');
    console.log('-'.repeat(60));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-full-page.png'),
      fullPage: true
    });
    console.log('Screenshot saved: 03-full-page.png');

    // Test 4: Switch back to List View
    console.log('\n' + '-'.repeat(60));
    console.log('TEST 4: Switching back to List View');
    console.log('-'.repeat(60));

    const clickedList = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, span, button');
      for (const el of elements) {
        if (el.textContent === 'List' || el.textContent.trim() === 'List') {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clickedList) {
      console.log('Clicked List button');
    }

    await sleep(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-list-view-return.png'),
      fullPage: false
    });
    console.log('Screenshot saved: 04-list-view-return.png');

  } catch (error) {
    console.log('\x1b[31m[TEST ERROR]\x1b[0m', error.message);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'),
      fullPage: true
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  console.log('\nConsole Logs Summary:');
  const errorLogs = consoleLogs.filter(l => l.type === 'error');
  const warningLogs = consoleLogs.filter(l => l.type === 'warning');
  console.log(`  Total logs: ${consoleLogs.length}`);
  console.log(`  Errors: ${errorLogs.length}`);
  console.log(`  Warnings: ${warningLogs.length}`);

  if (errorLogs.length > 0) {
    console.log('\nError Details:');
    errorLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log.text.substring(0, 200)}`);
    });
  }

  console.log('\nAPI Requests:');
  networkResponses.forEach((resp) => {
    const status = resp.ok ? '\x1b[32mOK\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  [${resp.status}] ${status} ${resp.url}`);
  });

  console.log('\nPage Errors:');
  if (pageErrors.length === 0) {
    console.log('  None');
  } else {
    pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.message}`);
    });
  }

  console.log('\nScreenshots saved to:', path.resolve(SCREENSHOT_DIR));

  // Save full report to JSON
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    consoleLogs,
    networkResponses,
    pageErrors,
    summary: {
      totalLogs: consoleLogs.length,
      errors: errorLogs.length,
      warnings: warningLogs.length,
      apiRequests: networkResponses.length,
      pageErrors: pageErrors.length,
    }
  };

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('Full report saved to: test-report.json');

  await browser.close();
  console.log('\n' + '='.repeat(60));
  console.log('Tests completed');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
