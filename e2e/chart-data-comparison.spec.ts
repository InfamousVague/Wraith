import { test, expect } from '@playwright/test';

const TIME_RANGES = ['1H', '4H', '1D', '1W', '1M'] as const;

type OhlcPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartDataResult = {
  range: string;
  points: number;
  startTime: string;
  endTime: string;
  startPrice: number;
  endPrice: number;
  isValid: boolean;
  issues: string[];
};

// Fetch chart data from our Haunt API
async function fetchWraithChartData(assetId: number, range: string): Promise<OhlcPoint[]> {
  const rangeMap: Record<string, string> = {
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
    '1M': '1m',
  };

  const response = await fetch(`http://localhost:3001/api/crypto/${assetId}/chart?range=${rangeMap[range]}`);
  if (!response.ok) {
    throw new Error(`Haunt API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data?.data || [];
}

function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

// Validate OHLC data integrity
function validateOhlcData(data: OhlcPoint[]): string[] {
  const issues: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const point = data[i];

    // Check for NaN values
    if (isNaN(point.open) || isNaN(point.high) || isNaN(point.low) || isNaN(point.close)) {
      issues.push(`Point ${i}: Contains NaN values`);
    }

    // Check OHLC integrity: high >= low, high >= open/close, low <= open/close
    if (point.high < point.low) {
      issues.push(`Point ${i}: high (${point.high}) < low (${point.low})`);
    }
    if (point.high < point.open || point.high < point.close) {
      issues.push(`Point ${i}: high (${point.high}) < open/close`);
    }
    if (point.low > point.open || point.low > point.close) {
      issues.push(`Point ${i}: low (${point.low}) > open/close`);
    }

    // Check for unreasonable prices (should be positive)
    if (point.close <= 0) {
      issues.push(`Point ${i}: Non-positive close price: ${point.close}`);
    }

    // Check timestamp is valid
    if (point.time <= 0) {
      issues.push(`Point ${i}: Invalid timestamp: ${point.time}`);
    }
  }

  // Check for time ordering
  for (let i = 1; i < data.length; i++) {
    if (data[i].time <= data[i - 1].time) {
      issues.push(`Point ${i}: Time not ascending: ${data[i].time} <= ${data[i - 1].time}`);
    }
  }

  return issues;
}

test.describe('Chart Data Validation', () => {
  test('validate BTC chart data across all time ranges', async () => {
    test.setTimeout(120000);

    const results: ChartDataResult[] = [];
    const btcId = 1; // Bitcoin ID in our system

    console.log('\n=== Chart Data Validation: Bitcoin ===\n');

    for (const range of TIME_RANGES) {
      console.log(`\n--- ${range} ---`);

      try {
        const data = await fetchWraithChartData(btcId, range).catch(e => {
          console.log(`  Haunt API error: ${e.message}`);
          return [];
        });

        console.log(`  Data points: ${data.length}`);

        const issues = validateOhlcData(data);

        if (data.length > 0) {
          const first = data[0];
          const last = data[data.length - 1];
          console.log(`  Time range: ${formatTimestamp(first.time)} to ${formatTimestamp(last.time)}`);
          console.log(`  Price range: $${first.close.toFixed(2)} to $${last.close.toFixed(2)}`);

          if (issues.length === 0) {
            console.log(`  ✓ Data is valid`);
          } else {
            console.log(`  ✗ Found ${issues.length} issues:`);
            issues.slice(0, 5).forEach(issue => console.log(`    - ${issue}`));
            if (issues.length > 5) {
              console.log(`    ... and ${issues.length - 5} more`);
            }
          }

          results.push({
            range,
            points: data.length,
            startTime: formatTimestamp(first.time),
            endTime: formatTimestamp(last.time),
            startPrice: first.close,
            endPrice: last.close,
            isValid: issues.length === 0,
            issues,
          });
        } else {
          console.log(`  ✗ No data available`);
          results.push({
            range,
            points: 0,
            startTime: '',
            endTime: '',
            startPrice: 0,
            endPrice: 0,
            isValid: false,
            issues: ['No data returned from API'],
          });
        }

      } catch (error) {
        console.log(`  Error: ${error}`);
        results.push({
          range,
          points: 0,
          startTime: '',
          endTime: '',
          startPrice: 0,
          endPrice: 0,
          isValid: false,
          issues: [`Error: ${error}`],
        });
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n=== Summary ===');
    results.forEach(r => {
      const status = r.isValid ? '✓' : '✗';
      console.log(`${status} ${r.range}: ${r.points} points${r.issues.length > 0 ? ` (${r.issues.length} issues)` : ''}`);
    });

    // Assert that at least some ranges have valid data
    const validRanges = results.filter(r => r.isValid && r.points > 0);
    expect(validRanges.length).toBeGreaterThan(0);
  });

  test('capture chart screenshots at all time ranges', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('http://localhost:5173/asset/1');
    await page.waitForTimeout(5000); // Wait for initial load

    console.log('\n=== Capturing Screenshots ===\n');

    // Capture each time range
    for (const range of TIME_RANGES) {
      console.log(`Capturing ${range}...`);

      // Click the time range button
      const rangeButton = page.getByText(range, { exact: true }).first();
      if (await rangeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await rangeButton.click();
        await page.waitForTimeout(3000); // Wait for chart to update

        // Capture Area chart
        await page.screenshot({
          path: `e2e/screenshots/btc-area-${range.toLowerCase()}.png`,
          fullPage: true
        });
        console.log(`  ✓ Area ${range}`);

        // Switch to Candle and capture
        const candleButton = page.getByText('Candle', { exact: true }).first();
        if (await candleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await candleButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({
            path: `e2e/screenshots/btc-candle-${range.toLowerCase()}.png`,
            fullPage: true
          });
          console.log(`  ✓ Candle ${range}`);
        }

        // Switch back to Area
        const areaButton = page.getByText('Area', { exact: true }).first();
        if (await areaButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await areaButton.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log(`  ✗ Could not find ${range} button`);
      }
    }

    console.log('\n=== Screenshots captured ===');
  });
});
