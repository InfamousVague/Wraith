#!/usr/bin/env node
/**
 * Error tracing diagnostic script
 * Captures the exact source and rate of the "text node" errors
 */

const puppeteer = require("puppeteer");

const APP_URL = "http://localhost:5173";
const DURATION = 10000; // 10 seconds

async function traceError() {
  console.log("🔍 Error Tracing Diagnostic\n");
  console.log(`Target: ${APP_URL}`);
  console.log(`Duration: ${DURATION / 1000}s\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  // Collect all console messages
  const errors = [];
  const wsMessages = [];
  const allLogs = [];
  let textNodeErrors = 0;
  let firstErrorStack = null;

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    allLogs.push({ type, text, time: Date.now() });

    // Count text node errors
    if (text.includes("Unexpected text node:")) {
      textNodeErrors++;
      // Capture the first error's stack trace
      if (!firstErrorStack && msg.stackTrace().length > 0) {
        firstErrorStack = msg.stackTrace().map((frame) => ({
          url: frame.url,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
          functionName: frame.functionName,
        }));
      }
      // Also capture the error text to see what character it is
      if (textNodeErrors <= 5) {
        errors.push({
          message: text,
          time: Date.now(),
          stack: msg.stackTrace().map((f) => `${f.functionName || "anonymous"} @ ${f.url}:${f.lineNumber}`),
        });
      }
    }

    // Track WebSocket messages
    if (text.includes("[HauntSocket] Message:")) {
      wsMessages.push({ text, time: Date.now() });
    }
  });

  page.on("pageerror", (err) => {
    allLogs.push({ type: "error", text: err.message, time: Date.now() });
  });

  console.log("📡 Navigating to app...\n");

  try {
    await page.goto(APP_URL, { waitUntil: "networkidle2", timeout: 30000 });
    console.log("✅ Page loaded successfully\n");
  } catch (err) {
    console.log("⚠️  Page load issue:", err.message, "\n");
  }

  console.log(`⏳ Monitoring for ${DURATION / 1000} seconds...\n`);
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, DURATION));
  const endTime = Date.now();

  await browser.close();

  // Analysis
  const duration = (endTime - startTime) / 1000;
  const errorRate = textNodeErrors / duration;
  const wsRate = wsMessages.length / duration;

  console.log("═".repeat(60));
  console.log("📊 RESULTS");
  console.log("═".repeat(60));

  console.log(`\n📈 Error Statistics:`);
  console.log(`   Total text node errors: ${textNodeErrors}`);
  console.log(`   Error rate: ${errorRate.toFixed(2)} per second`);
  console.log(`   WebSocket messages: ${wsMessages.length}`);
  console.log(`   WS message rate: ${wsRate.toFixed(2)} per second`);
  console.log(`   Error/WS ratio: ${wsMessages.length > 0 ? (textNodeErrors / wsMessages.length).toFixed(2) : "N/A"}`);

  if (errors.length > 0) {
    console.log(`\n🐛 First 5 Error Details:`);
    errors.forEach((err, i) => {
      console.log(`\n   Error ${i + 1}:`);
      console.log(`   Message: ${err.message}`);
      if (err.stack.length > 0) {
        console.log(`   Stack:`);
        err.stack.slice(0, 5).forEach((frame) => {
          console.log(`     - ${frame}`);
        });
      }
    });
  }

  if (firstErrorStack) {
    console.log(`\n📍 First Error Stack Trace:`);
    firstErrorStack.slice(0, 10).forEach((frame) => {
      console.log(`   ${frame.functionName || "anonymous"} @ ${frame.url}:${frame.lineNumber}:${frame.columnNumber}`);
    });
  }

  // Check for patterns
  console.log(`\n🔎 Analysis:`);

  if (textNodeErrors === 0) {
    console.log("   ✅ No text node errors detected!");
  } else if (errorRate > 100) {
    console.log("   🚨 CRITICAL: Very high error rate indicates infinite loop or constant re-render");
    if (errorRate > wsRate * 10) {
      console.log("   💡 Error rate >> WS rate: Issue likely in render cycle, not WS updates");
    } else if (Math.abs(errorRate - wsRate) < wsRate * 0.2) {
      console.log("   💡 Error rate ≈ WS rate: Each WS update triggers one error");
    }
  } else if (errorRate > 10) {
    console.log("   ⚠️  Moderate error rate - likely one error per WS update");
  }

  // Check recent logs for render patterns
  const recentRenderLogs = allLogs.filter((l) => l.text.includes("render") || l.text.includes("Render"));
  if (recentRenderLogs.length > 100) {
    console.log(`   ⚠️  High render activity detected: ${recentRenderLogs.length} render-related logs`);
  }

  console.log("\n" + "═".repeat(60));
}

traceError().catch(console.error);
