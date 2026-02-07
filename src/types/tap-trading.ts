/**
 * @file tap-trading.ts
 * @description TypeScript types for the Tap Trading feature.
 *
 * Tap Trading is a real-time prediction trading interface where users
 * place bets on a 2D grid (price x time). Each cell has a multiplier
 * derived from one-touch barrier option pricing (reflection principle).
 */

// ---------------------------------------------------------------------------
// Grid Configuration (from backend)
// ---------------------------------------------------------------------------

/** Grid configuration received from Haunt backend */
export type GridConfig = {
  /** Symbol being traded (e.g., "BTC") */
  symbol: string;
  /** Number of price rows */
  row_count: number;
  /** Number of time columns */
  col_count: number;
  /** Duration per column in milliseconds */
  interval_ms: number;
  /** Height of each row in price units */
  row_height: number;
  /** Upper price bound of the grid */
  price_high: number;
  /** Lower price bound of the grid */
  price_low: number;
  /** Current column index (increments as time passes) */
  current_col_index: number;
  /** Platform house edge (e.g., 0.05 = 5%) */
  house_edge: number;
  /** Minimum multiplier floor */
  min_multiplier: number;
  /** Maximum multiplier ceiling */
  max_multiplier: number;
  /** Maximum simultaneous trades per portfolio */
  max_active_trades: number;
  /** Minimum bet amount */
  min_trade_amount: number;
  /** Available bet size presets */
  bet_size_presets: number[];
  /** Available leverage presets */
  leverage_presets: number[];
  /** Maximum leverage allowed */
  max_leverage: number;
  /** Sensitivity factor — amplifies grid reaction to price changes */
  sensitivity_factor: number;
  /** Minimum time buffer (ms) before column expiry to accept trades */
  min_time_buffer_ms: number;
};

// ---------------------------------------------------------------------------
// Trading Positions
// ---------------------------------------------------------------------------

/** Status of a tap trading position */
export type TapPositionStatus = "active" | "won" | "lost" | "pending";

/** Visual state of an active tile on the grid */
export type TileVisualState = "active" | "approaching" | "won" | "lost";

/** A placed tap trade position */
export type TapPosition = {
  /** Unique position ID from backend */
  id: string;
  /** Portfolio ID that owns this position */
  portfolio_id: string;
  /** Trading symbol (e.g., "BTC") */
  symbol: string;
  /** Row index in the grid */
  row_index: number;
  /** Column index in the grid */
  col_index: number;
  /** Bet amount in USD */
  amount: number;
  /** Applied leverage (1x, 2x, 5x, 10x) */
  leverage: number;
  /** Locked multiplier at time of placement */
  multiplier: number;
  /** Lower price bound of the cell */
  price_low: number;
  /** Upper price bound of the cell */
  price_high: number;
  /** Start time of the cell's time window (epoch ms) */
  time_start: number;
  /** End time of the cell's time window (epoch ms) */
  time_end: number;
  /** Current status */
  status: TapPositionStatus;
  /** P&L result (set on resolution) */
  result_pnl?: number;
  /** Payout amount (set on win) */
  payout?: number;
  /** Timestamp when trade was placed */
  created_at: number;
  /** Timestamp when trade was resolved */
  resolved_at?: number;
};

// ---------------------------------------------------------------------------
// Rolling 24h Stats
// ---------------------------------------------------------------------------

/** Rolling 24h stats for a symbol */
export type TapStats = {
  /** Total trades in last 24h */
  total_trades: number;
  /** Number of wins */
  wins: number;
  /** Number of losses */
  losses: number;
  /** Win rate (0.0 – 1.0) */
  win_rate: number;
  /** Current win streak */
  win_streak: number;
  /** Net profit/loss in last 24h */
  net_pnl: number;
  /** Total wagered */
  total_wagered: number;
  /** Total payouts received */
  total_payouts: number;
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** Notification type for banner display */
export type TapNotificationType = "win" | "error";

/** A notification banner entry */
export type TapNotification = {
  /** Unique ID */
  id: string;
  /** Notification type */
  type: TapNotificationType;
  /** Display message */
  message: string;
  /** Amount (for win notifications) */
  amount?: number;
  /** Timestamp when created */
  timestamp: number;
};

// ---------------------------------------------------------------------------
// Settings (persisted to localStorage)
// ---------------------------------------------------------------------------

/** Multiplier color display mode */
export type MultiplierColorMode = "consistent" | "heatmap" | "opacity";

/** Grid line visual style */
export type GridLineStyle = "solid" | "dashed" | "dotted";

/** Sparkline thickness option */
export type SparklineThickness = 1 | 2 | 3;

/** Tile glow intensity */
export type GlowIntensity = "off" | "subtle" | "bright";

/** Animation speed preset */
export type AnimationSpeed = "slow" | "normal" | "fast";

/** Full tap trading settings (persisted to localStorage) */
export type TapSettings = {
  /** Multiplier display mode */
  multiplierColorMode: MultiplierColorMode;
  /** Grid line opacity (0–100) */
  gridLineOpacity: number;
  /** Sparkline line thickness in px */
  sparklineThickness: SparklineThickness;
  /** Show time labels on bottom edge */
  showTimeLabels: boolean;
  /** Show price labels on right edge */
  showPriceLabels: boolean;
  /** Tile glow intensity */
  glowIntensity: GlowIntensity;
  /** Animation speed preset */
  animationSpeed: AnimationSpeed;
  /** Grid line style */
  gridLineStyle: GridLineStyle;
};

/** Default settings */
export const DEFAULT_TAP_SETTINGS: TapSettings = {
  multiplierColorMode: "consistent",
  gridLineOpacity: 20,
  sparklineThickness: 2,
  showTimeLabels: true,
  showPriceLabels: true,
  glowIntensity: "subtle",
  animationSpeed: "normal",
  gridLineStyle: "solid",
};

// ---------------------------------------------------------------------------
// WebSocket Events
// ---------------------------------------------------------------------------

/** Multiplier matrix update from server (every 1s) */
export type GridMultiplierUpdate = {
  symbol: string;
  /** [row][col] matrix of multiplier values */
  multipliers: number[][];
  config: GridConfig;
  current_price: number;
  current_col_index: number;
  timestamp: number;
};

/** Trade placed confirmation from server */
export type GridTradePlaced = {
  position: TapPosition;
  timestamp: number;
};

/** Trade resolved event from server */
export type GridTradeResolved = {
  position: TapPosition;
  won: boolean;
  payout: number;
  pnl: number;
  timestamp: number;
};

/** Column expired event with batch resolutions */
export type GridColumnExpired = {
  symbol: string;
  col_index: number;
  time_end: number;
  results: Array<{
    position_id: string;
    won: boolean;
    payout: number;
    pnl: number;
  }>;
  timestamp: number;
};

// ---------------------------------------------------------------------------
// Hook Return Types
// ---------------------------------------------------------------------------

/** Return type of the useTapTrading hook */
export type UseTapTradingReturn = {
  /** Grid configuration from backend */
  gridConfig: GridConfig | null;
  /** Multiplier matrix [row][col] */
  multipliers: number[][];
  /** Active and recently-resolved positions */
  activePositions: TapPosition[];
  /** Current price of the asset */
  currentPrice: number;
  /** Price history for sparkline */
  priceHistory: Array<{ time: number; price: number }>;
  /** Place a trade at (row, col) with optional bet amount and leverage */
  placeTrade: (row: number, col: number, amount?: number, leverage?: number, timeStart?: number, timeEnd?: number) => Promise<void>;
  /** Rolling 24h stats */
  stats: TapStats | null;
  /** Bet size presets from config */
  betSizePresets: number[];
  /** Leverage presets from config */
  leveragePresets: number[];
  /** WebSocket connected */
  connected: boolean;
  /** Loading initial data */
  loading: boolean;
  /** Error message if any */
  error: string | null;
};

// ---------------------------------------------------------------------------
// Trade Placement Request
// ---------------------------------------------------------------------------

/** Client -> Server trade placement request */
export type PlaceTradeRequest = {
  symbol: string;
  row_index: number;
  col_index: number;
  amount: number;
  leverage: number;
};
