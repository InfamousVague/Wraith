#!/usr/bin/env node
/**
 * WebSocket debugging script
 * Tests WebSocket connectivity and message flow
 */

const puppeteer = require("puppeteer");

const APP_URL = "http://localhost:5173";
const DURATION = 15000;

async function debugWS() {
  console.log("🔌 WebSocket Debug Diagnostic\n");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  // Collect ALL console messages
  const allMessages = [];
  const wsRelated = [];
  const hauntLogs = [];
  const errors = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();

    allMessages.push({ type, text: text.substring(0, 200), time: Date.now() });

    // Capture WebSocket and Haunt related logs
    if (text.toLowerCase().includes("ws") || text.toLowerCase().includes("socket")) {
      wsRelated.push(text.substring(0, 300));
    }
    if (text.includes("Haunt") || text.includes("haunt")) {
      hauntLogs.push(text.substring(0, 300));
    }
    if (text.includes("Message:") || text.includes("price_update")) {
      console.log("📨 WS Message:", text.substring(0, 150));
    }
    if (type === "error") {
      errors.push(text.substring(0, 200));
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`Page error: ${err.message}`);
  });

  console.log("📡 Navigating to app...\n");

  try {
    await page.goto(APP_URL, { waitUntil: "networkidle2", timeout: 30000 });
    console.log("✅ Page loaded\n");
  } catch (err) {
    console.log("⚠️ Page load issue:", err.message, "\n");
  }

  // Check WebSocket connectivity via page evaluation
  const wsStatus = await page.evaluate(() => {
    // Check for active WebSocket connections
    const performance = window.performance;
    const entries = performance.getEntriesByType("resource");
    const wsEntries = entries.filter((e) => e.name.includes("ws://") || e.name.includes("wss://"));

    return {
      hasWebSockets: wsEntries.length > 0,
      wsEntries: wsEntries.map((e) => e.name),
    };
  });

  console.log("WebSocket Status:", wsStatus);
  console.log("");

  console.log(`⏳ Monitoring for ${DURATION / 1000} seconds...\n`);
  await new Promise((resolve) => setTimeout(resolve, DURATION));

  await browser.close();

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📊 RESULTS");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log(`Total console messages: ${allMessages.length}`);
  console.log(`WS-related messages: ${wsRelated.length}`);
  console.log(`Haunt logs: ${hauntLogs.length}`);
  console.log(`Errors: ${errors.length}`);

  if (hauntLogs.length > 0) {
    console.log("\n🔍 Haunt Logs (first 10):");
    hauntLogs.slice(0, 10).forEach((log) => {
      console.log(`  ${log}`);
    });
  }

  if (wsRelated.length > 0) {
    console.log("\n🔌 WS Related Logs (first 10):");
    wsRelated.slice(0, 10).forEach((log) => {
      console.log(`  ${log}`);
    });
  }

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.slice(0, 10).forEach((err) => {
      console.log(`  ${err}`);
    });
  }

  // Show sample of all messages
  console.log("\n📝 Sample Console Messages (first 20):");
  allMessages.slice(0, 20).forEach((msg) => {
    console.log(`  [${msg.type}] ${msg.text}`);
  });
}

debugWS().catch(console.error);
