/**
 * Asset image utilities for top movers
 * CMC ID mapping for common symbols (for avatar images)
 */

/** CMC ID mapping for common symbols */
export const SYMBOL_TO_CMC_ID: Record<string, number> = {
  // Top 50 by market cap
  BTC: 1,
  ETH: 1027,
  USDT: 825,
  BNB: 1839,
  SOL: 5426,
  XRP: 52,
  USDC: 3408,
  ADA: 2010,
  DOGE: 74,
  AVAX: 5805,
  TRX: 1958,
  DOT: 6636,
  LINK: 1975,
  TON: 11419,
  MATIC: 3890,
  SHIB: 5994,
  LTC: 2,
  BCH: 1831,
  DAI: 4943,
  ATOM: 3794,
  UNI: 7083,
  XLM: 512,
  NEAR: 6535,
  APT: 21794,
  OKB: 3897,
  ICP: 8916,
  FIL: 2280,
  HBAR: 4642,
  ARB: 11841,
  VET: 3077,
  MKR: 1518,
  OP: 11840,
  INJ: 7226,
  IMX: 10603,
  GRT: 6719,
  RUNE: 4157,
  THETA: 2416,
  FTM: 3513,
  ALGO: 4030,
  SAND: 6210,
  MANA: 1966,
  AAVE: 7278,
  XTZ: 2011,
  FLOW: 4558,
  AXS: 6783,
  EOS: 1765,
  SNX: 2586,
  EGLD: 6892,
  NEO: 1376,
  KAVA: 4846,
  // Privacy coins
  XMR: 328,
  ZEC: 1437,
  DASH: 131,
  // DeFi
  CRV: 6538,
  COMP: 5692,
  SUSHI: 6758,
  YFI: 5864,
  "1INCH": 8104,
  BAL: 5728,
  LDO: 8000,
  RPL: 2943,
  CAKE: 7186,
  // Layer 2 / Scaling
  LRC: 1934,
  ZK: 24091,
  STRK: 22691,
  METIS: 9640,
  BOBA: 14556,
  // Gaming / Metaverse
  ENJ: 2130,
  GALA: 7080,
  ILV: 8719,
  WAXP: 2300,
  ROSE: 7653,
  GMT: 18069,
  PRIME: 23711,
  // Infrastructure
  FET: 3773,
  RNDR: 5690,
  AR: 5632,
  STORJ: 1772,
  OCEAN: 3911,
  AGIX: 2424,
  // Exchange tokens
  CRO: 3635,
  KCS: 2087,
  GT: 4269,
  HT: 2502,
  LEO: 3957,
  // Meme coins
  PEPE: 24478,
  FLOKI: 10804,
  BONK: 23095,
  WIF: 28752,
  // Others
  QNT: 3155,
  IOTA: 1720,
  XDC: 2634,
  KSM: 5034,
  ZIL: 2469,
  ONE: 3945,
  CELO: 5567,
  SUI: 20947,
  SEI: 23149,
  TIA: 22861,
  PYTH: 28177,
  JTO: 28541,
  JUP: 29210,
  WLD: 13502,
  BLUR: 23121,
  DYDX: 11156,
  GMX: 11857,
  ONDO: 21159,
  CFX: 7334,
  ORDI: 25028,
  STX: 4847,
  KLAY: 4256,
};

/**
 * Get asset image URL from CMC
 * @param symbol - Asset symbol (e.g., "BTC", "ETH")
 * @returns CMC image URL or empty string
 */
export function getAssetImage(symbol: string): string {
  const id = SYMBOL_TO_CMC_ID[symbol.toUpperCase()];
  if (id) {
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
  }
  return "";
}
