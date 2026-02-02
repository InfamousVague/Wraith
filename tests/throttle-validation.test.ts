/**
 * Throttle Validation Test
 *
 * Tests that server-side throttling actually limits update frequency.
 * Runs 3 WebSocket clients in parallel with different throttle settings
 * and validates that update counts match expected rates.
 *
 * Expected throttle rates:
 * - Fast (0ms): All updates pass through
 * - Balanced (200ms): ~5 updates/sec per symbol
 * - Slow (1000ms): ~1 update/sec per symbol
 */

import { test, expect } from '@playwright/test';

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
async function runThrottleTest(level: ThrottleLevel): Promise<TestResult> {
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

    ws.onopen = () => {
      console.log(`[${level}] Connected, setting throttle to ${throttleMs}ms`);

      // Set throttle
      ws.send(JSON.stringify({ type: 'set_throttle', throttle_ms: throttleMs }));

      // Subscribe to assets
      ws.send(JSON.stringify({ type: 'subscribe', assets: ASSETS_TO_SUBSCRIBE }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'price_update') {
          updateCount++;
          const symbol = message.data.symbol?.toLowerCase();
          if (symbol && updatesPerSymbol[symbol] !== undefined) {
            updatesPerSymbol[symbol]++;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      console.error(`[${level}] WebSocket error:`, error);
      reject(error);
    };

    // Run for TEST_DURATION_MS then close and return results
    setTimeout(() => {
      ws.close();
      const durationSeconds = (Date.now() - startTime) / 1000;
      const updatesPerSecond = updateCount / durationSeconds;

      console.log(`[${level}] Finished: ${updateCount} updates in ${durationSeconds.toFixed(1)}s (${updatesPerSecond.toFixed(2)}/sec)`);
      console.log(`[${level}] Per symbol:`, updatesPerSymbol);

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

test.describe('WebSocket Throttling Validation', () => {
  test('throttle rates should limit updates as expected', async () => {
    console.log('\n=== Starting Throttle Validation Test ===');
    console.log(`Duration: ${TEST_DURATION_MS / 1000} seconds`);
    console.log(`Assets: ${ASSETS_TO_SUBSCRIBE.join(', ')}`);
    console.log('');

    // Run all three tests in parallel
    const [fastResult, balancedResult, slowResult] = await Promise.all([
      runThrottleTest('fast'),
      runThrottleTest('balanced'),
      runThrottleTest('slow'),
    ]);

    console.log('\n=== Results Summary ===');
    console.log('');

    // Display results
    const results = [fastResult, balancedResult, slowResult];
    results.forEach(r => {
      console.log(`${r.level.toUpperCase()} (${r.throttleMs}ms throttle):`);
      console.log(`  Total updates: ${r.updateCount}`);
      console.log(`  Updates/sec: ${r.updatesPerSecond.toFixed(2)}`);
      Object.entries(r.updatesPerSymbol).forEach(([symbol, count]) => {
        const perSec = count / (TEST_DURATION_MS / 1000);
        console.log(`  ${symbol}: ${count} updates (${perSec.toFixed(2)}/sec)`);
      });
      console.log('');
    });

    // Calculate expected maximum updates per symbol for throttled modes
    const testDurationSec = TEST_DURATION_MS / 1000;
    const expectedMaxBalanced = testDurationSec * (1000 / THROTTLE_CONFIG.balanced); // ~50 per symbol
    const expectedMaxSlow = testDurationSec * (1000 / THROTTLE_CONFIG.slow); // ~20 per symbol

    console.log('=== Expected Maximums (per symbol) ===');
    console.log(`Fast: unlimited (all updates)`);
    console.log(`Balanced: ~${expectedMaxBalanced.toFixed(0)} updates (${1000/THROTTLE_CONFIG.balanced}/sec)`);
    console.log(`Slow: ~${expectedMaxSlow.toFixed(0)} updates (${1000/THROTTLE_CONFIG.slow}/sec)`);
    console.log('');

    // Validation assertions
    console.log('=== Validation ===');

    // 1. Fast should have the most updates
    expect(fastResult.updateCount).toBeGreaterThan(balancedResult.updateCount);
    console.log(`✓ Fast (${fastResult.updateCount}) > Balanced (${balancedResult.updateCount})`);

    expect(balancedResult.updateCount).toBeGreaterThan(slowResult.updateCount);
    console.log(`✓ Balanced (${balancedResult.updateCount}) > Slow (${slowResult.updateCount})`);

    // 2. Check per-symbol rates for throttled modes
    // Allow 20% tolerance for timing variations
    const tolerance = 1.2;

    for (const symbol of ASSETS_TO_SUBSCRIBE) {
      const balancedSymbolUpdates = balancedResult.updatesPerSymbol[symbol];
      const slowSymbolUpdates = slowResult.updatesPerSymbol[symbol];

      // Balanced should not exceed expected max (with tolerance)
      if (balancedSymbolUpdates > 0) {
        expect(balancedSymbolUpdates).toBeLessThanOrEqual(expectedMaxBalanced * tolerance);
        console.log(`✓ Balanced ${symbol}: ${balancedSymbolUpdates} <= ${(expectedMaxBalanced * tolerance).toFixed(0)} (max with tolerance)`);
      }

      // Slow should not exceed expected max (with tolerance)
      if (slowSymbolUpdates > 0) {
        expect(slowSymbolUpdates).toBeLessThanOrEqual(expectedMaxSlow * tolerance);
        console.log(`✓ Slow ${symbol}: ${slowSymbolUpdates} <= ${(expectedMaxSlow * tolerance).toFixed(0)} (max with tolerance)`);
      }
    }

    // 3. Calculate and validate ratios
    if (slowResult.updateCount > 0 && balancedResult.updateCount > 0) {
      const fastToBalancedRatio = fastResult.updateCount / balancedResult.updateCount;
      const fastToSlowRatio = fastResult.updateCount / slowResult.updateCount;
      const balancedToSlowRatio = balancedResult.updateCount / slowResult.updateCount;

      console.log('');
      console.log('=== Ratios ===');
      console.log(`Fast:Balanced = ${fastToBalancedRatio.toFixed(2)}:1`);
      console.log(`Fast:Slow = ${fastToSlowRatio.toFixed(2)}:1`);
      console.log(`Balanced:Slow = ${balancedToSlowRatio.toFixed(2)}:1 (expected ~${(THROTTLE_CONFIG.slow / THROTTLE_CONFIG.balanced).toFixed(2)}:1)`);

      // Balanced:Slow ratio should be approximately 1000/200 = 5
      // Allow some tolerance due to timing
      const expectedBalancedToSlowRatio = THROTTLE_CONFIG.slow / THROTTLE_CONFIG.balanced;
      expect(balancedToSlowRatio).toBeGreaterThan(expectedBalancedToSlowRatio * 0.5);
      expect(balancedToSlowRatio).toBeLessThan(expectedBalancedToSlowRatio * 2);
      console.log(`✓ Balanced:Slow ratio is within expected range`);
    }

    console.log('');
    console.log('=== All validations passed! ===');
  });
});
