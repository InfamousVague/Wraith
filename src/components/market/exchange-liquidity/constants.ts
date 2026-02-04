/**
 * Exchange configuration constants
 */

export type ExchangeConfig = {
  name: string;
  color: string;
};

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

/** Default exchange config for unknown sources */
export const DEFAULT_EXCHANGE_CONFIG: ExchangeConfig = {
  name: "Unknown",
  color: "#888",
};
