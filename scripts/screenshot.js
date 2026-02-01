import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport to match a typical desktop
  await page.setViewport({
    width: 1440,
    height: 900,
    deviceScaleFactor: 2, // Retina display
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for the app to load and skeleton to disappear
  console.log('Waiting for content to load...');
  await page.waitForSelector('[data-testid="asset-list"]', { timeout: 10000 }).catch(() => {
    console.log('No test ID found, waiting 3 seconds instead...');
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take full page screenshot
  const screenshotPath = path.join(__dirname, '..', 'screenshots', `app-${Date.now()}.png`);
  console.log(`Taking screenshot: ${screenshotPath}`);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  // Also take a viewport screenshot
  const viewportPath = path.join(__dirname, '..', 'screenshots', `viewport-${Date.now()}.png`);
  await page.screenshot({
    path: viewportPath,
    fullPage: false,
  });

  console.log('Screenshots saved!');
  console.log(`Full page: ${screenshotPath}`);
  console.log(`Viewport: ${viewportPath}`);

  await browser.close();
}

takeScreenshots().catch(console.error);
