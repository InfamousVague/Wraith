# Wraith Frontend - Complete Feature Inventory

> **Purpose:** Comprehensive list of every feature, interaction, and displayed value for testing coverage
> **Last Updated:** 2026-02-04

---

## Table of Contents

1. [Dashboard/Home](#1-dashboardhome)
2. [Asset Detail Page](#2-asset-detail-page)
3. [Trading Sandbox](#3-trading-sandbox)
4. [Portfolio Page](#4-portfolio-page)
5. [Leaderboard](#5-leaderboard)
6. [Profile/Account](#6-profileaccount)
7. [Settings](#7-settings)
8. [Navigation & UI Components](#8-navigation--ui-components)
9. [Real-Time WebSocket Features](#9-real-time-websocket-features)
10. [Authentication System](#10-authentication-system)
11. [API Integration](#11-api-integration)
12. [Data Models & Types](#12-data-models--types)
13. [Responsive Breakpoints](#13-responsive-breakpoints)
14. [Local Storage & Persistence](#14-local-storage--persistence)
15. [Error Handling & Edge Cases](#15-error-handling--edge-cases)

---

## 1. Dashboard/Home

### 1.1 Display Elements

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Asset list/grid | Shows all assets with prices | Renders all assets, no duplicates |
| View mode toggle | Switch between list and grid | Persists preference, visual change |
| Grid card size | Adjustable card dimensions | Slider works, sizes change |
| Metrics carousel | Global market overview | Rotates, shows real data |
| Market status | US market open/closed indicator | Accurate based on time |

### 1.2 Filtering & Sorting

| Feature | Options | Test Criteria |
|---------|---------|---------------|
| Asset type filter | all, crypto, stocks | Filters correctly |
| Sort options | market_cap, price, change, volume | Data reorders correctly |
| Sort direction | ascending, descending | Toggle works |
| Show offline markets | Toggle | Hides/shows offline assets |
| Auto-switch to crypto | When US market closed | Automatic switching works |

### 1.3 Asset Card Data (Per Card)

| Value | Description | Test Criteria |
|-------|-------------|---------------|
| Asset name | Full name | Displays correctly |
| Symbol | Ticker symbol | Uppercase, correct |
| Current price | USD formatted | Updates in real-time |
| 24h change % | Percentage change | Color-coded +/- |
| Market cap | Formatted number | Correct abbreviation (B/M) |
| Volume 24h | Trading volume | Formatted correctly |
| Sparkline | 7-day trend chart | Renders, correct direction |
| Trade direction | Up/down arrow | Matches price movement |

### 1.4 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Click asset card | Navigate to detail page | URL changes, page loads |
| Toggle view mode | Switch list/grid | Layout changes |
| Adjust card size | Cards resize | Smooth transition |
| Change sort | Data reorders | Correct order |
| Change filter | Data filters | Correct subset |

---

## 2. Asset Detail Page

### 2.1 Asset Header Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Asset name | Full name | Matches selected asset |
| Symbol | Ticker | Uppercase |
| Current price | Large display | Real-time updates |
| 24h change | Percentage + color | Correct calculation |
| Trade button | Navigate to trading | Opens trade page |

### 2.2 Chart Section

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Price chart | TradingView-style | Renders with data |
| Chart type | Candlestick/Line toggle | Switches correctly |
| Timeframe selector | 1m, 5m, 15m, 1h, 4h, 1d, 1w | Data changes per selection |
| Indicators overlay | SMA, EMA, BB | Draws correctly on chart |
| Chart height | 350-500px responsive | Adapts to viewport |
| Zoom/pan | Interactive chart | Touch/mouse controls work |
| Crosshair tooltip | OHLC values on hover | Shows correct data |

### 2.3 Key Metrics Panel

| Metric | Description | Test Criteria |
|--------|-------------|---------------|
| Volatility score | 0-100 scale | Displays, updates |
| Momentum score | 0-100 scale | Displays, updates |
| Trend score | 0-100 scale | Displays, updates |
| Volume score | 0-100 scale | Displays, updates |
| Data quality | Confidence % | Shows source count |
| Last updated | Timestamp | Recent timestamp |
| Source breakdown | Exchange percentages | Adds to 100% |

### 2.4 Trading Signals Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Composite score | 0-100 overall signal | Large display |
| Direction | Strong Buy → Strong Sell | Color-coded |
| Trend score | Category score | Shows calculation |
| Momentum score | Category score | Shows calculation |
| Volatility score | Category score | Shows calculation |
| Volume score | Category score | Shows calculation |
| Timeframe selector | Day/Swing/Position/Long-term | Changes signal data |

### 2.5 Technical Indicators Panel

| Indicator | Data Shown | Test Criteria |
|-----------|------------|---------------|
| RSI | Value (0-100), signal | Overbought/oversold coloring |
| MACD | Line, signal, histogram | Shows all three |
| Stochastic | %K, %D values | Crossover indication |
| Bollinger Bands | Upper, middle, lower | Band width displayed |
| ATR | Volatility value | Numeric display |
| SMA | Moving average value | Multiple periods |
| EMA | Exponential MA | Multiple periods |
| ADX | Trend strength | Direction indicator |
| VWAP | Volume-weighted price | Comparison to current |
| CCI | Channel index | Overbought/oversold |
| OBV | Volume indicator | Trend direction |
| MFI | Money flow | 0-100 scale |

### 2.6 Prediction Accuracy Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Overall accuracy | Win rate percentage | Calculated correctly |
| Per-indicator accuracy | Individual stats | Shows sample size |
| Historical predictions | List of past calls | Validated outcomes |
| Generate button | Force new predictions | Loading state, updates |

### 2.7 Open Positions Section (if user has positions)

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Position count | Number of positions | Accurate count |
| Entry price | Original entry | Formatted correctly |
| Current P&L | Profit/loss | Real-time update |
| Liquidation price | For leveraged | Calculated correctly |
| Close button | Quick close | Opens confirmation |

### 2.8 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Click Trade | Navigate to TradeSandbox | Pre-selects asset |
| Select timeframe | Signals update | Data refreshes |
| Click indicator | Show detailed tooltip | Explanation appears |
| Generate predictions | New predictions | Loading, success feedback |
| Back button | Return to dashboard | Navigation works |

---

## 3. Trading Sandbox

### 3.1 Layout Variants

| Viewport | Layout | Test Criteria |
|----------|--------|---------------|
| Wide (≥1200px) | 3-column: OrderBook, Chart, Form | All visible simultaneously |
| Medium (<1200px) | Toggle Chart/OrderBook + Form | Toggle works |
| Mobile (≤480px) | Stacked vertical | Scrollable, usable |

### 3.2 Chart Section

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Real-time chart | Price updates via WS | Updates without lag |
| Height | 300-500px | Responsive |
| Symbol display | Current trading pair | Matches order form |

### 3.3 Order Book Panel

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Bid orders | Buy orders (green) | Sorted by price desc |
| Ask orders | Sell orders (red) | Sorted by price asc |
| Spread display | Bid-ask spread | Calculated correctly |
| Depth visualization | Size bars | Proportional to size |
| Click price | Fill in order form | Price transfers |
| Resizable edge | Drag to adjust width | Smooth resize |

### 3.4 Order Form

| Field | Options/Behavior | Test Criteria |
|-------|------------------|---------------|
| Asset selector | Search + dropdown | Autocomplete works |
| Order type | Market, Limit, Stop-Loss, Take-Profit | All types available |
| Side | Buy/Long, Sell/Short | Toggle works |
| Quantity | Numeric input | Validation works |
| Price | For limit orders | Disabled for market |
| Leverage slider | 1x-10x | Adjusts margin |
| Stop Loss | Optional field | Validates against entry |
| Take Profit | Optional field | Validates against entry |
| Available margin | Display | Updates with leverage |
| Submit button | Place order | Disabled when invalid |

### 3.5 Order Confirmation Modal

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Order summary | All order details | Matches input |
| Current price | Market price | Real-time |
| Estimated fee | Trading fee | Calculated correctly |
| Total cost | Including fees | Math correct |
| Confirm button | Execute order | Submits order |
| Cancel button | Close modal | Returns to form |

### 3.6 Trade Receipt Modal

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Execution price | Fill price | Matches executed |
| Slippage | Price difference | Calculated correctly |
| Fee paid | Actual fee | Matches estimate |
| P&L | For closes | Calculated correctly |
| Order ID | Reference | Unique identifier |

### 3.7 Positions Tab

| Column | Description | Test Criteria |
|--------|-------------|---------------|
| Symbol | Trading pair | Correct asset |
| Side | Long/Short | Correct direction |
| Size | Position quantity | Numeric |
| Entry price | Average entry | Formatted |
| Current price | Real-time | Updates |
| P&L | Unrealized profit/loss | Color-coded |
| P&L % | Percentage | Calculated correctly |
| Liquidation price | For leveraged | Shows if applicable |
| Actions | Close, Modify | Buttons work |

### 3.8 Orders Tab

| Column | Description | Test Criteria |
|--------|-------------|---------------|
| Symbol | Trading pair | Correct asset |
| Type | Order type | Matches placed |
| Side | Buy/Sell | Correct |
| Price | Limit price | For limit orders |
| Size | Order quantity | Numeric |
| Filled | Filled amount | Updates on partial |
| Status | Pending/Partial/Filled/Cancelled | Color-coded |
| Actions | Cancel | Works for pending |
| Cancel All | Batch cancel | Cancels all pending |

### 3.9 History Tab

| Column | Description | Test Criteria |
|--------|-------------|---------------|
| Symbol | Trading pair | Correct |
| Side | Direction | Correct |
| Size | Executed quantity | Numeric |
| Entry price | Fill price | Formatted |
| Exit price | If closed | Formatted |
| P&L | Realized | Color-coded |
| Fee | Trading fee | Formatted |
| Time | Execution time | Formatted timestamp |

### 3.10 Drawdown Protection

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Warning banner | Shows at 75% limit | Appears correctly |
| Progress bar | Current drawdown % | Accurate |
| Block modal | At 100% limit | Prevents trading |
| Bypass once | Single trade exception | Works once |
| Reset portfolio | Restore starting | Resets balance |
| Settings link | Open settings | Navigates |

### 3.11 Position Management Modals

| Modal | Features | Test Criteria |
|-------|----------|---------------|
| Close Position | P&L preview, confirm | Closes position |
| Modify Position | Edit SL/TP | Saves changes |
| Add Margin | Increase margin | Updates position |

### 3.12 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Select asset | Update all panels | Chart, orderbook, form sync |
| Place market order | Immediate fill | Position appears |
| Place limit order | Pending order | Order in orders tab |
| Cancel order | Order cancelled | Removed from list |
| Close position | Position closed | Trade in history |
| Modify position | SL/TP updated | Changes reflected |
| Drag panel divider | Resize panels | Smooth resize |

---

## 4. Portfolio Page

### 4.1 Portfolio Summary

| Metric | Description | Test Criteria |
|--------|-------------|---------------|
| Portfolio value | Total value | Calculated correctly |
| Cash balance | Available cash | Formatted |
| Margin used | In positions | Percentage shown |
| Margin available | Free margin | Calculated |
| Unrealized P&L | Open position P&L | Color-coded |
| Realized P&L | Closed trades P&L | Color-coded |
| Total return % | Performance | Since inception |

### 4.2 Equity Curve Chart

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Line chart | Portfolio value over time | Renders correctly |
| Time range | 30 days default | Adjustable |
| Color | Green if positive, red if negative | Correct color |
| Hover tooltip | Value at point | Shows date + value |
| Empty state | No data message | Shows instructions |

### 4.3 Holdings List

| Column | Description | Test Criteria |
|--------|-------------|---------------|
| Symbol | Asset + avatar | Click navigates |
| Quantity | Holdings amount | Formatted |
| Avg price | Average cost basis | Calculated |
| Current value | Market value | Real-time |
| P&L | Profit/loss | Color-coded |
| P&L % | Percentage return | Calculated |
| Allocation % | Portfolio weight | Adds to 100% |

### 4.4 Open Positions Card

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Position count | Badge | Accurate count |
| Symbol | Trading pair | Correct |
| Side | Long/Short | Correct |
| Size | Position size | Numeric |
| Entry price | Average entry | Formatted |
| Current P&L | Unrealized | Updates real-time |
| Liquidation | If leveraged | Calculated |
| Updated highlight | Recently changed | Visual indicator |
| Close button | Quick close | Opens confirmation |
| Edit button | Modify SL/TP | Opens modal |

### 4.5 Recent Trades

| Column | Description | Test Criteria |
|--------|-------------|---------------|
| Symbol | Trading pair | Correct |
| Side | Buy/Sell | Correct |
| Size | Trade size | Numeric |
| Price | Execution price | Formatted |
| Fee | Trading fee | Formatted |
| P&L | Realized | Color-coded |
| Time | Execution time | Formatted |
| View All | Navigate | Goes to trading |

### 4.6 Demo Mode (Unauthenticated)

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Mock data | Fake portfolio shown | Indicates demo |
| No real trading | Actions disabled | Can't trade |
| Login prompt | Create account CTA | Visible |

---

## 5. Leaderboard

### 5.1 Header Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Title | "Leaderboard" | Displayed |
| Subtitle | "Top traders by performance" | Displayed |
| Timeframe tabs | 24h, 7d, 30d, All Time | All work |

### 5.2 Stats Overview Cards

| Card | Description | Test Criteria |
|------|-------------|---------------|
| Top Trader | Name + P&L | Shows #1 trader |
| Avg Win Rate | Percentage | Calculated correctly |
| Total Traders | Count | Matches list length |
| Your Rank | If authenticated | Shows user's position |

### 5.3 Leaderboard Rows

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Rank badge | 1-3 special colors | Gold/Silver/Bronze |
| Avatar | User image | Loads or placeholder |
| Username | Display name | Correct |
| Badges | Achievement icons | Up to 3 shown |
| Total trades | Trade count | Numeric |
| Open positions | Position count | Numeric |
| Win rate | Percentage | Formatted |
| Portfolio value | Total value | Formatted |
| P&L | Dollar amount | Color-coded |
| Return % | Percentage | Color-coded |
| Current user | Highlighted | Purple background |

### 5.4 Badge Types

| Badge | Emoji | Criteria |
|-------|-------|----------|
| whale | 🐋 | Large portfolio |
| diamond_hands | 💎 | Long hold times |
| hot_streak | 🔥 | Winning streak |
| consistent | 📈 | Steady returns |
| risk_taker | 🎲 | High leverage |
| early_bird | 🌅 | Morning trading |
| night_owl | 🦉 | Night trading |
| top_10 | 🏆 | Top 10 finish |
| top_100 | 🥇 | Top 100 finish |
| verified | ✓ | Verified account |

### 5.5 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Change timeframe | Data refetches | Rankings update |
| Scroll list | Load more | Pagination works |
| Click row | (Future) View profile | Clickable |

---

## 6. Profile/Account

### 6.1 Logged In State - Account Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Public key | Truncated display | First 16 + last 16 chars |
| Created date | Account creation | Formatted date |
| Logout button | Red icon | Triggers confirmation |

### 6.2 Private Key Management

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Security warning | Danger text | Visible |
| Reveal button | Toggle visibility | Shows/hides key |
| Key display | Monospace font | Full key when revealed |
| Copy button | Clipboard copy | "Copied!" feedback |
| Download button | JSON export | File downloads |
| Filename format | wraith-wallet-{pubkey}.json | Correct format |

### 6.3 Logged Out State

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Create Account | Generate keypair | Creates new account |
| Import section | Paste private key | Input field |
| Import button | Restore account | Validates + imports |
| Error display | Invalid key message | Shows on failure |

### 6.4 Server Connection (Authenticated)

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Status indicator | Green dot connected | Accurate state |
| Server profile ID | Truncated | Shows ID |
| Last seen | Timestamp | Recent |
| Username display | Display name | Correct |
| Disconnect button | Clear session | Works |

### 6.5 Leaderboard Opt-in

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Toggle switch | On/off | Persists |
| Description | Explanation text | Clear |
| Opt-in date | When enabled | Shows if on |
| Loading state | During toggle | Spinner |

### 6.6 Not Connected State

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Gray indicator | Not connected | Visible |
| Description | Connection benefits | Clear |
| Connect button | Start auth | Triggers flow |
| Login progress | Step tracker | Shows steps |
| Steps shown | Challenge → Sign → Verify → Profile | All displayed |

### 6.7 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Create account | Keypair generated | Keys saved |
| Import key | Account restored | Login successful |
| Reveal key | Key visible | Toggle works |
| Copy key | Copied to clipboard | Feedback shown |
| Download key | File downloaded | Valid JSON |
| Logout | Confirmation modal | Clears session |
| Connect to server | Auth flow starts | Progress shown |
| Disconnect | Session cleared | State reset |
| Toggle leaderboard | API call made | Preference saved |

---

## 7. Settings

### 7.1 Language Section

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Language dropdown | Select language | Options shown |
| Options | English, Korean | Native labels |
| Persistence | i18next storage | Survives reload |
| UI update | Translations change | Immediate effect |

### 7.2 App Settings

| Setting | Description | Test Criteria |
|---------|-------------|---------------|
| Speed selector | Normal/Fast/Turbo | Throttle changes |
| Throttle values | 1000ms/500ms/100ms | Updates correctly |
| Persistence | Saved preference | Survives reload |

### 7.3 Trading Settings (Drawdown Protection)

| Setting | Description | Test Criteria |
|---------|-------------|---------------|
| Max drawdown % | 0-100 input | Validates range |
| Warning threshold | Percentage | Below max |
| Allow bypass | Toggle | Works |
| Auto-reset after | 1 day/week/month | Dropdown |
| Calculation method | Peak/Starting balance | Radio buttons |

### 7.4 Servers Section

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| Server list | Available servers | All shown |
| Active indicator | Current server | Highlighted |
| Server name | Region/name | Displayed |
| Client ping | Latency ms | Updates |
| Mesh status | Connected peers | Shows count |
| Connection status | Online/offline | Color-coded |
| Switch server | Change API endpoint | Reconnects |

### 7.5 Interactions

| Action | Expected Result | Test Criteria |
|--------|-----------------|---------------|
| Change language | UI updates | All text changes |
| Change speed | Throttle updates | WS rate changes |
| Update drawdown | Setting saved | Persists |
| Select server | API switches | Data refetches |

---

## 8. Navigation & UI Components

### 8.1 Navbar Elements

| Element | Description | Test Criteria |
|---------|-------------|---------------|
| App logo | Brand mark | Clickable → home |
| Dashboard link | Navigation | Navigates |
| Portfolio link | Navigation | Navigates |
| Trade link | Navigation | Navigates |
| Leaderboard link | Navigation | Navigates |
| Profile link | Navigation | Navigates |
| Settings link | Navigation | Navigates |
| User status | Auth state | Correct icon |
| Theme toggle | Dark/light | Switches theme |
| Mobile menu | Hamburger | Opens/closes |

### 8.2 Search Component

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Search input | Text field | Accepts input |
| Autocomplete | Dropdown results | Shows matches |
| Keyboard shortcut | Cmd/Ctrl+K | Opens search |
| Result click | Navigate to asset | Works |
| Recent searches | History | Shows recent |
| Clear history | Clear button | Clears |

### 8.3 Toolbar (Dashboard)

| Control | Description | Test Criteria |
|---------|-------------|---------------|
| View toggle | List/Grid icons | Switches view |
| Card size slider | Dimension control | Adjusts size |
| Sort dropdown | Sort options | Changes sort |
| Filter dropdown | Filter options | Changes filter |
| Direction toggle | Asc/Desc arrows | Toggles |
| Asset type buttons | All/Crypto/Stocks | Filters |
| Offline toggle | Show/hide offline | Filters |

### 8.4 Common UI Components

| Component | Usage | Test Criteria |
|-----------|-------|---------------|
| Button variants | Primary/Secondary/Danger | Correct styling |
| Input fields | Text/Number inputs | Validation works |
| Toggle switch | Boolean settings | State changes |
| Dropdown/Select | Options selection | Opens/selects |
| Modal | Overlay dialogs | Opens/closes |
| Toast | Notifications | Shows/dismisses |
| Skeleton | Loading states | Renders |
| Badge | Status indicators | Correct colors |
| Progress bar | Progress display | Animates |
| Spinner | Loading indicator | Spins |

---

## 9. Real-Time WebSocket Features

### 9.1 Price Updates

| Data Point | Description | Test Criteria |
|------------|-------------|---------------|
| symbol | Asset identifier | Correct |
| price | Current price | Updates |
| previousPrice | Last price | For comparison |
| change24h | 24h change % | Calculated |
| volume24h | Trading volume | Updates |
| tradeDirection | Up/down | Arrow indicator |
| sources | Data sources | Count shown |
| timestamp | Update time | Recent |

### 9.2 Trading Updates (Authenticated)

| Event Type | Data | Test Criteria |
|------------|------|---------------|
| portfolio_update | Balance, margin, P&L | Refreshes UI |
| position_update | Position changes | Table updates |
| order_update | Order status changes | Table updates |
| alert_triggered | Price alert fired | Toast shown |

### 9.3 Market Updates

| Data | Description | Test Criteria |
|------|-------------|---------------|
| totalMarketCap | Global cap | Updates |
| totalVolume24h | Global volume | Updates |
| btcDominance | BTC % | Updates |

### 9.4 Connection Management

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Subscribe | Start receiving | Confirmation |
| Unsubscribe | Stop receiving | Confirmation |
| Throttle | Rate limit | Takes effect |
| Auto-reconnect | On disconnect | Reconnects |
| Error handling | Connection errors | Graceful |

---

## 10. Authentication System

### 10.1 Local Wallet

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Keypair generation | Ed25519-style | Valid keys |
| Storage | localStorage | Persists |
| Import | Paste key | Validates |
| Export | Copy/download | Works |

### 10.2 Backend Auth Flow

| Step | Description | Test Criteria |
|------|-------------|---------------|
| Get challenge | Request from server | Receives challenge |
| Sign challenge | With private key | Valid signature |
| Verify | Send to server | Token returned |
| Load profile | Fetch user data | Profile loaded |

### 10.3 Session Management

| Feature | Description | Test Criteria |
|---------|-------------|---------------|
| Token storage | localStorage | Persists |
| Session validation | Per request | 401 if invalid |
| Logout | Clear all data | Complete cleanup |

---

## 11. API Integration

### 11.1 Market Data Endpoints

| Endpoint | Purpose | Test Criteria |
|----------|---------|---------------|
| GET /api/crypto/listings | Asset list | Returns array |
| GET /api/crypto/:id | Asset details | Returns asset |
| GET /api/crypto/search | Search assets | Returns matches |
| GET /api/market/global | Global metrics | Returns stats |
| GET /api/market/fear-greed | Fear & Greed | Returns index |
| GET /api/market/movers | Top movers | Returns gainers/losers |

### 11.2 Trading Endpoints

| Endpoint | Purpose | Test Criteria |
|----------|---------|---------------|
| GET /api/trading/portfolios | List portfolios | Returns array |
| POST /api/trading/portfolios | Create portfolio | Returns new |
| GET /api/trading/positions | List positions | Returns array |
| DELETE /api/trading/positions/:id | Close position | Position closed |
| POST /api/trading/orders | Place order | Order created |
| DELETE /api/trading/orders/:id | Cancel order | Order cancelled |
| GET /api/trading/trades | Trade history | Returns array |
| GET /api/leaderboard | Top traders | Returns array |

### 11.3 Auth Endpoints

| Endpoint | Purpose | Test Criteria |
|----------|---------|---------------|
| GET /api/auth/challenge | Get challenge | Returns string |
| POST /api/auth/verify | Verify signature | Returns token |
| GET /api/auth/me | Get profile | Returns user |
| PUT /api/auth/profile | Update profile | Returns updated |

---

## 12. Data Models & Types

### 12.1 Asset

```typescript
{
  id: string
  rank: number
  name: string
  symbol: string
  image: string
  price: number
  change1h: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  sparkline: number[]
  tradeDirection: 'up' | 'down' | null
}
```

### 12.2 Position

```typescript
{
  id: string
  portfolioId: string
  symbol: string
  side: 'long' | 'short'
  quantity: number
  entryPrice: number
  currentPrice: number
  leverage: number
  marginMode: 'isolated' | 'cross'
  liquidationPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  stopLoss: number | null
  takeProfit: number | null
  createdAt: string
}
```

### 12.3 Order

```typescript
{
  id: string
  portfolioId: string
  symbol: string
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit'
  side: 'buy' | 'sell'
  price: number | null
  quantity: number
  filledQuantity: number
  status: 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'expired'
  createdAt: string
}
```

### 12.4 Trade

```typescript
{
  id: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  fee: number
  pnl: number
  executedAt: string
}
```

### 12.5 Portfolio

```typescript
{
  id: string
  userId: string
  name: string
  cashBalance: number
  marginUsed: number
  marginAvailable: number
  unrealizedPnl: number
  realizedPnl: number
  totalValue: number
  startingBalance: number
  totalTrades: number
  winningTrades: number
}
```

### 12.6 LeaderboardEntry

```typescript
{
  rank: number
  portfolioId: string
  userId: string
  username: string
  totalValue: number
  pnl: number
  totalReturnPct: number
  winRate: number
  tradeCount: number
  badges: string[]
}
```

---

## 13. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | ≤480px | Single column, stacked |
| Narrow | 481-767px | Reduced spacing |
| Tablet | 768-1199px | Two columns, toggles |
| Desktop | ≥1200px | Full three columns |

### Per-Page Adaptations

| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Dashboard | Grid 1-col | Grid 2-col | Grid 3-col |
| Trading | Stacked | Toggle panels | 3 panels |
| Portfolio | Stacked | 2 columns | Full layout |
| Leaderboard | Compact rows | Standard rows | Full rows |

---

## 14. Local Storage & Persistence

| Key | Purpose | Default |
|-----|---------|---------|
| wraith_viewMode | Asset view mode | 'grid' |
| wraith_cardSize | Grid card size | 200 |
| wraith_filters | Active filters | {} |
| wraith_theme | Dark/light mode | 'dark' |
| wraith_speed | Update speed | 'fast' |
| wraith_private_key | Encrypted key | null |
| wraith_user | Account metadata | null |
| wraith_session_token | Auth token | null |
| wraith_server_profile | Server profile | null |
| wraith_server_url | Selected server | default |
| i18nextLng | Language | 'en' |

---

## 15. Error Handling & Edge Cases

### 15.1 Connection Errors

| Scenario | Behavior | Test Criteria |
|----------|----------|---------------|
| WebSocket disconnect | Auto-reconnect | Reconnects |
| API 500 error | Error toast | Shows message |
| API 401 error | Redirect to login | Clears session |
| API 429 rate limit | Retry with backoff | Succeeds eventually |
| Network offline | Offline banner | Shows banner |

### 15.2 Empty States

| Scenario | Display | Test Criteria |
|----------|---------|---------------|
| No holdings | "Start trading..." | Message shown |
| No trades | "No historical data" | Message shown |
| No positions | Empty table | Placeholder row |
| No leaderboard entries | Icon + message | Placeholder |
| Search no results | "No results found" | Message shown |

### 15.3 Loading States

| Component | Loading UI | Test Criteria |
|-----------|------------|---------------|
| Asset list | Skeleton cards | Shows skeletons |
| Tables | Skeleton rows | Shows skeletons |
| Charts | Loading spinner | Shows spinner |
| API calls | Loading indicator | Shows indicator |
| Page load | Full skeleton | Shows skeleton |

### 15.4 Validation Errors

| Field | Validation | Error Message |
|-------|------------|---------------|
| Order quantity | > 0 | "Quantity must be positive" |
| Order price | > 0 | "Price must be positive" |
| Leverage | 1-10 | "Leverage must be 1-10x" |
| Stop loss | < entry (long) | "Stop loss must be below entry" |
| Take profit | > entry (long) | "Take profit must be above entry" |
| Private key | Valid format | "Invalid private key format" |

---

## Testing Checklist Summary

### Critical Paths (Must Test)

1. [ ] Account creation → Login → Trading → Position → Close → Logout
2. [ ] Place market order → Fill → Position created → P&L updates
3. [ ] Place limit order → Wait → Cancel
4. [ ] Open leveraged position → Price drops → Liquidation warning → Liquidation
5. [ ] Server switch → Data reloads → Session persists
6. [ ] WebSocket disconnect → Reconnect → Subscriptions restored

### Feature Coverage Targets

| Category | Features | Priority |
|----------|----------|----------|
| Authentication | 12 | Critical |
| Trading Core | 25 | Critical |
| Portfolio | 15 | High |
| Market Data | 20 | High |
| Signals | 15 | Medium |
| Leaderboard | 10 | Medium |
| Settings | 10 | Medium |
| UI/UX | 30 | Low |

---

*Total Features: 150+*
*Total Interactions: 80+*
*Total Data Points: 100+*
