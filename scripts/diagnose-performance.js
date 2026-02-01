/**
 * Headless performance diagnostic script for Wraith frontend.
 * Analyzes render performance, identifies cascading updates, and catches errors.
 *
 * Usage: node scripts/diagnose-performance.js
 * Requires: puppeteer (npm install puppeteer)
 */

const puppeteer = require('puppeteer');

const TIMEOUT = 30000; // 30 seconds
const FRONTEND_URL = 'http://localhost:5173';

async function diagnosePerformance() {
  console.log('🔍 Starting Wraith Frontend Performance Diagnosis\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Collect all console messages and errors
  const consoleLogs = [];
  const errors = [];
  const warnings = [];
  const textNodeErrors = [];
  let renderCount = 0;

  // Listen for console messages - print all to terminal
  page.on('console', async (msg) => {
    const text = msg.text();
    const type = msg.type();

    consoleLogs.push({ type, text, timestamp: Date.now() });

    // Print to terminal with color coding
    const prefix = {
      'log': '  📋',
      'info': '  ℹ️',
      'warn': '  ⚠️',
      'error': '  ❌',
      'debug': '  🔧'
    }[type] || '  ';

    // Only print meaningful messages
    if (type === 'error' || type === 'warn' || text.includes('[')) {
      console.log(`${prefix} [${type.toUpperCase()}] ${text.slice(0, 200)}`);
    }

    // Track React render messages
    if (text.includes('render') || text.includes('update')) {
      renderCount++;
    }

    // Track text node errors specifically
    if (text.includes('Unexpected text node')) {
      textNodeErrors.push({ text, timestamp: Date.now() });
    }

    if (type === 'error') {
      errors.push({ text, timestamp: Date.now() });
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    errors.push({ text: error.message, stack: error.stack, timestamp: Date.now() });
  });

  // Listen for request failures
  page.on('requestfailed', (request) => {
    console.log(`❌ Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Enable performance tracing
  await page.tracing.start({ screenshots: false, categories: ['devtools.timeline'] });

  console.log(`📡 Connecting to ${FRONTEND_URL}...`);

  const startTime = Date.now();

  try {
    await page.goto(FRONTEND_URL, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });

    const loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${loadTime}ms`);

    // Wait a bit to observe any cascading updates
    console.log('\n⏳ Observing page behavior for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log(`❌ Page load failed: ${error.message}`);
  }

  const tracing = await page.tracing.stop();

  // Analyze results
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSIS RESULTS');
  console.log('='.repeat(60));

  console.log(`\n📝 Console Messages: ${consoleLogs.length}`);
  console.log(`   - Errors: ${errors.length}`);
  console.log(`   - Warnings: ${warnings.length}`);
  console.log(`   - Text Node Errors: ${textNodeErrors.length}`);

  if (textNodeErrors.length > 0) {
    console.log('\n⚠️  TEXT NODE ERROR ANALYSIS:');
    console.log(`   Total occurrences: ${textNodeErrors.length}`);

    // Calculate error rate
    if (textNodeErrors.length >= 2) {
      const firstTime = textNodeErrors[0].timestamp;
      const lastTime = textNodeErrors[textNodeErrors.length - 1].timestamp;
      const duration = (lastTime - firstTime) / 1000;
      const rate = textNodeErrors.length / duration;
      console.log(`   Error rate: ${rate.toFixed(2)} per second`);

      if (rate > 5) {
        console.log('   🚨 HIGH ERROR RATE - Likely infinite update loop!');
      }
    }

    console.log(`   First error: ${textNodeErrors[0]?.text}`);
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    // Deduplicate errors
    const uniqueErrors = [...new Set(errors.map(e => e.text))];
    uniqueErrors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.slice(0, 200)}`);
    });
    if (uniqueErrors.length > 10) {
      console.log(`   ... and ${uniqueErrors.length - 10} more unique errors`);
    }
  }

  // Check for specific patterns
  console.log('\n🔍 PATTERN ANALYSIS:');

  // Check for React-specific issues
  const reactErrors = errors.filter(e =>
    e.text.includes('React') ||
    e.text.includes('render') ||
    e.text.includes('hook')
  );
  if (reactErrors.length > 0) {
    console.log(`   React-related errors: ${reactErrors.length}`);
  }

  // Check for WebSocket issues
  const wsErrors = errors.filter(e =>
    e.text.includes('WebSocket') ||
    e.text.includes('socket')
  );
  if (wsErrors.length > 0) {
    console.log(`   WebSocket errors: ${wsErrors.length}`);
  }

  // Check for network issues
  const networkErrors = errors.filter(e =>
    e.text.includes('fetch') ||
    e.text.includes('network') ||
    e.text.includes('CORS')
  );
  if (networkErrors.length > 0) {
    console.log(`   Network errors: ${networkErrors.length}`);
  }

  // Take a screenshot of the final state
  await page.screenshot({ path: '/tmp/wraith-diagnosis.png', fullPage: true });
  console.log('\n📸 Screenshot saved to /tmp/wraith-diagnosis.png');

  // Performance metrics
  const metrics = await page.metrics();
  console.log('\n📈 PERFORMANCE METRICS:');
  console.log(`   JS Heap Size: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   DOM Nodes: ${metrics.Nodes}`);
  console.log(`   Event Listeners: ${metrics.JSEventListeners}`);

  // Check for excessive event listeners (sign of memory leak)
  if (metrics.JSEventListeners > 100) {
    console.log('   ⚠️  High event listener count - possible memory leak');
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS:');
  console.log('='.repeat(60));

  if (textNodeErrors.length > 10) {
    console.log('\n1. TEXT NODE ERRORS: There\'s a component rendering raw text inside a View.');
    console.log('   - Check components that conditionally render empty strings');
    console.log('   - Look for {value} interpolations that might be falsy values');
    console.log('   - The error mentions "." - look for period characters being rendered');
  }

  if (errors.length > 100) {
    console.log('\n2. EXCESSIVE ERRORS: Possible infinite update loop detected.');
    console.log('   - Check useEffect dependencies that might change every render');
    console.log('   - Look for state updates in useEffect that trigger re-renders');
    console.log('   - Review context value memoization');
  }

  console.log('\n');
}

diagnosePerformance().catch(console.error);
