export type TradeDirection = "up" | "down" | undefined;

export type AssetTypeValue = "crypto" | "stock" | "etf";

export type Asset = {
  id: number;
  rank: number;
  name: string;
  symbol: string;
  image: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply?: number;
  sparkline: number[];
  /** Last trade direction (up = buy, down = sell) */
  tradeDirection?: TradeDirection;
  /** Asset type discriminator: "crypto", "stock", "etf" */
  assetType?: AssetTypeValue;
  /** Exchange name (for stocks/ETFs): "NASDAQ", "NYSE" */
  exchange?: string;
  /** Sector (for stocks): "Technology", "Healthcare" */
  sector?: string;
};
