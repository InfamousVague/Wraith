# Tap Trading — Complete Implementation Plan

## Table of Contents

1. [Overview](#1-overview)
2. [How Tap Trading Works](#2-how-tap-trading-works)
3. [Mathematical Model — The Nuts & Bolts](#3-mathematical-model)
4. [Video Reference Analysis](#4-video-reference-analysis)
5. [Architecture Overview](#5-architecture-overview)
6. [Backend (Haunt) — Existing Code & Changes](#6-backend-haunt)
7. [Frontend (Wraith) — Full Component Breakdown](#7-frontend-wraith)
8. [WebSocket Protocol](#8-websocket-protocol)
9. [Anti-Cheat & Validation](#9-anti-cheat--validation)
10. [Configuration & Tunables](#10-configuration--tunables)
11. [Implementation Phases](#11-implementation-phases)
12. [File Map](#12-file-map)
13. [Verification Plan](#13-verification-plan)
14. [Open Questions](#14-open-questions)

---

## 1. Overview

Tap Trading is a real-time prediction trading interface where users place bets on a 2D grid (price × time). A live sparkline shows the current price. The grid overlays future time columns and price rows. Each cell displays a **multiplier** — the payout ratio if the price touches that cell's price band during that cell's time window. Users tap a cell to place a bet. If the sparkline crosses through the cell, they win `bet × multiplier`. If time expires without a touch, they lose the bet.

**Route**: `/tap/:symbol?` (default symbol: BTC)

**Core Concept**: Gamified one-touch binary options. The multiplier is derived from the statistical probability of price touching a barrier level within a time window. Higher multipliers = lower probability = harder to win. The grid provides an intuitive visual representation of risk/reward.

---

## 2. How Tap Trading Works

### 2.1 The Grid

The screen is divided into two zones:
- **Left ~35-40%**: Sparkline chart showing recent price history, terminating at a **dot** (the current price point)
- **Right ~60-65%**: The grid of tappable cells extending into the future

The grid has:
- **Rows (Y-axis)**: Discrete price bands. Each row covers a price range (e.g., $2,993.0 – $2,993.5). Price labels on the right edge.
- **Columns (X-axis)**: Discrete time windows. Each column covers a future time interval (e.g., 09:42:15 AM – 09:42:30 AM). Time labels along the bottom.
- **Cells**: Each intersection of row × column displays a multiplier value (e.g., "3.47X").

### 2.2 Placing a Trade

1. User taps a cell in the grid (must be a future column — cannot tap past/expired columns)
2. The cell becomes "locked" — shows the bet amount and locked multiplier (e.g., "$5 / 3.47X")
3. The bet amount is deducted from the user's balance immediately
4. The trade is registered on the backend with the locked multiplier, price band, and time window

### 2.3 Win Condition

The sparkline (real-time price) enters the cell's price band during the cell's time window. That is:
- `price_low ≤ current_price ≤ price_high` at any tick where `time_start ≤ tick_time ≤ time_end`
- **Payout**: `bet_amount × leverage × multiplier` (credited to balance)
- Visual: tile turns green, "You won $X.XX" banner at top

### 2.4 Loss Condition

The column's time window expires and the price never entered the cell's price band:
- **Loss**: the bet amount (not leveraged amount) is forfeit
- Visual: tile turns orange/red, fades out as it scrolls into the past

### 2.5 The Sparkline Dot as Anchor

The entire page is **vertically anchored** to the sparkline dot. As the price moves up/down, the grid scrolls vertically so the current price row stays aligned with the dot. The dot remains at a fixed vertical position on screen (~center or slightly above). This means:
- Price goes up → grid slides down (higher price rows become visible)
- Price goes down → grid slides up (lower price rows become visible)
- The grid always shows the price neighborhood around the current price

### 2.6 Time Scrolling

The grid scrolls **continuously to the left** as time passes. The leftmost grid column is always the "current" time column (or the next upcoming column). As a column's time window expires:
- All bets in that column are resolved (win/loss)
- The column scrolls off the left edge and becomes part of the sparkline history
- A new future column appears on the right edge

### 2.7 Leverage

Users can apply leverage (1x–10x) to their bets:
- Leverage multiplies the **effective amount** for payout calculation: `payout = amount × leverage × multiplier`
- On loss, the user only loses the original `amount` (not the leveraged amount)
- Higher leverage = higher potential reward, same downside risk

### 2.8 Bet Sizing

Configurable bet size via a popup picker. Tapping the bet size pill (bottom-right) opens a picker showing all presets. Default bet size: **$5**.

**Presets**: $1, $5, $10, $25, $50 (configurable from backend).

---

## 3. Mathematical Model

### 3.1 Core Concept: One-Touch Barrier Option Pricing

Each grid cell is mathematically equivalent to a **one-touch digital barrier option**:
- **Barrier**: The price band of the cell (price_low to price_high)
- **Expiry**: The time window of the cell (time_start to time_end)
- **Payout**: Binary — either full multiplier or zero

The multiplier is derived from: `multiplier = (1 / P(touch)) × (1 - house_edge)`

Where `P(touch)` is the probability that the price will touch the cell's price band during the time window.

### 3.2 Probability Calculation — Reflection Principle

Using the log-normal Brownian motion model with the reflection principle for barrier options:

```
P(touch) = 2 × N(-d)

where:
  d = |ln(target_price / current_price)| / (σ × √T)

  target_price = midpoint of the cell's price band
  σ = annualized volatility (estimated from recent price ticks)
  T = time to the midpoint of the cell's time window (in years)
  N() = standard normal cumulative distribution function
```

**Why reflection principle?** For a continuous Brownian motion, the probability of *ever touching* a barrier before time T is exactly `2 × N(-d)`. This accounts for the fact that the price can touch and bounce back — what matters is whether it touches at all, not where it ends up.

### 3.3 Volatility Estimation

Rolling window of recent price ticks (default: 500 ticks):

```
1. Calculate log returns: r_i = ln(price_i / price_{i-1})
2. Compute standard deviation: σ_tick = stdev(r_1, ..., r_n)
3. Annualize: σ = σ_tick × √(ticks_per_year)
4. Clamp to [0.01, 10.0] to prevent extremes
```

Default fallback: 100% annualized volatility (typical for crypto).

### 3.4 Multiplier Computation

For each cell `(row, col)`:

```
1. Calculate price distance:
   target_price = price_low + (row + 0.5) × row_height
   price_distance = |ln(target_price / current_price)|

2. Calculate time distance:
   time_to_col = midpoint of column's time window (in years)

3. Calculate touch probability:
   d = price_distance / (σ × √time_to_col)
   P(touch) = 2 × N(-d)
   P(touch) = clamp(P(touch), 0.001, 0.999)

4. Calculate probability-based multiplier:
   prob_mult = (1 / P(touch)) × (1 - HOUSE_EDGE)

5. Calculate radial distance multiplier (safety floor):
   norm_row_dist = |row - current_price_row| / (row_count / 2)
   norm_col_dist = (col + 0.5) / col_count
   radial_dist = √(norm_row_dist² + norm_col_dist² × 0.3)
   radial_mult = 1.1 + (radial_dist × 3.5)²

6. Final multiplier:
   multiplier = max(prob_mult, radial_mult)
   multiplier = clamp(multiplier, MIN_MULTIPLIER, MAX_MULTIPLIER)
```

### 3.5 The Radial Gradient Pattern

The multiplier pattern naturally forms a **radial gradient** centered on the cell at (current_price, current_time):

| Distance from center | Typical multiplier | Probability |
|---|---|---|
| Center (current price, next column) | ~1.5–2.0x | ~50–65% |
| 1 row away, same column | ~2.5–3.5x | ~25–35% |
| 2 rows away, same column | ~4.5–6.5x | ~12–18% |
| 3 rows away, same column | ~8–15x | ~5–10% |
| 4+ rows away | ~15–30x | ~2–5% |
| Corner cells (far price + far time) | ~25–100x | <2% |

**Key insight**: Small price movements cause large multiplier shifts because the probability function is exponentially sensitive to the distance-to-volatility ratio. A $0.50 price move on a $3000 asset shifts the radial center by a full row, dramatically changing all multipliers.

### 3.6 Grid Sizing — Dynamic Based on Volatility

The grid's price span adjusts based on current volatility:

```
expected_move = current_price × σ × √(total_grid_time_in_years)
grid_half_span = expected_move × 3.0  (covers ~99.7% of expected movement)
grid_half_span = max(grid_half_span, current_price × 0.005)  (minimum 0.5%)

price_high = current_price + grid_half_span
price_low  = current_price - grid_half_span
row_height = (price_high - price_low) / row_count
```

### 3.7 Optimal Column Interval

The time interval per column is tuned to volatility so that the price moves roughly ~0.1% per column on average:

```
vol_per_ms = annualized_vol / √(ms_per_year)
interval_ms = (0.001 / vol_per_ms)²
interval_ms = clamp(interval_ms, 5000, 120000)  // 5s to 2min
```

### 3.8 House Edge

A flat percentage taken from the theoretical fair multiplier:
- Default: **5%** (`HOUSE_EDGE = 0.05`)
- Applied as: `multiplier = fair_multiplier × (1 - HOUSE_EDGE)`
- This ensures the platform has a statistical edge over time
- Configurable on the backend per-symbol or globally

### 3.9 Payout Math

```
effective_amount = bet_amount × leverage
potential_payout = effective_amount × multiplier
net_profit_if_win = potential_payout - bet_amount
loss_if_lose = bet_amount (only the original wager, not leveraged)
```

Example: $5 bet, 2x leverage, 3.47x multiplier:
- effective_amount = $5 × 2 = $10
- potential_payout = $10 × 3.47 = $34.70
- net_profit = $34.70 - $5 = $29.70
- loss = $5

---

## 4. Video Reference Analysis

Frame-by-frame analysis of `Development/example.mp4` (54 seconds, 30fps, 1642×904):

### Frame 1 (t=0s) — Initial State
- Price: $2,992.58, sparkline on left, grid on right
- Grid: ~10 rows × ~12 visible columns
- Multipliers: 2.00x near center, 25.6x at corners
- Price labels on right: $2,991.0 to $2,995.0 ($0.50 increments)
- Time labels on bottom: ~15-second intervals
- Balance: $68.82 (bottom-left)
- Bet size: $1 (bottom-right toggle)
- Asset selector: top-left with price and dropdown arrow

### Frame 5 (t=4s) — First Trades Placed
- Two yellow tiles placed near the sparkline dot
- Tiles show "$5 / 3.47X" — bet amount and locked multiplier
- One tile immediately below another (adjacent rows, same column)
- Balance dropped from $68.82 to ~$56.82
- Bet size now shows $5

### Frame 10 (t=9s) — Multiple Active Trades
- 6 active yellow tiles clustered near the dot
- Tiles at various rows and columns
- Grid has scrolled — earlier tiles now further left
- Balance: $38.82

### Frame 15 (t=14s) — Price Moving Up
- Price risen to $2,994.0 — grid shifted down to follow
- Earlier tiles now below center (price moved away from them)
- Some tiles close to sparkline (approaching resolution)

### Frame 20 (t=19s) — Tiles Separating
- Sparkline moved right, some tiles now clearly in past columns
- 4 active tiles remaining at various distances
- Multipliers all real-time updated in non-occupied cells

### Frame 25 (t=24s) — Price Consolidating
- Only 2 active tiles remaining
- Other tiles have resolved (scrolled off or resolved)

### Frame 30 (t=29s) — Clean Grid
- All previous trades resolved
- Fresh grid with no active tiles
- Balance: $28.82

### Frame 35 (t=34s) — New Trades
- 2 new tiles placed
- Price at $2,993.2

### Frame 38 (t=37s) — Error States Visible
- **"Insufficient balance."** notification at top
- **"Try another square."** notification below it
- One tile turning **orange/red** — this is a LOSS state (price crossed through that column without hitting that price row)
- Balance: $3.82

### Frame 40 (t=39s) — Continued Trading
- More tiles, some approaching sparkline
- Balance still low

### Frame 42 (t=41s) — Bet Size Toggle
- Bottom-right shows bet size being toggled (switching between $1 and $5)
- 5 active tiles

### Frame 45 (t=44s) — Price Rising
- Price at $2,993.6
- Tiles below current price

### Frame 48 (t=47s) — WIN Animation
- **"+$12.5"** floating text near the sparkline dot (green, animated)
- **"You won $12.55"** banner at top center
- Winning tile resolved, others still active
- Balance jumped from $3.82 to $16.37

### Frame 50 (t=49s) — Another Win
- **"You won $12.55"** banner still visible
- Last tile remaining: $5 / 2.46x

### Frame 54 (t=53s) — Final State
- **"You won $12.30"** banner
- All tiles resolved
- Balance: $28.67
- Clean grid

### Key UI Elements Observed:
1. **Asset selector** (top-left): pill with icon + live price + dropdown
2. **Balance** (bottom-left): running balance with icon
3. **Bet size toggle** (bottom-right): pill showing current bet size, tappable to cycle
4. **Grid** (right ~60%): scrolling cells with multipliers
5. **Sparkline** (left ~40%): recent price with dot at current
6. **Current price label** (right edge): pink/magenta badge at the dot's row
7. **Win notification**: top-center banner "You won $X.XX" with coin icon
8. **Error notifications**: top-center banners for "Insufficient balance" and "Try another square"
9. **Loss state**: tile turns orange/red gradient when resolved as loss
10. **Win state**: tile presumably turns green (hard to catch in 1fps extraction), "+$X.XX" floating text
11. **Glow effect**: active tiles have a subtle glow/shadow (yellow)
12. **Grid dots**: small dots at grid intersection corners

---

## 5. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Wraith (Frontend)                          │
│                                                              │
│  /tap/:symbol                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ TapTradingPage                                         │  │
│  │  ├── LeverageToolbar (top — leverage pills + stats)    │  │
│  │  ├── AssetSelector (top-left)                          │  │
│  │  ├── NotificationBanner (top-center, max 3)            │  │
│  │  ├── TapCanvas (full screen)                           │  │
│  │  │    ├── Canvas2D (grid lines, dots, multipliers,     │  │
│  │  │    │    sparkline, price/time labels)               │  │
│  │  │    └── DOM Overlay (active tiles, price badge)      │  │
│  │  ├── BalancePill (bottom-left)                         │  │
│  │  ├── BetSizeToggle (bottom-right)                      │  │
│  │  └── TapSettings (gear icon dropdown)                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                    │
│              WebSocket + REST API                             │
│                          │                                    │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Haunt (Backend)                            │
│                          │                                    │
│  ┌───────────────────────┴────────────────────────────────┐  │
│  │ GridlineService                                         │  │
│  │  ├── Volatility Engine (rolling σ from price ticks)     │  │
│  │  ├── Multiplier Calculator (reflection principle)       │  │
│  │  ├── Grid Config Generator (dynamic sizing)             │  │
│  │  ├── Trade Validator (anti-cheat, balance, limits)      │  │
│  │  ├── Resolution Engine (price-touch detection)          │  │
│  │  └── Stats Tracker (per-portfolio, per-symbol)          │  │
│  ├── REST API: /api/grid/*                                 │  │
│  ├── WebSocket: price ticks, trade events, multiplier      │  │
│  │   updates, column expirations                           │  │
│  └── SQLite: grid_bets, grid_stats tables                  │  │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Backend (Haunt) — Existing Code & Changes

### 6.1 What Already Exists

The Haunt codebase has a **fully implemented** gridline trading service:

| Component | File | Status |
|---|---|---|
| Types & data structures | `src/types/gridline.rs` | ✅ Complete |
| Core service (multipliers, trades, resolution) | `src/services/gridline.rs` | ✅ Complete |
| REST API endpoints | `src/api/gridline.rs` | ✅ Complete |
| WebSocket event types | `src/types/ws.rs` | ✅ Complete |
| Database schema (grid_bets, grid_stats) | `src/services/sqlite_store.rs` | ✅ Complete |
| Portfolio integration (debit/credit) | `src/services/trading.rs` | ✅ Complete |
| Price update loop integration | `src/main.rs` | ✅ Complete |

### 6.2 Existing Configuration (Current Defaults)

| Parameter | Current Value | Notes |
|---|---|---|
| `MAX_ACTIVE_TRADES` | 10 | Per-portfolio |
| `HOUSE_EDGE` | 0.05 (5%) | Flat edge |
| `MIN_MULTIPLIER` | 1.1x | Floor |
| `MAX_MULTIPLIER` | 100x | Ceiling |
| `DEFAULT_VOLATILITY` | 1.0 (100%) | Fallback |
| `VOLATILITY_WINDOW` | 500 ticks | Rolling window |
| `MIN_TRADE_AMOUNT` | $0.10 | Minimum bet |
| `MAX_LEVERAGE` | 10.0x | Leverage cap |
| `ROW_COUNT` | 8 | Default grid rows |
| `COL_COUNT` | 6 | Default grid columns |
| `INTERVAL_MS` | volatility-based | 5s–2min |

### 6.3 Changes Needed

#### 6.3.1 Make Configuration Dynamic & API-Exposed

Currently most config is hardcoded as constants. We need:
- [ ] Move configuration to a `GridlineConfig` struct that can be hot-reloaded or set via admin API
- [ ] Add admin endpoint `POST /api/grid/config` to update config at runtime
- [ ] Expose full config in `GET /api/grid/config/:symbol` response
- [ ] Key tunables to expose:
  - `house_edge` — adjustable per-symbol
  - `row_count`, `col_count` — grid dimensions
  - `interval_ms` — override or let auto-calculate
  - `grid_span_multiplier` — how many standard deviations the grid covers (currently 3.0)
  - `min_multiplier`, `max_multiplier`
  - `max_active_trades`
  - `bet_size_presets` — available bet amounts
  - `leverage_presets` — available leverage options
  - `sensitivity_factor` — how aggressively price movements shift the grid (NEW)

#### 6.3.2 Sensitivity Factor (Make Small Movements = Big Grid Changes)

A key requirement: *"small movements in the market should cause large changes on the grid"*. Currently the grid spans ~3x expected movement, which means rows are wide and price changes don't move the grid much. We need:

- [ ] Add `sensitivity_factor` parameter (default: 1.0, higher = more dramatic)
- [ ] Reduce grid span: `grid_half_span = expected_move × span_multiplier / sensitivity_factor`
  - Higher sensitivity = tighter grid = smaller rows = price moves across more rows per tick
- [ ] Or alternatively: reduce `row_height` independently to make rows narrower
- [ ] This makes the dot move more rows per price tick, making the game feel faster/harder

#### 6.3.3 Column Interval Configuration

- [ ] Support fixed intervals (e.g., always 15 seconds) OR volatility-based auto-calculation
- [ ] Add `interval_mode: "fixed" | "auto"` config option
- [ ] For fixed mode: configurable `fixed_interval_ms`
- [ ] For auto mode: configurable `target_move_per_column` (currently 0.1%)

#### 6.3.4 Multiplier Broadcast Improvements

- [ ] Currently `broadcast_multiplier_update()` exists but is rarely called
- [ ] Add periodic **full matrix broadcast every 1 second** — client replaces entire matrix on each update
- [ ] Include `current_price` and `config` in each broadcast so the frontend stays in perfect sync
- [ ] ~1KB per update for a 10×12 grid — trivial bandwidth

#### 6.3.5 Column Expiration Events

- [ ] Ensure `GridColumnExpired` events fire reliably when a column's time passes
- [ ] Batch all resolutions for a column into a single event
- [ ] Include the column index, time range, and all resolved trades

#### 6.3.6 Validation Hardening (Anti-Cheat)

- [ ] Validate that the multiplier the client claims matches the server's calculated multiplier (within tolerance)
- [ ] Reject trades where `time_end < now + minimum_buffer` (prevent last-millisecond trades)
- [ ] Rate limit trade placement (e.g., max 5 trades per second per portfolio)
- [ ] Validate that the client-sent `row_index` and `col_index` map to the correct price band and time window

---

## 7. Frontend (Wraith) — Full Component Breakdown

### 7.1 Page: `src/pages/TapTrading.tsx`

The top-level page component at route `/tap/:symbol?`.

**Responsibilities**:
- Parse symbol from URL params (default: "BTC")
- Initialize hooks: `useGridline`, `useAssetSubscription`, `useCryptoData`, `usePortfolio`, `useAuth`
- Manage state: `betSize`, `leverage`, `notifications[]`, `gridConfig`, `multipliers[][]`, `activePositions[]`
- Handle trade placement (no cancellation — trades are committed on tap)
- Full-screen layout (no scrolling, fixed viewport)
- Coordinate between all child components

**State**:
```typescript
{
  betSize: number;            // Current bet amount (default: $5)
  leverage: number;           // Current leverage (1x, 2x, 5x, 10x)
  notifications: Notification[]; // Win/error banners (max 3)
  smoothedPriceRange: { high: number; low: number }; // Lerped grid bounds
  currentPrice: number;       // Latest price tick
  gridConfig: GridConfig;     // From backend
  multipliers: number[][];    // [row][col] matrix from backend (replaced every 1s)
  activePositions: Position[]; // Active trades
  settings: TapSettings;      // User settings from localStorage
  stats24h: {                 // Rolling 24h stats for current symbol
    winStreak: number;
    netPnl: number;
    totalTrades: number;
    winRate: number;
  };
}
```

### 7.2 Component: `src/components/tap-trading/TapCanvas.tsx`

The main canvas/rendering component. Fills the entire screen below any top controls.

**Responsibilities**:
- Render the sparkline (SVG path) on the left
- Render the grid (lines, cells, multipliers) on the right
- Render active trade tiles as positioned overlays
- Handle vertical scrolling (anchor to current price)
- Handle horizontal time scrolling (continuous left-scroll)
- Handle cell tap events
- Handle zoom (mouse wheel to change visible rows/columns)
- Render price axis (right edge) and time axis (bottom edge)

**Rendering Architecture**: Canvas2D + DOM overlay hybrid.

**Canvas Layer** (single `<canvas>` element, **adaptive frame rate**: 60fps during scrolling/price changes, ~15fps when idle):
1. Grid lines — horizontal and vertical lines with variable opacity (no dots, clean lines only)
2. Past column overlay — semi-transparent dark overlay on expired columns (dimmed, continue scrolling left behind sparkline)
4. Multiplier text — in each empty future cell (Canvas `fillText`)
5. Sparkline glow — thick, low-opacity line
6. Sparkline line — crisp brand-colored line
7. Sparkline dot — circle at current price/time
8. Price labels on right edge
9. Time labels on bottom edge

**DOM Overlay Layer** (absolutely-positioned React elements on top of canvas):
1. Active trade tiles — `<div>` elements positioned to match grid cells
2. Current price badge — positioned on right edge at dot's Y
3. Win/loss tile state transitions (CSS transitions on tile divs)

**Key Coordinate System**:
```
sparklineBoundaryX = width × 0.37       // Where sparkline ends and grid begins
gridAreaWidth = width - sparklineBoundaryX
cellWidth = gridAreaWidth / visibleCols
cellHeight = height / visibleRows

// Vertical anchoring: current price stays at exact center of screen
anchorY = height × 0.50                  // Center (50%)
priceToScreenY(price) = anchorY - (price - currentPrice) / rowHeight × cellHeight

// Horizontal time scrolling
subColProgress = (now - currentColStartTime) / intervalMs
scrollOffsetX = subColProgress × cellWidth
getCellX(colIndex) = sparklineBoundaryX + colIndex × cellWidth - scrollOffsetX
```

### 7.3 Component: `src/components/tap-trading/ActiveTile.tsx`

An individual placed trade rendered on the grid.

**Props**: `position`, `cellWidth`, `cellHeight`, `state` (active | won | lost | approaching)

**Visual States**:
- **Active**: Brand green background (`#00FFAA` / `#2FD575`), shows `$5 / 3.47X`, subtle glow shadow
- **Approaching**: Same as active but with pulsing border (sparkline is in the same column)
- **Won**: Tile turns green, fades after 2s. Banner notification fires separately.
- **Lost**: Tile turns orange/red gradient, silently fades after 1s. No banner.
- No cancellation state (cancellation not supported).

### 7.4 Component: `src/components/tap-trading/AssetSelector.tsx`

Top-left asset picker. Shows current asset icon + live price. Dropdown to switch assets.

**Asset switch behavior**: Navigates to `/tap/:newSymbol` (URL-based). If active trades exist on current symbol, show warning dialog: "You have X active trades on BTC. They will continue resolving in the background." User can proceed or stay. Trades resolve server-side regardless of which asset the user is viewing.

### 7.5 Component: `src/components/tap-trading/BalancePill.tsx`

Bottom-left balance display. Shows wallet icon + current **portfolio cash balance** (unified with rest of app). Flashes green on win, red on loss.

### 7.6 Component: `src/components/tap-trading/BetSizeToggle.tsx`

Bottom-right bet size selector. Pill showing current bet size (default: **$5**). Tap to open popup picker with all presets visible.

**Presets**: $1, $5, $10, $25, $50 (configurable from backend)

**Picker behavior**: Opens above the pill. Shows all presets as tappable buttons. Active preset highlighted. Tap outside to close. Backdrop press to dismiss.

### 7.7 Component: `src/components/tap-trading/LeverageControl.tsx`

**Location**: Top toolbar bar (slim horizontal bar below navbar).

Shows leverage pills (1x, 2x, 5x, 10x) — always visible. Active leverage highlighted. Tap to switch.

Also shows **rolling 24h stats** in the toolbar: **current win streak** and **net P&L** for the current symbol over the last 24 hours. Resets daily.

**Presets**: 1x, 2x, 5x, 10x (configurable from backend)

### 7.8 Component: `src/components/tap-trading/NotificationBanner.tsx`

Top-center notification banners. Stack vertically. Auto-dismiss after timeout.

**Types**:
- **Win**: "You won $X.XX" with coin icon, green accent, 4s duration
- **Error**: "Insufficient balance." or "Try another square." with warning icon, amber accent, 3s duration

**No loss banners** — losses are communicated only via silent tile fade (orange/red).

**Max 3 banners** stacked at once. Oldest auto-dismiss.

### 7.9 Component: `src/components/tap-trading/TapSettings.tsx`

Settings dropdown triggered by a gear icon (positioned top-right or in toolbar).

**Settings (full customization)**:
- **Multiplier display**: Consistent color vs Heatmap gradient vs Opacity gradient
- **Grid line opacity**: Slider 0–100%
- **Sparkline thickness**: Thin (1px) / Medium (2px) / Thick (3px)
- **Show time labels**: Toggle
- **Show price labels**: Toggle
- **Tile glow intensity**: Off / Subtle / Bright
- **Animation speed**: Slow / Normal / Fast (controls tile fade durations)
- **Grid line style**: Solid / Dashed / Dotted

**UX**: Small dropdown below gear icon. Compact layout. Settings persisted to localStorage. Changes apply immediately (no save button).

### 7.10 Component: `src/components/tap-trading/index.ts`

Barrel exports for all tap-trading components.

### 7.11 Hook: `src/hooks/useTapTrading.ts`

Main data hook for the tap trading page. Encapsulates all backend communication.

**Provides**:
```typescript
{
  // Grid state
  gridConfig: GridConfig;
  multipliers: number[][];
  activePositions: Position[];

  // Actions
  placeTrade: (row: number, col: number) => Promise<void>;

  // Settings
  betSizePresets: number[];
  leveragePresets: number[];

  // Stats
  stats: GridStats;

  // Connection
  connected: boolean;
  loading: boolean;
}
```

**Internals**:
- Fetches initial grid state via REST
- Subscribes to WebSocket for real-time multiplier updates, trade events, column expirations
- Manages optimistic UI updates (place trade → show tile immediately → confirm with server)
- Handles reconnection logic

---

## 8. WebSocket Protocol

### 8.1 Client → Server

```typescript
// Subscribe to tap trading updates for a symbol
{ type: "subscribe_gridline", data: { symbol: "BTC", portfolio_id: "..." } }

// Unsubscribe
{ type: "unsubscribe_gridline", data: { symbol: "BTC" } }
```

### 8.2 Server → Client

```typescript
// Multiplier matrix update (every 1 second, full matrix replacement)
{
  type: "grid_multiplier_update",
  data: {
    symbol: "BTC",
    multipliers: [[1.95, 2.55, 3.00, ...], ...],  // [row][col]
    config: { price_high, price_low, row_count, col_count, interval_ms, row_height },
    current_price: 2993.34,
    current_col_index: 42,
    timestamp: 1738847123456
  }
}

// Trade placed confirmation
{
  type: "gridline_trade_placed",
  data: {
    position: { id, amount, leverage, multiplier, price_low, price_high, ... },
    timestamp: 1738847123456
  }
}

// Trade resolved (win or loss)
{
  type: "gridline_trade_resolved",
  data: {
    position: { id, status: "won"|"lost", result_pnl, ... },
    won: true,
    payout: 17.35,
    pnl: 12.35,
    timestamp: 1738847123456
  }
}

// Column expired (batch of resolutions)
{
  type: "grid_column_expired",
  data: {
    symbol: "BTC",
    col_index: 42,
    time_end: 1738847130000,
    results: [{ position_id, won, payout, pnl }, ...],
    timestamp: 1738847130001
  }
}

// Price tick (already exists — used for sparkline)
{
  type: "price_update",
  data: { symbol: "BTC", price: 2993.34, timestamp: 1738847123456 }
}
```

---

## 9. Anti-Cheat & Validation

### 9.1 Server-Side Validation (Haunt)

Every trade placement is validated on the backend:

1. **Authoritative Calculation**: Client sends only `(row_index, col_index, symbol, amount, leverage)`. Server calculates everything else: price band, time window, multiplier. The client **never** sends a multiplier — the server is the sole authority. This eliminates any possibility of multiplier manipulation.

2. **Time Window Validation**: Reject trades where:
   - `time_end < now` (column already expired)
   - `time_end < now + min_buffer_ms` (too close to expiration — prevents last-ms exploits)
   - `time_start` and `time_end` don't match a valid column in the current grid

3. **Price Band Derivation**: Server derives `(price_low, price_high)` from `row_index` + current grid config. Client never sends price bands.

4. **Balance Check**: `cash_balance >= bet_amount` (checked atomically with debit)

5. **Position Limit**: `active_positions_count < MAX_ACTIVE_TRADES`

6. **Rate Limiting**: Max N trades per second per portfolio (prevent bot spam)

7. **Amount Validation**: `bet_amount >= MIN_TRADE_AMOUNT` and `bet_amount` must be one of the allowed presets

8. **Leverage Validation**: `MIN_LEVERAGE <= leverage <= MAX_LEVERAGE` and must be an allowed preset

### 9.2 Frontend Validation (Wraith)

Pre-flight checks before sending to server (for UX, not security):

1. Check balance >= bet size (show "Insufficient balance" if not)
2. Check position count < max (show "Max trades reached" if not)
3. Check cell is in future (don't allow tapping past columns)
4. Check cell doesn't already have an active trade
5. Disable interaction during pending trade placement (prevent double-tap)

### 9.3 Resolution Integrity

- All trade resolution happens **server-side only** — the frontend never determines win/loss
- The server's price feed is the single source of truth
- Resolution checks happen on every price tick in the main loop
- Column expiration is checked on every tick (any position past its `time_end` is auto-resolved as lost)

---

## 10. Configuration & Tunables

All tunables should be configurable from the backend and exposed to the frontend via the config API.

### 10.1 Grid Shape

| Parameter | Default | Range | Description |
|---|---|---|---|
| `row_count` | 10 | 6–20 | Number of price rows visible |
| `col_count` | 12 | 6–30 | Number of time columns visible |
| `interval_ms` | auto | 5000–120000 | Duration per column |
| `interval_mode` | "auto" | "auto" \| "fixed" | How interval is determined |
| `fixed_interval_ms` | 10000 | 5000–120000 | Used when mode is "fixed" |
| `grid_span_multiplier` | 3.0 | 1.0–10.0 | How many σ the grid covers |

### 10.2 Multiplier Tuning

| Parameter | Default | Range | Description |
|---|---|---|---|
| `house_edge` | 0.05 | 0.01–0.20 | Platform edge (5%) |
| `min_multiplier` | 1.1 | 1.0–2.0 | Floor multiplier |
| `max_multiplier` | 100.0 | 10.0–1000.0 | Ceiling multiplier |
| `sensitivity_factor` | 1.0 | 0.5–5.0 | Price movement amplification |

### 10.3 Trading Rules

| Parameter | Default | Range | Description |
|---|---|---|---|
| `max_active_trades` | 10 | 1–50 | Max simultaneous trades |
| `min_trade_amount` | 0.10 | 0.01–10.0 | Minimum bet |
| `bet_size_presets` | [1, 5, 10, 25, 50] | – | Available bet amounts |
| `leverage_presets` | [1, 2, 5, 10] | – | Available leverage levels |
| `max_leverage` | 10.0 | 1.0–100.0 | Maximum leverage |
| `min_time_buffer_ms` | 2000 | 500–10000 | Minimum time before column expires to place trade |
| `trade_rate_limit` | 5/sec | 1–20/sec | Max trade placement rate |

### 10.4 Volatility

| Parameter | Default | Range | Description |
|---|---|---|---|
| `volatility_window` | 500 | 50–5000 | Number of ticks for σ calculation |
| `default_volatility` | 1.0 | 0.1–10.0 | Fallback annualized vol |
| `volatility_floor` | 0.01 | – | Minimum σ |
| `volatility_ceiling` | 10.0 | – | Maximum σ |

---

## 11. Implementation Phases

> **Phase → Section Mapping**: Each phase below references which plan sections it addresses. This helps you see where to find detailed specs for each piece of work.

| Phase | Sections Addressed | Summary |
|-------|-------------------|---------|
| Phase 0 | §5, §7.1, §7.10, §7.11, §12 | Scaffolding — files, routes, empty shells |
| Phase 1 | §6.3, §9.1, §10, §3.2–3.8 | Backend config, sensitivity, broadcasts, validation |
| Phase 2 | §7.1, §7.11, §8, §12 | Page shell, data hook, WebSocket integration |
| Phase 3 | §7.2, §3.4–3.5, §10.1 | Canvas grid rendering, coordinate system, labels |
| Phase 4 | §7.2, §2.5–2.6, §4 | Sparkline, dot anchoring, past column overlay |
| Phase 5 | §7.2, §7.3, §2.2, §9.2 | Cell tap → trade placement → optimistic UI |
| Phase 6 | §7.3, §2.3–2.4, §7.8, §8.2 | Win/loss resolution, animations, balance updates |
| Phase 7 | §7.4–7.9, §2.7–2.8, §10.3 | All peripheral controls and settings |
| Phase 8 | §7.2 | Zoom (mouse wheel grid scaling) |
| Phase 9 | §9, §13 | Polish, edge cases, performance, accessibility |

---

### Phase 0: Housekeeping
> **Sections**: §5 Architecture Overview, §7.1 Page, §7.10 Barrel Exports, §7.11 Hook, §12 File Map

- [ ] **Route setup**
  - [ ] Add `/tap/:symbol?` route to `src/main.tsx` router config
  - [ ] Import `TapTrading` page component (lazy-loaded)
  - [ ] Verify route loads in browser at `http://localhost:5173/tap`
- [ ] **Page shell**
  - [ ] Create `src/pages/TapTrading.tsx` — empty functional component, renders "Tap Trading" placeholder text
  - [ ] Add page to any nav menus or links as needed
- [ ] **Component directory**
  - [ ] Create `src/components/tap-trading/` directory
  - [ ] Create `src/components/tap-trading/index.ts` barrel export (empty for now)
- [ ] **Types file**
  - [ ] Create `src/types/tap-trading.ts` with placeholder types (GridConfig, Position, TapSettings, etc.)
  - [ ] Export from `src/types/index.ts`
- [ ] **Hook shell**
  - [ ] Create `src/hooks/useTapTrading.ts` — returns empty/default state, no backend calls yet
- [ ] **Backend verification**
  - [ ] Start Haunt: `cd Haunt && cargo run`
  - [ ] Verify `GET /api/grid/config/BTC` returns valid config JSON
  - [ ] Verify `GET /api/grid/state/BTC` returns multiplier matrix
  - [ ] Verify WebSocket connection accepts `subscribe_gridline` message
- [ ] **Build check**
  - [ ] `npx tsc --noEmit` passes
  - [ ] `npx vite build` succeeds
  - [ ] App loads at `/tap` without errors

---

### Phase 1: Backend Tuning
> **Sections**: §6.3 Changes Needed, §9.1 Server-Side Validation, §10 Configuration & Tunables, §3.2–3.8 Mathematical Model

- [ ] **Dynamic configuration (§6.3.1, §10)**
  - [ ] Refactor hardcoded constants in `gridline.rs` into a `GridlineConfig` struct
  - [ ] Add all tunables from §10.1–10.4 as fields on `GridlineConfig`
  - [ ] Add `GET /api/grid/config/:symbol` endpoint returning full config
  - [ ] Add `POST /api/grid/config` admin endpoint for runtime config updates
  - [ ] Persist config changes (SQLite or in-memory with restart defaults)
- [ ] **Sensitivity factor (§6.3.2, §3.6)**
  - [ ] Add `sensitivity_factor: f64` to `GridlineConfig` (default: 1.0)
  - [ ] Modify grid span calculation: `grid_half_span = expected_move × span_multiplier / sensitivity_factor`
  - [ ] Verify: higher sensitivity → narrower rows → more dramatic grid movement per price tick
- [ ] **Column interval configuration (§6.3.3, §10.1)**
  - [ ] Add `interval_mode: "fixed" | "auto"` to config
  - [ ] Add `fixed_interval_ms: u64` (default: 10000)
  - [ ] When mode is "fixed", use `fixed_interval_ms` directly
  - [ ] When mode is "auto", use existing volatility-based calculation (§3.7)
  - [ ] Clamp result to [5000, 120000] ms
- [ ] **Multiplier broadcast improvements (§6.3.4, §8.2)**
  - [ ] Implement periodic full matrix broadcast every 1 second
  - [ ] Include `current_price`, `config`, `current_col_index`, and `timestamp` in each broadcast
  - [ ] Format: `grid_multiplier_update` event per §8.2 spec
  - [ ] Verify: WebSocket client receives matrix updates at ~1Hz
- [ ] **Column expiration events (§6.3.5, §8.2)**
  - [ ] Ensure `grid_column_expired` events fire when a column's `time_end` passes
  - [ ] Batch all trade resolutions for the column into the event payload
  - [ ] Include `col_index`, `time_end`, and array of `results` (position_id, won, payout, pnl)
  - [ ] Verify: column expiration resolves all trades and sends one event
- [ ] **Trade validation hardening (§6.3.6, §9.1)**
  - [ ] Client sends only `(row_index, col_index, symbol, amount, leverage)` — server derives everything else
  - [ ] Reject trades where `time_end < now + min_buffer_ms` (default: 2000ms)
  - [ ] Validate `bet_amount` is one of the allowed `bet_size_presets`
  - [ ] Validate `leverage` is one of the allowed `leverage_presets`
  - [ ] Add rate limiting: max `trade_rate_limit` trades/second per portfolio (default: 5)
  - [ ] Validate `active_positions_count < max_active_trades`
  - [ ] Atomic balance check + debit (prevent race conditions)
- [ ] **Verification**
  - [ ] All REST endpoints respond with correct data via `curl` or Postman
  - [ ] WebSocket receives `grid_multiplier_update` at 1Hz
  - [ ] Place trade via API → receive `gridline_trade_placed` confirmation
  - [ ] Let trade expire → receive `gridline_trade_resolved` with correct win/loss and payout
  - [ ] Invalid trades (bad amount, expired column, over limit) return proper error messages

---

### Phase 2: Page Shell + Hook
> **Sections**: §7.1 Page, §7.11 Hook, §8 WebSocket Protocol, §12 File Map

- [ ] **`TapTrading.tsx` page layout (§7.1)**
  - [ ] Full-screen layout: navbar at top, remaining space filled by tap trading content
  - [ ] Parse `:symbol` from URL params (default: "BTC")
  - [ ] Initialize hooks: `useTapTrading`, `useAuth`, `usePortfolio`, `useCryptoData`
  - [ ] Set up state: `betSize` ($5 default), `leverage` (1x default), `notifications[]`, `settings`
  - [ ] Load `settings` from localStorage on mount
  - [ ] Render placeholder children (will be replaced in later phases)
- [ ] **`useTapTrading` hook — REST integration (§7.11)**
  - [ ] Fetch grid config on mount: `GET /api/grid/config/:symbol`
  - [ ] Fetch initial grid state: `GET /api/grid/state/:symbol`
  - [ ] Fetch active positions: `GET /api/grid/positions/:portfolio_id`
  - [ ] Fetch 24h stats: `GET /api/grid/stats/:portfolio_id/:symbol`
  - [ ] Expose `placeTrade(row, col)` action that POSTs to `/api/grid/trade`
  - [ ] Handle loading/error states
- [ ] **`useTapTrading` hook — WebSocket integration (§7.11, §8)**
  - [ ] Add tap trading event handlers to `useHauntSocket.tsx`
  - [ ] Send `subscribe_gridline` on connect with `{ symbol, portfolio_id }`
  - [ ] Handle `grid_multiplier_update` → replace entire multiplier matrix + config
  - [ ] Handle `gridline_trade_placed` → add to active positions
  - [ ] Handle `gridline_trade_resolved` → update position status, trigger callbacks
  - [ ] Handle `grid_column_expired` → batch update positions, trigger callbacks
  - [ ] Handle `price_update` → update current price, append to price history
  - [ ] Send `unsubscribe_gridline` on symbol change or unmount
- [ ] **API service methods (§12)**
  - [ ] Add tap trading API methods to `src/services/haunt.ts`
  - [ ] `getGridConfig(symbol)`, `getGridState(symbol)`, `getGridPositions(portfolioId)`
  - [ ] `placeTrade({ symbol, row, col, amount, leverage })`, `getGridStats(portfolioId, symbol)`
- [ ] **Verification**
  - [ ] Page loads at `/tap/BTC` and shows placeholder content
  - [ ] Hook fetches config and state from backend on mount
  - [ ] WebSocket subscribes and receives multiplier updates
  - [ ] Price updates flow through to page state
  - [ ] Console shows no errors, no stale connections on unmount

---

### Phase 3: Grid Rendering
> **Sections**: §7.2 TapCanvas, §3.4–3.5 Multiplier/Radial Gradient, §10.1 Grid Shape

- [ ] **Canvas setup (§7.2)**
  - [ ] Create `src/components/tap-trading/TapCanvas.tsx`
  - [ ] Set up `<canvas>` element that fills container (responsive to parent size)
  - [ ] Set up `requestAnimationFrame` render loop with adaptive frame rate (60fps active, ~15fps idle)
  - [ ] Handle `devicePixelRatio` for crisp rendering on HiDPI displays
  - [ ] Handle canvas resize on window resize
- [ ] **Coordinate system (§7.2)**
  - [ ] Define sparkline boundary: `sparklineBoundaryX = width × 0.37`
  - [ ] Define grid area: `gridAreaWidth = width - sparklineBoundaryX`
  - [ ] Calculate cell dimensions: `cellWidth = gridAreaWidth / visibleCols`, `cellHeight = height / visibleRows`
  - [ ] Implement `priceToScreenY(price)` — maps price to Y coordinate, anchored at center (50%)
  - [ ] Implement `getCellX(colIndex)` — maps column index to X coordinate with sub-column scroll offset
  - [ ] Implement `screenToCell(x, y)` — inverse mapping for tap detection
- [ ] **Vertical anchoring (§2.5)**
  - [ ] Calculate `anchorY = height × 0.50`
  - [ ] Map price to Y: `anchorY - (price - currentPrice) / rowHeight × cellHeight`
  - [ ] Grid shifts up/down as price moves so current price row stays at anchor
  - [ ] Smooth interpolation (lerp) on price range changes; snap on large deltas
- [ ] **Horizontal time scrolling (§2.6)**
  - [ ] Calculate `subColProgress = (now - currentColStartTime) / intervalMs`
  - [ ] Calculate `scrollOffsetX = subColProgress × cellWidth`
  - [ ] Grid scrolls continuously left as time passes
  - [ ] New columns appear on right edge, old columns scroll off left
- [ ] **Grid line rendering**
  - [ ] Draw horizontal grid lines (one per row boundary) — clean lines, no dots
  - [ ] Draw vertical grid lines (one per column boundary) — clean lines, no dots
  - [ ] Use configurable opacity (from settings, default ~20%)
  - [ ] Support grid line style setting (solid/dashed/dotted)
- [ ] **Multiplier text rendering (§3.4–3.5)**
  - [ ] Render multiplier value (e.g., "3.47X") centered in each future cell
  - [ ] Support configurable color mode: consistent color / heatmap gradient / opacity gradient
  - [ ] Font size scales with cell size
  - [ ] Skip rendering for cells with active trades (tile overlay covers them)
- [ ] **Price labels (right edge)**
  - [ ] Render price labels aligned to row boundaries on the right edge of the grid
  - [ ] Format based on asset precision (e.g., "$2,993.50")
  - [ ] Highlight the row containing the current price
- [ ] **Time labels (bottom edge)**
  - [ ] Render time labels below each column boundary
  - [ ] Format as HH:MM:SS (12h or 24h based on locale)
  - [ ] Labels scroll with the grid
- [ ] **Verification**
  - [ ] Grid renders with correct number of rows and columns matching backend config
  - [ ] Multiplier values in cells match the `multipliers[][]` matrix from backend
  - [ ] Grid scrolls left smoothly as time passes (sub-pixel smooth, no jitter)
  - [ ] Grid scrolls vertically when price changes (anchor stays at center)
  - [ ] Price and time labels are accurate and readable
  - [ ] Adaptive frame rate: 60fps when actively scrolling, drops when idle

---

### Phase 4: Sparkline
> **Sections**: §7.2 TapCanvas (sparkline subsection), §2.5 Sparkline Dot, §2.6 Time Scrolling, §4 Video Reference

- [ ] **Sparkline path rendering**
  - [ ] Render price history as a line path in the sparkline zone (left 37% of canvas)
  - [ ] Duration matches grid time span: `col_count × interval_ms` worth of history
  - [ ] X-axis maps time to [0, sparklineBoundaryX], most recent at the right edge
  - [ ] Y-axis matches the grid's price-to-Y mapping (same coordinate system)
  - [ ] Use brand color for the line (from Ghost tokens)
- [ ] **Sparkline glow**
  - [ ] Render a thicker, low-opacity copy of the sparkline underneath the main line
  - [ ] Creates a "glow" effect similar to reference video
  - [ ] Glow intensity configurable in settings (off / subtle / bright)
- [ ] **Sparkline dot (§2.5)**
  - [ ] Render a filled circle at the rightmost point of the sparkline (current price, current time)
  - [ ] Dot sits at `x = sparklineBoundaryX`, `y = anchorY` (center of screen, 50%)
  - [ ] Dot size: ~6–8px radius, brand color, with subtle outer glow
- [ ] **Current price badge**
  - [ ] DOM-overlaid badge on the right edge of the grid, aligned with the dot's Y position
  - [ ] Shows formatted current price (e.g., "$2,993.34")
  - [ ] Pink/magenta accent color (matching reference video)
  - [ ] Moves vertically as price changes
- [ ] **Past column overlay (§2.6 — expired columns)**
  - [ ] Columns that have scrolled past the sparkline boundary get a semi-transparent dark overlay
  - [ ] Overlay dims expired columns but they remain visible and continue scrolling left
  - [ ] Expired columns eventually scroll off the left edge of the screen
  - [ ] Transition from "active" to "dimmed" is smooth (opacity fade)
- [ ] **Sparkline ↔ grid alignment**
  - [ ] Sparkline endpoint (dot) perfectly aligns with the first grid column's left edge
  - [ ] The Y-coordinate of the dot matches the current price row in the grid
  - [ ] As price moves, both sparkline and grid scroll vertically in sync
- [ ] **Verification**
  - [ ] Sparkline renders smoothly and tracks real-time price
  - [ ] Dot stays at sparkline boundary at vertical center (50%)
  - [ ] Grid scrolls vertically to keep dot centered — price up = grid down
  - [ ] Past columns have dark overlay and continue scrolling left
  - [ ] Current price badge on right edge is at correct Y and shows correct price
  - [ ] Sparkline and grid are perfectly Y-aligned (no vertical gap or offset)

---

### Phase 5: Trade Placement
> **Sections**: §7.2 TapCanvas (tap handling), §7.3 ActiveTile, §2.2 Placing a Trade, §9.2 Frontend Validation

- [ ] **Cell tap detection**
  - [ ] Add click/touch handler on the canvas
  - [ ] Convert screen coordinates to grid cell using `screenToCell(x, y)`
  - [ ] Ignore taps in the sparkline zone (x < sparklineBoundaryX)
  - [ ] Ignore taps on expired/past columns
  - [ ] Ignore taps on cells that already have an active trade
- [ ] **Frontend pre-flight validation (§9.2)**
  - [ ] Check `balance >= betSize` → show "Insufficient balance" notification if not
  - [ ] Check `activePositions.length < maxActiveTrades` → show "Max trades reached" if not
  - [ ] Check column is in the future (not expired or about to expire within `min_time_buffer_ms`)
  - [ ] Disable tap interaction while a trade request is pending (prevent double-tap)
- [ ] **Trade placement flow**
  - [ ] On valid tap: call `placeTrade(row, col)` on the hook
  - [ ] Hook sends POST to `/api/grid/trade` with `{ symbol, row_index, col_index, amount, leverage }`
  - [ ] On success: server returns confirmed position with locked multiplier
  - [ ] On error: show appropriate notification banner
- [ ] **`ActiveTile.tsx` component (§7.3)**
  - [ ] Create `src/components/tap-trading/ActiveTile.tsx`
  - [ ] Render as absolutely-positioned DOM element over the grid canvas
  - [ ] Position matches grid cell: `left = getCellX(col)`, `top = priceToScreenY(priceHigh)`, `width = cellWidth`, `height = cellHeight`
  - [ ] Shows bet amount and locked multiplier: "$5 / 3.47X"
  - [ ] Brand green background (#00FFAA / #2FD575) with subtle glow shadow
  - [ ] Font size scales with cell size
- [ ] **Optimistic UI**
  - [ ] Show tile immediately on tap (before server confirmation)
  - [ ] Use locally-known multiplier from the matrix as placeholder
  - [ ] On server confirmation: update with server's locked multiplier (may differ slightly)
  - [ ] On server rejection: remove tile, show error notification
- [ ] **Verification**
  - [ ] Tap cell → tile appears immediately (< 100ms visual feedback)
  - [ ] Server confirms → tile stays with server's locked multiplier
  - [ ] Balance decreases by bet amount on successful placement
  - [ ] Multiple trades can be placed across different cells
  - [ ] Cannot tap expired columns, occupied cells, or sparkline zone
  - [ ] "Insufficient balance" shows when balance < bet size
  - [ ] "Max trades reached" shows when at position limit
  - [ ] Double-tap protection works (no duplicate trades)

---

### Phase 6: Trade Resolution
> **Sections**: §7.3 ActiveTile (visual states), §2.3 Win Condition, §2.4 Loss Condition, §7.8 NotificationBanner, §8.2 WebSocket Protocol

- [ ] **Win resolution handling**
  - [ ] Listen for `gridline_trade_resolved` with `won: true`
  - [ ] Update tile state to "won" → tile turns green
  - [ ] Tile fades out after ~2 seconds
  - [ ] Trigger win notification banner: "You won $X.XX" with coin icon, green accent
  - [ ] Credit payout to balance (via portfolio update or WS balance event)
- [ ] **Loss resolution handling**
  - [ ] Listen for `gridline_trade_resolved` with `won: false`
  - [ ] Update tile state to "lost" → tile turns orange/red gradient
  - [ ] Tile silently fades out after ~1 second (no banner notification)
  - [ ] Balance already debited at placement time — no further deduction
- [ ] **Column expiration batch resolution**
  - [ ] Listen for `grid_column_expired` event
  - [ ] Iterate through `results[]` — mark each position as won or lost
  - [ ] Trigger win banners for all wins in the batch
  - [ ] Apply all balance credits atomically
- [ ] **Tile visual state machine**
  - [ ] `active` → brand green, shows bet/multiplier, glow shadow
  - [ ] `approaching` → same as active but with pulsing border (sparkline is in the same column)
  - [ ] `won` → turns green, text changes to "+$X.XX", fades after 2s
  - [ ] `lost` → turns orange/red gradient, fades after 1s
  - [ ] CSS transitions between all states (smooth, no jarring changes)
- [ ] **Balance updates**
  - [ ] On win: portfolio cash balance increases by payout amount
  - [ ] `BalancePill` flash animation on balance change (green for win, red for loss)
  - [ ] 24h stats update: increment win streak (or reset on loss), adjust net P&L
- [ ] **Notification management**
  - [ ] Win banners auto-dismiss after 4 seconds
  - [ ] Max 3 banners stacked at once — oldest dismissed first
  - [ ] No banners for losses (silent fade only)
  - [ ] Error banners (from Phase 5) auto-dismiss after 3 seconds
- [ ] **Verification**
  - [ ] Price touches a tile's row during its time window → tile wins correctly
  - [ ] Win: tile turns green → banner shows "You won $X.XX" → balance increases
  - [ ] Column expires without touching → tile loses correctly
  - [ ] Loss: tile silently turns orange/red and fades → no banner
  - [ ] Payouts are correct: `amount × leverage × multiplier`
  - [ ] Multiple wins in same column all resolve correctly
  - [ ] Stats (win streak, net P&L) update accurately

---

### Phase 7: Controls & Chrome
> **Sections**: §7.4 AssetSelector, §7.5 BalancePill, §7.6 BetSizeToggle, §7.7 LeverageControl, §7.8 NotificationBanner, §7.9 TapSettings, §2.7 Leverage, §2.8 Bet Sizing, §10.3 Trading Rules

- [ ] **`AssetSelector.tsx` (§7.4)**
  - [ ] Create component: pill with asset icon + live price + dropdown arrow
  - [ ] Position: top-left of page
  - [ ] Dropdown: list of available trading pairs (from backend or hardcoded initially)
  - [ ] On select: navigate to `/tap/:newSymbol` (URL-based switch)
  - [ ] If active trades exist on current symbol: show warning dialog
  - [ ] Warning text: "You have X active trades on {SYMBOL}. They will continue resolving in the background."
  - [ ] User can proceed (navigate) or cancel (stay)
- [ ] **`BalancePill.tsx` (§7.5)**
  - [ ] Create component: wallet icon + formatted portfolio cash balance
  - [ ] Position: bottom-left of page
  - [ ] Flash green on win (balance increase)
  - [ ] Flash red on loss (balance decrease at placement time)
  - [ ] Use portfolio cash balance (shared with rest of app, not tap-trading-specific)
- [ ] **`BetSizeToggle.tsx` (§7.6)**
  - [ ] Create component: pill showing current bet size (default "$5")
  - [ ] Position: bottom-right of page
  - [ ] On tap: open popup picker above the pill
  - [ ] Show all presets as tappable buttons: $1, $5, $10, $25, $50
  - [ ] Active preset highlighted with accent color
  - [ ] Tap outside or backdrop press to dismiss
  - [ ] Presets sourced from backend config (`bet_size_presets`)
- [ ] **`LeverageControl.tsx` (§7.7)**
  - [ ] Create component: slim horizontal toolbar below navbar
  - [ ] Leverage pills: 1x, 2x, 5x, 10x — always visible, active highlighted
  - [ ] Tap pill to switch leverage (instant, no confirmation needed)
  - [ ] Rolling 24h stats display in toolbar:
    - [ ] Current win streak (resets on loss)
    - [ ] Net P&L for current symbol over last 24h
  - [ ] Presets sourced from backend config (`leverage_presets`)
- [ ] **`NotificationBanner.tsx` (§7.8)**
  - [ ] Create component: top-center banner stack
  - [ ] Win banner: "You won $X.XX" + coin icon, green accent, 4s auto-dismiss
  - [ ] Error banner: "Insufficient balance." or "Try another square." + warning icon, amber accent, 3s auto-dismiss
  - [ ] Max 3 banners visible at once, stacked vertically
  - [ ] Oldest banner auto-dismissed when 4th arrives
  - [ ] Slide-in/slide-out animation
  - [ ] No loss banners (losses are silent tile fade only)
- [ ] **`TapSettings.tsx` (§7.9)**
  - [ ] Create component: gear icon button (top-right or in toolbar)
  - [ ] On click: dropdown panel below gear icon
  - [ ] Settings options (full customization):
    - [ ] Multiplier display mode: Consistent color / Heatmap gradient / Opacity gradient
    - [ ] Grid line opacity: slider 0–100%
    - [ ] Sparkline thickness: Thin (1px) / Medium (2px) / Thick (3px)
    - [ ] Show time labels: toggle
    - [ ] Show price labels: toggle
    - [ ] Tile glow intensity: Off / Subtle / Bright
    - [ ] Animation speed: Slow / Normal / Fast
    - [ ] Grid line style: Solid / Dashed / Dotted
  - [ ] All changes apply immediately (no save button)
  - [ ] Persist all settings to localStorage under `tap-trading-settings` key
  - [ ] Load settings from localStorage on mount
  - [ ] Compact layout that doesn't cover too much of the grid
- [ ] **Barrel exports**
  - [ ] Update `src/components/tap-trading/index.ts` to export all components
- [ ] **Verification**
  - [ ] Asset selector shows current symbol + price, dropdown navigates to new symbol
  - [ ] Asset switch with active trades shows warning dialog
  - [ ] Balance pill shows correct portfolio cash balance, flashes on changes
  - [ ] Bet size picker opens/closes, selected preset is used for next trade
  - [ ] Leverage pills switch instantly, selected leverage is used for next trade
  - [ ] Win banners show correctly, auto-dismiss, max 3 stacked
  - [ ] Error banners show for validation failures
  - [ ] Settings dropdown opens, changes apply immediately, persist across page loads

---

### Phase 8: Zoom Support
> **Sections**: §7.2 TapCanvas (zoom subsection)

- [ ] **Mouse wheel handler**
  - [ ] Capture `wheel` events on the canvas element
  - [ ] Prevent default browser zoom (ctrl+wheel)
  - [ ] Scroll up (zoom in): decrease visible rows/cols (fewer cells, larger)
  - [ ] Scroll down (zoom out): increase visible rows/cols (more cells, smaller)
  - [ ] Clamp to reasonable bounds: min ~4×4, max ~20×30
- [ ] **Cell size recalculation**
  - [ ] Recalculate `cellWidth` and `cellHeight` on zoom
  - [ ] Multiplier text font size scales proportionally
  - [ ] Active tiles reposition and resize to match new cell dimensions
- [ ] **Backend coordination**
  - [ ] On zoom, request updated multiplier matrix if row/col count changed
  - [ ] Send new `row_count` and `col_count` in WebSocket subscription or REST call
  - [ ] Backend returns appropriately-sized matrix
- [ ] **Smooth zoom animation**
  - [ ] Animate cell size transitions (lerp over ~200ms)
  - [ ] Anchor zoom on the current price cell (don't shift the viewport wildly)
- [ ] **Verification**
  - [ ] Mouse wheel over grid zooms in/out smoothly
  - [ ] Zoomed-in: fewer cells, larger, lower multipliers visible near center
  - [ ] Zoomed-out: more cells, smaller, higher multipliers visible at edges
  - [ ] Active tiles reposition correctly after zoom
  - [ ] Ctrl+wheel does NOT trigger browser zoom (only grid zoom)
  - [ ] Zoom bounds enforced (can't zoom to absurd levels)

---

### Phase 9: Polish & Edge Cases
> **Sections**: §9 Anti-Cheat & Validation, §13 Verification Plan

- [ ] **Smooth transitions**
  - [ ] Price range lerp: smooth interpolation when grid bounds change
  - [ ] Snap to new bounds on large price deltas (> 3× row height)
  - [ ] Column transition: smooth handoff when column expires and new one appears
- [ ] **Edge case handling**
  - [ ] `currentPrice === 0` or `NaN`: show loading skeleton, disable trading
  - [ ] Empty price history (no sparkline data yet): show placeholder, grid only
  - [ ] No grid config from backend: show loading state with retry
  - [ ] WebSocket disconnect: show "Reconnecting..." indicator, auto-retry with backoff
  - [ ] WebSocket reconnect: re-subscribe to current symbol, re-fetch active positions
- [ ] **Error feedback**
  - [ ] "Insufficient balance" notification when balance < bet size
  - [ ] "Max positions reached" notification when at limit
  - [ ] "Connection lost" indicator when WebSocket drops
  - [ ] "Trade failed" notification for unexpected server errors
- [ ] **Asset switching**
  - [ ] Full state reset on symbol change: clear multipliers, positions, stats, price history
  - [ ] Re-fetch everything for new symbol
  - [ ] Active trades on previous symbol continue resolving server-side
- [ ] **Responsive layout**
  - [ ] Handle window resize: recalculate all canvas dimensions
  - [ ] Debounce resize handler (100ms)
  - [ ] Maintain aspect ratios and readability at different viewport sizes
  - [ ] Mobile consideration: touch events, viewport meta
- [ ] **Performance optimization**
  - [ ] Memoize cell rendering — only re-draw cells whose multipliers changed
  - [ ] Virtualize off-screen cells (don't draw cells outside viewport)
  - [ ] Throttle multiplier matrix re-renders to 1Hz (matches broadcast rate)
  - [ ] Profile canvas rendering — target <4ms per frame
  - [ ] Efficient price history buffer (ring buffer, fixed size)
- [ ] **Browser interaction**
  - [ ] Prevent browser zoom on ctrl+wheel (capture for grid zoom in Phase 8)
  - [ ] Prevent pull-to-refresh on mobile
  - [ ] Handle visibility change (tab hidden → pause rendering, tab visible → resume)
- [ ] **Accessibility**
  - [ ] Keyboard navigation: arrow keys to move cell focus, Enter to place trade
  - [ ] Screen reader announcements for trade placement and resolution
  - [ ] High contrast mode support (settings)
  - [ ] Reduced motion preference: disable animations when `prefers-reduced-motion`
- [ ] **Final verification (§13)**
  - [ ] Start Haunt: `cd Haunt && cargo run`
  - [ ] Start Wraith: `cd Wraith && npx vite --port 5173`
  - [ ] Navigate to `http://localhost:5173/tap/BTC`
  - [ ] Full trading loop: see grid → place trades → watch resolution → balance changes
  - [ ] Switch assets: navigate to `/tap/ETH`, verify full state reset
  - [ ] Zoom in/out, verify grid rescales correctly
  - [ ] Open settings, change all options, verify they apply and persist
  - [ ] `npx tsc --noEmit` passes with zero errors
  - [ ] `npx vite build` succeeds with no warnings

---

## 12. File Map

### New Files (Wraith)

| File | Description |
|---|---|
| `src/pages/TapTrading.tsx` | Main page component |
| `src/components/tap-trading/TapCanvas.tsx` | Full-screen canvas with sparkline + grid |
| `src/components/tap-trading/ActiveTile.tsx` | Placed trade tile overlay |
| `src/components/tap-trading/AssetSelector.tsx` | Asset picker (top-left) |
| `src/components/tap-trading/BalancePill.tsx` | Balance display (bottom-left) |
| `src/components/tap-trading/BetSizeToggle.tsx` | Bet size picker (bottom-right) |
| `src/components/tap-trading/LeverageControl.tsx` | Leverage picker + session stats (top toolbar) |
| `src/components/tap-trading/NotificationBanner.tsx` | Win/error banners (max 3 stacked) |
| `src/components/tap-trading/TapSettings.tsx` | Settings dropdown (gear icon) |
| `src/components/tap-trading/index.ts` | Barrel exports |
| `src/hooks/useTapTrading.ts` | Data hook (REST + WebSocket) |
| `src/types/tap-trading.ts` | TypeScript types for tap trading |

### Modified Files (Wraith)

| File | Change |
|---|---|
| Router config (`src/main.tsx`) | Add `/tap/:symbol?` route |
| `src/hooks/useHauntSocket.tsx` | Add tap trading WS event handlers |
| `src/services/haunt.ts` | Add tap trading API methods |
| `src/types/index.ts` | Export tap trading types |

### Modified Files (Haunt)

| File | Change |
|---|---|
| `src/services/gridline.rs` | Dynamic config, sensitivity factor, broadcast improvements |
| `src/api/gridline.rs` | Config update endpoint, validation hardening |
| `src/types/gridline.rs` | Extended config fields |

---

## 13. Verification Plan

### After Phase 1 (Backend)
1. `curl /api/grid/config/BTC` returns valid config with all tunable fields
2. `curl /api/grid/state/BTC` returns multiplier matrix with correct dimensions
3. `curl /api/grid/multipliers/BTC` returns matrix that changes when price changes
4. WebSocket receives `grid_multiplier_update` events periodically
5. Place trade via API → receive confirmation → see in active positions
6. Let trade expire → receive `gridline_trade_resolved` with correct win/loss

### After Phase 3 (Grid)
1. Grid renders with correct number of rows and columns
2. Multiplier values match backend data
3. Grid scrolls smoothly left as time passes
4. Price labels on right edge are correct
5. Time labels on bottom edge are correct
6. Grid lines render with proper styling

### After Phase 4 (Sparkline)
1. Sparkline tracks real-time price accurately
2. Dot stays at sparkline boundary between sparkline zone and grid zone
3. Grid scrolls vertically to keep dot centered
4. Past columns have dark overlay
5. Current price badge shows on right edge at correct Y position

### After Phase 5 (Trading)
1. Tap cell → tile appears immediately (optimistic)
2. Server confirms → tile stays
3. Balance decreases by bet amount
4. Multiple trades can be placed simultaneously
5. Cannot tap expired columns
6. Cannot tap occupied cells
7. "Insufficient balance" shows when broke

### After Phase 6 (Resolution)
1. Price touches a tile's row during its time window → WIN
2. Win: tile turns green, banner shows "You won $X.XX", balance increases
3. Column expires without touching → LOSS
4. Loss: tile silently turns orange/red and fades
5. Payouts are correct: `amount × leverage × multiplier`
6. Multiple wins in same column all resolve correctly

### End-to-End
1. Start Haunt: `cd Haunt && cargo run`
2. Start Wraith: `cd Wraith && npx vite --port 5173`
3. Navigate to `http://localhost:5173/tap/BTC`
4. Full trading loop: see grid → place trades → watch resolution → balance changes
5. `npx tsc --noEmit` passes
6. `npx vite build` succeeds

---

## 14. Decisions Log

> All questions resolved during planning Q&A.

| Question | Decision |
|----------|----------|
| Rendering technology | **Canvas2D** for grid/sparkline background, **DOM overlays** for interactive tiles and controls |
| Default column interval | **10 seconds** (fast-paced, arcade feel) |
| Trade cancellation | **No cancellation** — once tapped, trade is committed |
| Loss feedback | **Silent** — tile turns orange/red and fades, no banner notification |
| Win animation | **Banner only** ("You won $X.XX") — no floating "+$X.XX" text for now |
| Asset switching with active trades | **Warn but allow** — show warning about active trades, but let user switch; trades resolve in background |
| Zoom support | **Yes, Phase 8** — mouse wheel to change visible row/col count |
| Sparkline style | **Single brand-colored line + dot** — consistent color, dot at tip, our own style |
| Leverage control placement | **Top toolbar bar** — slim bar with leverage pills always visible |
| Canvas architecture | **Canvas + DOM overlay** — Canvas2D for background grid/sparkline, DOM for tiles/notifications |
| Max notification banners | **3 stacked** — oldest auto-dismiss, up to 3 visible at once |
| Stats display | **Win streak + net P&L** — rolling 24h per-symbol stats in toolbar |
| Grid split ratio | **~37% sparkline / ~63% grid** — matches reference video |
| Dot vertical position | **Center (50%)** — symmetric view above and below current price |
| Bet size UX | **Popup picker** — tap opens picker with all presets visible |
| Multiplier color coding | **User setting** — toggle between consistent color vs heatmap gradient in settings |
| Active tile color | **Brand green (#00FFAA / #2FD575)** — consistent with app branding |
| Page layout | **With navbar** — standard app navbar at top, grid fills remaining space |
| Session stats scope | **Rolling 24h per symbol** — shows last 24h performance for current asset |
| Trade request format | **Client sends (row, col) only** — server calculates multiplier, price band, time window authoritatively |
| Sensitivity factor default | **1.0x** — no amplification at launch, tune based on gameplay feedback |
| Sparkline history duration | **Match grid time span** — shows same duration as visible grid columns |
| Asset switch navigation | **URL-based** — navigates to `/tap/ETH` etc. Browser back works. |
| Default bet size | **$5** — balanced default, user can change via picker |
| Canvas frame rate | **Adaptive** — 60fps during active scrolling/price changes, drops to ~15fps when idle |
| Multiplier broadcast frequency | **Every 1 second** — full matrix replacement |
| Grid dots | **No dots** — just grid lines, cleaner look |
| Balance source | **Portfolio cash balance** — unified with rest of app |
| Expired column behavior | **Dimmed and scrolling** — dark overlay, continues scrolling left behind sparkline |
| Settings panel UX | **Dropdown from gear icon** — compact, doesn't cover much of the grid |
| Settings scope | **Full customization** — multiplier colors, grid line opacity, sparkline thickness, labels visibility, tile glow, animation speed, etc. |

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **Cell** | One grid square at the intersection of a price row and time column |
| **Column** | A vertical slice of the grid representing a time window (e.g., 10 seconds) |
| **Row** | A horizontal slice of the grid representing a price band (e.g., $2,993.0–$2,993.5) |
| **Multiplier** | The payout ratio for a cell. Derived from touch probability. |
| **Touch** | When the live price enters a cell's price band during its time window |
| **Tile** | A placed trade visually overlaid on a grid cell |
| **Dot** | The sparkline endpoint representing the current price at current time |
| **Sensitivity** | How much the grid reacts to small price movements (configurable) |
| **House Edge** | The platform's statistical advantage, taken from the fair multiplier |
| **Radial Gradient** | The pattern of multipliers radiating from the current price/time center |
