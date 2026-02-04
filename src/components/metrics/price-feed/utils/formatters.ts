/**
 * Formatters and constants for price feed display
 */

import type { PriceSourceId } from "../types";

/** Map symbol to name for display */
export const SYMBOL_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  bnb: "BNB",
  sol: "Solana",
  xrp: "XRP",
  doge: "Dogecoin",
  ada: "Cardano",
  avax: "Avalanche",
  dot: "Polkadot",
  link: "Chainlink",
  matic: "Polygon",
  shib: "Shiba Inu",
  ltc: "Litecoin",
  trx: "Tron",
  atom: "Cosmos",
  uni: "Uniswap",
  xlm: "Stellar",
  bch: "Bitcoin Cash",
  near: "NEAR",
  apt: "Aptos",
};

/** Source display names */
const SOURCE_NAMES: Record<PriceSourceId, string> = {
  binance: "Binance",
  coinbase: "Coinbase",
  coinmarketcap: "CMC",
  coingecko: "CoinGecko",
  cryptocompare: "CryptoCompare",
  kraken: "Kraken",
  kucoin: "KuCoin",
  okx: "OKX",
  huobi: "Huobi",
};

/**
 * Format source ID to display name
 * @param source - Price source ID
 * @returns Display name for the source
 */
export function formatSource(source?: PriceSourceId): string {
  if (!source) return "";
  return SOURCE_NAMES[source] || source;
}

/**
 * Format seconds to human-readable uptime
 * @param secs - Number of seconds
 * @returns Formatted uptime string (e.g., "2d 5h", "3h 45m", "12m")
 */
export function formatUptime(secs: number): string {
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
