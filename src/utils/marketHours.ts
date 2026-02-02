/**
 * Market hours utilities for determining if markets are currently open.
 */

export type MarketStatus = "open" | "closed" | "24/7";

/**
 * Check if US stock market is currently open.
 * NYSE/NASDAQ: 9:30 AM - 4:00 PM ET, Monday-Friday
 * Does not account for holidays.
 */
export function isUSMarketOpen(): boolean {
  const now = new Date();

  // Convert to ET (Eastern Time)
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Market open: 9:30 AM = 570 minutes
  // Market close: 4:00 PM = 960 minutes
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  // Check if weekday (1-5)
  if (day === 0 || day === 6) {
    return false;
  }

  // Check if within market hours
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

/**
 * Get market status for an asset type.
 */
export function getMarketStatus(assetType?: string): MarketStatus {
  if (!assetType || assetType === "crypto") {
    return "24/7"; // Crypto markets are always open
  }

  if (assetType === "stock" || assetType === "etf") {
    return isUSMarketOpen() ? "open" : "closed";
  }

  // Forex markets: Sunday 5 PM ET - Friday 5 PM ET
  if (assetType === "forex") {
    const now = new Date();
    const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = etTime.getDay();
    const hours = etTime.getHours();

    // Closed: Saturday all day, Sunday until 5 PM
    if (day === 6) return "closed";
    if (day === 0 && hours < 17) return "closed";
    // Closed: Friday after 5 PM
    if (day === 5 && hours >= 17) return "closed";

    return "open";
  }

  return "24/7"; // Default to always open
}

/**
 * Format market status for display.
 */
export function formatMarketStatus(status: MarketStatus): string {
  switch (status) {
    case "open":
      return "Market Open";
    case "closed":
      return "Market Closed";
    case "24/7":
      return "24/7";
    default:
      return "Unknown";
  }
}

/**
 * Get next market open time for US markets.
 */
export function getNextMarketOpen(): Date | null {
  if (isUSMarketOpen()) {
    return null; // Market is currently open
  }

  const now = new Date();
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  // Start from today at 9:30 AM ET
  const nextOpen = new Date(etTime);
  nextOpen.setHours(9, 30, 0, 0);

  // If we're past market open today, move to tomorrow
  if (etTime > nextOpen) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  // Skip weekends
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  return nextOpen;
}
