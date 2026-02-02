#!/usr/bin/env npx ts-node
/**
 * Throttle Validation Script
 *
 * Tests that server-side throttling actually limits update frequency.
 * Runs 3 WebSocket clients in parallel with different throttle settings
 * and validates that update counts match expected rates.
 *
 * Run with: npx ts-node scripts/validate-throttle.ts
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3001/ws';
const TEST_DURATION_MS = 10000; // 10 seconds
const ASSETS_TO_SUBSCRIBE = ['btc', 'eth', 'sol']; // Subscribe to 3 assets

type ThrottleLevel = 'fast' | 'balanced' | 'slow';

const THROTTLE_CONFIG: Record<ThrottleLevel, number> = {
  fast: 0,
  balanced: 200,
  slow: 1000,  // More dramatic slowdown
};

interface TestResult {
  level: ThrottleLevel;
  throttleMs: number;
  updateCount: number;
  updatesPerSecond: number;
  updatesPerSymbol: Record<string, number>;
}

/**
 * Connect a WebSocket client, set throttle, subscribe, and count updates.
 */
function runThrottleTest(level: ThrottleLevel): Promise<TestResult> {
  return new Promise((resolve, reject) => {
    const throttleMs = THROTTLE_CONFIG[level];
    let updateCount = 0;
    const updatesPerSymbol: Record<string, number> = {};

    // Initialize per-symbol counters
    ASSETS_TO_SUBSCRIBE.forEach(asset => {
      updatesPerSymbol[asset] = 0;
    });

    const ws = new WebSocket(WS_URL);
    const startTime = Date.now();

    ws.on('open', () => {
      console.log(`[${level}] Connected, setting throttle to ${throttleMs}ms`);

      // Set throttle
      ws.send(JSON.stringify({ type: 'set_throttle', throttle_ms: throttleMs }));

      // Subscribe to assets
      ws.send(JSON.stringify({ type: 'subscribe', assets: ASSETS_TO_SUBSCRIBE }));
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'price_update') {
          updateCount++;
          const symbol = message.data?.symbol?.toLowerCase();
          if (symbol && updatesPerSymbol[symbol] !== undefined) {
            updatesPerSymbol[symbol]++;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    ws.on('error', (error: Error) => {
      console.error(`[${level}] WebSocket error:`, error.message);
      reject(error);
    });

    // Run for TEST_DURATION_MS then close and return results
    setTimeout(() => {
      ws.close();
      const durationSeconds = (Date.now() - startTime) / 1000;
      const updatesPerSecond = updateCount / durationSeconds;

      console.log(`[${level}] Finished: ${updateCount} updates in ${durationSeconds.toFixed(1)}s (${updatesPerSecond.toFixed(2)}/sec)`);

      resolve({
        level,
        throttleMs,
        updateCount,
        updatesPerSecond,
        updatesPerSymbol,
      });
    }, TEST_DURATION_MS);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           THROTTLE VALIDATION TEST                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱  Duration: ${TEST_DURATION_MS / 1000} seconds`);
  console.log(`📊 Assets: ${ASSETS_TO_SUBSCRIBE.join(', ')}`);
  console.log(`🔗 Server: ${WS_URL}`);
  console.log('');
  console.log('Starting 3 parallel WebSocket connections...\n');

  try {
    // Run all three tests in parallel
    const [fastResult, balancedResult, slowResult] = await Promise.all([
      runThrottleTest('fast'),
      runThrottleTest('balanced'),
      runThrottleTest('slow'),
    ]);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESULTS SUMMARY                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Display results in a table format
    const results = [fastResult, balancedResult, slowResult];

    console.log('┌─────────────┬────────────┬──────────────┬─────────────┐');
    console.log('│ Level       │ Throttle   │ Total Updates│ Updates/sec │');
    console.log('├─────────────┼────────────┼──────────────┼─────────────┤');
    results.forEach(r => {
      const level = r.level.toUpperCase().padEnd(11);
      const throttle = `${r.throttleMs}ms`.padEnd(10);
      const total = r.updateCount.toString().padEnd(12);
      const perSec = r.updatesPerSecond.toFixed(2).padEnd(11);
      console.log(`│ ${level}│ ${throttle}│ ${total}│ ${perSec}│`);
    });
    console.log('└─────────────┴────────────┴──────────────┴─────────────┘');

    console.log('\nPer-Symbol Breakdown:');
    console.log('┌─────────────┬─────────┬─────────┬─────────┐');
    console.log('│ Level       │ BTC     │ ETH     │ SOL     │');
    console.log('├─────────────┼─────────┼─────────┼─────────┤');
    results.forEach(r => {
      const level = r.level.toUpperCase().padEnd(11);
      const btc = (r.updatesPerSymbol['btc'] || 0).toString().padEnd(7);
      const eth = (r.updatesPerSymbol['eth'] || 0).toString().padEnd(7);
      const sol = (r.updatesPerSymbol['sol'] || 0).toString().padEnd(7);
      console.log(`│ ${level}│ ${btc}│ ${eth}│ ${sol}│`);
    });
    console.log('└─────────────┴─────────┴─────────┴─────────┘');

    // Calculate expected maximum updates per symbol for throttled modes
    const testDurationSec = TEST_DURATION_MS / 1000;
    const expectedMaxBalanced = testDurationSec * (1000 / THROTTLE_CONFIG.balanced);
    const expectedMaxSlow = testDurationSec * (1000 / THROTTLE_CONFIG.slow);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                 EXPECTED vs ACTUAL                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('Expected maximum updates per symbol (based on throttle math):');
    console.log(`  • Fast:     unlimited (receives all server updates)`);
    console.log(`  • Balanced: ~${expectedMaxBalanced.toFixed(0)} updates (1000ms / ${THROTTLE_CONFIG.balanced}ms × ${testDurationSec}s)`);
    console.log(`  • Slow:     ~${expectedMaxSlow.toFixed(0)} updates (1000ms / ${THROTTLE_CONFIG.slow}ms × ${testDurationSec}s)`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    VALIDATION                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let allPassed = true;
    const tolerance = 1.3; // 30% tolerance for timing variations

    // 1. Fast should have the most updates
    if (fastResult.updateCount > balancedResult.updateCount) {
      console.log(`✅ Fast (${fastResult.updateCount}) > Balanced (${balancedResult.updateCount})`);
    } else {
      console.log(`❌ FAIL: Fast (${fastResult.updateCount}) should be > Balanced (${balancedResult.updateCount})`);
      allPassed = false;
    }

    if (balancedResult.updateCount > slowResult.updateCount) {
      console.log(`✅ Balanced (${balancedResult.updateCount}) > Slow (${slowResult.updateCount})`);
    } else {
      console.log(`❌ FAIL: Balanced (${balancedResult.updateCount}) should be > Slow (${slowResult.updateCount})`);
      allPassed = false;
    }

    // 2. Check per-symbol rates for throttled modes
    console.log('\nPer-symbol throttle validation:');

    for (const symbol of ASSETS_TO_SUBSCRIBE) {
      const balancedSymbolUpdates = balancedResult.updatesPerSymbol[symbol] || 0;
      const slowSymbolUpdates = slowResult.updatesPerSymbol[symbol] || 0;

      // Balanced should not exceed expected max (with tolerance)
      if (balancedSymbolUpdates <= expectedMaxBalanced * tolerance) {
        console.log(`✅ Balanced ${symbol.toUpperCase()}: ${balancedSymbolUpdates} ≤ ${(expectedMaxBalanced * tolerance).toFixed(0)} (max with ${((tolerance-1)*100).toFixed(0)}% tolerance)`);
      } else {
        console.log(`❌ FAIL: Balanced ${symbol.toUpperCase()}: ${balancedSymbolUpdates} > ${(expectedMaxBalanced * tolerance).toFixed(0)}`);
        allPassed = false;
      }

      // Slow should not exceed expected max (with tolerance)
      if (slowSymbolUpdates <= expectedMaxSlow * tolerance) {
        console.log(`✅ Slow ${symbol.toUpperCase()}: ${slowSymbolUpdates} ≤ ${(expectedMaxSlow * tolerance).toFixed(0)} (max with ${((tolerance-1)*100).toFixed(0)}% tolerance)`);
      } else {
        console.log(`❌ FAIL: Slow ${symbol.toUpperCase()}: ${slowSymbolUpdates} > ${(expectedMaxSlow * tolerance).toFixed(0)}`);
        allPassed = false;
      }
    }

    // 3. Calculate and validate ratios
    console.log('\nRatio analysis:');
    if (slowResult.updateCount > 0 && balancedResult.updateCount > 0) {
      const fastToBalancedRatio = fastResult.updateCount / balancedResult.updateCount;
      const fastToSlowRatio = fastResult.updateCount / slowResult.updateCount;
      const balancedToSlowRatio = balancedResult.updateCount / slowResult.updateCount;

      console.log(`  Fast:Balanced ratio = ${fastToBalancedRatio.toFixed(2)}:1`);
      console.log(`  Fast:Slow ratio = ${fastToSlowRatio.toFixed(2)}:1`);
      console.log(`  Balanced:Slow ratio = ${balancedToSlowRatio.toFixed(2)}:1`);

      // Balanced:Slow ratio should be approximately 500/200 = 2.5
      const expectedBalancedToSlowRatio = THROTTLE_CONFIG.slow / THROTTLE_CONFIG.balanced;
      console.log(`  Expected Balanced:Slow ratio ≈ ${expectedBalancedToSlowRatio.toFixed(2)}:1`);

      if (balancedToSlowRatio > expectedBalancedToSlowRatio * 0.5 &&
          balancedToSlowRatio < expectedBalancedToSlowRatio * 2.0) {
        console.log(`✅ Balanced:Slow ratio is within expected range (0.5x to 2x of ${expectedBalancedToSlowRatio.toFixed(2)})`);
      } else {
        console.log(`❌ FAIL: Balanced:Slow ratio ${balancedToSlowRatio.toFixed(2)} is outside expected range`);
        allPassed = false;
      }
    } else {
      console.log(`⚠️  Cannot calculate ratios - some results have 0 updates`);
      allPassed = false;
    }

    console.log('\n' + '═'.repeat(62));
    if (allPassed) {
      console.log('✅ ALL VALIDATIONS PASSED - Throttling is working correctly!');
    } else {
      console.log('❌ SOME VALIDATIONS FAILED - Throttling may not be working as expected');
    }
    console.log('═'.repeat(62) + '\n');

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

main();
