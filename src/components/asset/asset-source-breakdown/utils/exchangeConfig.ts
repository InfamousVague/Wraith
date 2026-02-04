/**
 * Exchange configuration and brand colors
 */

import type { ExchangeConfig } from "../types";

/** Exchange display names and brand colors */
export const EXCHANGE_CONFIG: Record<string, ExchangeConfig> = {
  binance: { name: "Binance", color: "#F0B90B" },
  coinbase: { name: "Coinbase", color: "#0052FF" },
  coinmarketcap: { name: "CMC", color: "#3861FB" },
  coingecko: { name: "CoinGecko", color: "#8DC63F" },
  cryptocompare: { name: "CryptoCompare", color: "#FF9500" },
  kraken: { name: "Kraken", color: "#5741D9" },
  kucoin: { name: "KuCoin", color: "#23AF91" },
  okx: { name: "OKX", color: "#FFFFFF" },
  huobi: { name: "Huobi", color: "#1E88E5" },
};

/**
 * Get exchange configuration by source key
 * @param sourceKey - Lowercase exchange identifier
 * @returns Exchange config or default fallback
 */
export function getExchangeConfig(sourceKey: string): ExchangeConfig {
  return EXCHANGE_CONFIG[sourceKey.toLowerCase()] || { name: sourceKey, color: "#888" };
}
