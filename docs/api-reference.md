# Haunt API Reference

The Haunt backend provides real-time cryptocurrency data, trading signals, and market analytics.

## Base Configuration

- **Development**: Requests proxied through Vite to `http://localhost:3001`
- **Production**: Set `VITE_HAUNT_URL` environment variable
- **WebSocket**: `ws://localhost:3001/ws` or `VITE_HAUNT_WS_URL`

## Response Format

All endpoints return:
```typescript
{
  data: T;
  meta: {
    cached: boolean;
    total?: number;
    start?: number;
    limit?: number;
  };
}
```

---

## Cryptocurrency Endpoints

### GET /api/crypto/listings
Get paginated cryptocurrency listings with filtering and sorting.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| start | number | 0 | Pagination offset |
| limit | number | 50 | Items per page (max 100) |
| sort | string | market_cap | Sort field |
| sort_dir | string | desc | asc or desc |
| filter | string | all | all, gainers, losers, most_volatile, top_volume |
| asset_type | string | all | all, crypto, stock, etf |

**Sort Fields:** market_cap, price, volume_24h, percent_change_1h, percent_change_24h, percent_change_7d, name

### GET /api/crypto/:id
Get a single cryptocurrency by ID.

### GET /api/crypto/:id/quotes
Get latest quotes for a cryptocurrency.

### GET /api/crypto/search
Search cryptocurrencies by name or symbol.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | required | Search query |
| limit | number | 20 | Max results |

### GET /api/crypto/:id/chart
Get OHLCV chart data for a cryptocurrency.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| range | string | 1d | Time range: 1h, 4h, 1d, 1w, 1m, 3m, 1y, all |

**Response:**
```typescript
{
  symbol: string;
  range: string;
  data: OhlcPoint[];
  seeding?: boolean;
  seedingStatus?: "not_started" | "in_progress" | "complete" | "failed";
}
```

### POST /api/crypto/seed
Trigger historical data seeding for a symbol.

**Body:** `{ symbol: string }`

---

## Market Endpoints

### GET /api/market/global
Get global market metrics.

**Response:**
```typescript
{
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  activeExchanges: number;
  marketCapChange24h: number;
  volumeChange24h: number;
  lastUpdated: string;
}
```

### GET /api/market/fear-greed
Get Fear & Greed Index.

**Response:**
```typescript
{
  value: number;        // 0-100
  classification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  timestamp: string;
}
```

### GET /api/market/movers
Get top gainers and losers.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| timeframe | string | 1h | 1m, 5m, 15m, 1h, 4h, 24h |
| limit | number | 10 | Max 50 |
| asset_type | string | all | Filter by asset type |

### GET /api/market/stats
Get API statistics (TPS, uptime, sources).

**Response:**
```typescript
{
  totalUpdates: number;
  tps: number;
  uptimeSecs: number;
  activeSymbols: number;
  onlineSources: number;
  totalSources: number;
  exchanges: ExchangeStat[];
}
```

### GET /api/market/source-stats/:symbol
Get source statistics for a specific symbol.

### GET /api/market/confidence/:symbol
Get confidence metrics for a symbol (data quality, source diversity).

---

## Signals Endpoints

### GET /api/signals/:symbol
Get trading signals for a symbol.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| timeframe | string | day_trading | scalping, day_trading, swing_trading, position_trading |

**Response:**
```typescript
{
  symbol: string;
  timeframe: TradingTimeframe;
  signals: SignalOutput[];
  trendScore: number;      // -100 to +100
  momentumScore: number;
  volatilityScore: number;
  volumeScore: number;
  compositeScore: number;
  direction: SignalDirection;
  timestamp: number;
}
```

### GET /api/signals/:symbol/accuracy
Get signal accuracy stats for a symbol.

### GET /api/signals/:symbol/predictions
Get predictions for a symbol.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | all | all, validated, pending |
| limit | number | 50 | Max 500 |

### GET /api/signals/:symbol/recommendation
Get accuracy-weighted recommendation (Buy/Sell/Hold).

### POST /api/signals/:symbol/generate
Force generate fresh predictions.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| timeframe | string | day_trading | Trading timeframe |

### GET /api/signals/accuracy/:indicator
Get global accuracy stats for an indicator.

---

## Order Book Endpoints

### GET /api/orderbook/:symbol
Get aggregated order book across exchanges.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| depth | number | 50 | Price levels (max 100) |

**Response:**
```typescript
{
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
  exchanges: string[];
  timestamp: number;
}
```

---

## Peer Mesh Endpoints

### GET /api/peers
Get peer mesh status (all connected servers).

**Response:**
```typescript
{
  serverId: string;
  serverRegion: string;
  peers: PeerStatus[];
  connectedCount: number;
  totalPeers: number;
  timestamp: number;
}
```

### GET /api/peers/:peerId
Get a specific peer's status.

---

## Authentication Endpoints

### GET /api/auth/challenge
Get a challenge to sign for authentication.

**Response:**
```typescript
{
  challenge: string;
  timestamp: number;
  expiresAt: number;
}
```

### POST /api/auth/verify
Verify a signed challenge and create a session.

**Body:**
```typescript
{
  publicKey: string;
  challenge: string;
  signature: string;
  timestamp: number;
}
```

### GET /api/auth/me
Get current user's profile (requires Bearer token).

### PUT /api/auth/profile
Update profile settings (requires Bearer token).

### POST /api/auth/logout
Logout and invalidate session (requires Bearer token).

---

## WebSocket API

Connect to `/ws` for real-time updates.

### Message Types

**Subscribe to assets:**
```json
{ "type": "subscribe", "assets": ["btc", "eth"] }
```

**Unsubscribe:**
```json
{ "type": "unsubscribe", "assets": ["btc"] }
```

**Set throttle:**
```json
{ "type": "set_throttle", "throttle_ms": 100 }
```

**Subscribe to peers:**
```json
{ "type": "subscribe_peers" }
```

### Incoming Messages

**Price update:**
```typescript
{
  type: "price_update";
  data: {
    id: number;
    symbol: string;
    price: number;
    previousPrice?: number;
    change24h?: number;
    volume24h?: number;
    tradeDirection?: "up" | "down";
    source?: string;
    sources?: string[];
    timestamp: string;
  };
}
```

**Market update:**
```typescript
{
  type: "market_update";
  data: {
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    timestamp: string;
  };
}
```

**Peer update:**
```typescript
{
  type: "peer_update";
  data: {
    serverId: string;
    serverRegion: string;
    peers: PeerStatus[];
    timestamp: number;
  };
}
```

### Trading WebSocket Messages

**Subscribe to portfolio:**
```json
{ "type": "subscribe_portfolio" }
```

**Unsubscribe:**
```json
{ "type": "unsubscribe_portfolio" }
```

**Portfolio update:**
```typescript
{
  type: "portfolio_update";
  data: {
    balance: number;
    marginUsed: number;
    marginAvailable: number;
    unrealizedPnl: number;
    realizedPnl: number;
    totalValue: number;
    timestamp: number;
  };
}
```

**Position update:**
```typescript
{
  type: "position_update";
  data: {
    id: string;
    symbol: string;
    side: "long" | "short";
    size: number;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    liquidationPrice: number;
    event: "opened" | "updated" | "closed" | "liquidated";
    timestamp: number;
  };
}
```

**Order update:**
```typescript
{
  type: "order_update";
  data: {
    id: string;
    symbol: string;
    type: "market" | "limit" | "stop_loss" | "take_profit";
    side: "buy" | "sell";
    price?: number;
    size: number;
    filledSize: number;
    status: "pending" | "partial" | "filled" | "cancelled" | "rejected";
    event: "created" | "filled" | "partial" | "cancelled" | "rejected";
    executionPrice?: number;
    fee?: number;
    pnl?: number;
    timestamp: number;
  };
}
```

**Alert triggered:**
```typescript
{
  type: "alert_triggered";
  data: {
    id: string;
    symbol: string;
    condition: "above" | "below" | "crosses";
    targetPrice: number;
    currentPrice: number;
    timestamp: number;
  };
}
```

---

## Planned Endpoints (Not Yet Implemented)

### Exchange Dominance by Region
`GET /api/market/exchange-dominance/:symbol`

Returns exchange volume dominance by geographic region for optimal server selection.

**Response (planned):**
```typescript
{
  symbol: string;
  regions: {
    region: string;       // "americas", "europe", "asia"
    dominantExchange: string;
    percentage: number;
    volume24h: number;
    exchanges: {
      name: string;
      percentage: number;
    }[];
  }[];
  timestamp: number;
}
```

### Portfolio Endpoints (Planned)
- `GET /api/portfolio` - Get user portfolio
- `GET /api/portfolio/holdings` - Get holdings breakdown
- `GET /api/portfolio/performance` - Get performance history
- `POST /api/portfolio/trade` - Execute paper trade

### Trading Endpoints (Implemented)
- `GET /api/trades` - Get trade history
- `GET /api/trades?symbol=X&side=Y` - Get filtered trade history
- `GET /api/positions` - Get open positions
- `PUT /api/positions/:id` - Modify position (SL/TP/trailing stop)
- `POST /api/positions/:id/close` - Close position
- `POST /api/positions/:id/margin` - Add margin to position
- `GET /api/orders` - Get pending orders
- `POST /api/orders` - Place order
- `PUT /api/orders/:id` - Modify order
- `DELETE /api/orders/:id` - Cancel order
- `DELETE /api/orders` - Cancel all orders
- `DELETE /api/orders?symbol=X` - Cancel orders by symbol

---

## Leaderboard Endpoints

### GET /api/leaderboard
Get trading leaderboard rankings.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| timeframe | string | weekly | daily, weekly, monthly, all_time |
| limit | number | 50 | Max results |

**Response:**
```typescript
{
  timeframe: LeaderboardTimeframe;
  entries: LeaderboardEntry[];
  total: number;
  lastUpdated: number;
}
```

### GET /api/leaderboard/me
Get current user's leaderboard rank (requires Bearer token).

**Response:**
```typescript
{
  id: string;
  displayName: string;
  rank: number;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  totalTrades: number;
  // ... other LeaderboardEntry fields
}
```

### GET /api/leaderboard/:traderId
Get a specific trader's stats.

**Response:** `LeaderboardEntry`

---

## Alerts Endpoints

### GET /api/alerts
Get all user price alerts (requires Bearer token).

**Response:**
```typescript
Alert[]
// where Alert = {
//   id: string;
//   symbol: string;
//   condition: "above" | "below" | "crosses";
//   targetPrice: number;
//   currentPrice?: number;
//   triggered: boolean;
//   triggeredAt?: number;
//   createdAt: number;
//   expiresAt?: number;
//   notifyEmail?: boolean;
//   notifyPush?: boolean;
// }
```

### POST /api/alerts
Create a new price alert (requires Bearer token).

**Body:**
```typescript
{
  symbol: string;
  condition: "above" | "below" | "crosses";
  targetPrice: number;
  expiresAt?: number;
  notifyEmail?: boolean;
  notifyPush?: boolean;
}
```

**Response:** `Alert`

### DELETE /api/alerts/:id
Delete an alert (requires Bearer token).

**Response:** `{ success: boolean }`

---

## Account Endpoints

### GET /api/account/summary
Get account summary with margin info and risk level (requires Bearer token).

**Response:**
```typescript
{
  balance: number;
  equity: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  realizedPnl: number;
  todayPnl: number;
  todayPnlPercent: number;
  openPositions: number;
  pendingOrders: number;
  leverage: number;
  marginLevel: number;       // equity / marginUsed
  liquidationRisk: "low" | "medium" | "high" | "critical";
}
```

### GET /api/account/transactions
Get transaction history (requires Bearer token).

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | all | deposit, withdraw, transfer, fee, funding, liquidation, bonus |
| status | string | all | pending, completed, failed, cancelled |
| startTime | number | - | Unix timestamp |
| endTime | number | - | Unix timestamp |
| limit | number | 50 | Max results |

**Response:**
```typescript
Transaction[]
// where Transaction = {
//   id: string;
//   type: "deposit" | "withdraw" | "transfer" | "fee" | "funding" | "liquidation" | "bonus";
//   amount: number;
//   balance: number;  // Balance after transaction
//   description: string;
//   status: "pending" | "completed" | "failed" | "cancelled";
//   createdAt: number;
//   completedAt?: number;
// }
```

### GET /api/account/stats
Get trading statistics (requires Bearer token).

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| timeframe | string | all | today, week, month, year, all |

**Response:**
```typescript
{
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgHoldTime: number;     // seconds
  totalVolume: number;
  totalFees: number;
  netPnl: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}
```

---

## Funding Rate Endpoints

### GET /api/market/funding
Get current funding rates for perpetual contracts.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| symbols | string | - | Comma-separated symbols (optional) |

**Response:**
```typescript
FundingRate[]
// where FundingRate = {
//   symbol: string;
//   rate: number;
//   nextFundingTime: number;
//   predictedRate?: number;
//   interval: number;  // hours
// }
```

### GET /api/market/funding/:symbol/history
Get funding rate history for a symbol.

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 100 | Max results |

**Response:**
```typescript
FundingHistory[]
// where FundingHistory = {
//   symbol: string;
//   rate: number;
//   timestamp: number;
//   payment?: number;  // If user had position
// }
```
