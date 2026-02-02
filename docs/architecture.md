# Wraith-Haunt Architecture

This document describes the architecture and data flow between Wraith (frontend) and Haunt (backend).

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                           External APIs                               │
│  CoinMarketCap │ CoinGecko │ CryptoCompare │ Binance │ Coinbase     │
└────────┬───────┴─────┬─────┴───────┬───────┴────┬────┴──────┬───────┘
         │             │             │            │           │
         ▼             ▼             ▼            ▼           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Haunt Backend                                 │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ Price Cache    │  │ Chart Store    │  │ Historical Svc │         │
│  │ (in-memory)    │  │ (in-memory)    │  │ (Redis)        │         │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘         │
│          │                   │                   │                   │
│          └───────────────────┴───────────────────┘                   │
│                              │                                        │
│                    ┌─────────┴─────────┐                             │
│                    │ Multi-Source      │                             │
│                    │ Coordinator       │                             │
│                    └─────────┬─────────┘                             │
│                              │                                        │
│              ┌───────────────┼───────────────┐                       │
│              │               │               │                       │
│         REST API      WebSocket        Background                    │
│         /api/*        /ws              Seeding Tasks                 │
└──────────────┬───────────────┬───────────────────────────────────────┘
               │               │
               ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Wraith Frontend                                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ haunt.ts       │  │ useHauntSocket │  │ useChartData   │         │
│  │ (REST client)  │  │ (WebSocket)    │  │ (Chart hook)   │         │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘         │
│          │                   │                   │                   │
│          └───────────────────┴───────────────────┘                   │
│                              │                                        │
│                    ┌─────────┴─────────┐                             │
│                    │ React Components  │                             │
│                    │ (AssetList, etc)  │                             │
│                    └───────────────────┘                             │
└──────────────────────────────────────────────────────────────────────┘
```

## REST API Endpoints

### Crypto Listings

```
GET /api/crypto/listings
  ?start=1
  &limit=20
  &sort=market_cap
  &sort_dir=desc
  &filter=gainers|losers|all
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "rank": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "image": "https://...",
      "price": 50000.00,
      "change1h": 0.5,
      "change24h": 2.5,
      "change7d": 5.0,
      "marketCap": 1000000000000,
      "volume24h": 50000000000,
      "sparkline": [49000, 49500, 50000, ...],
      "tradeDirection": "up"
    }
  ],
  "meta": {
    "total": 100,
    "start": 1,
    "limit": 20
  }
}
```

### Asset Detail

```
GET /api/crypto/:id
```

### Chart Data

```
GET /api/crypto/:id/chart?range=1d
```

**Response:**
```json
{
  "data": {
    "symbol": "btc",
    "range": "1d",
    "data": [
      { "time": 1704067200, "open": 50000, "high": 50500, "low": 49800, "close": 50200 }
    ],
    "seeding": false,
    "seedingStatus": "complete",
    "seedingProgress": 100,
    "dataCompleteness": 95,
    "expectedPoints": 288
  }
}
```

### Search

```
GET /api/crypto/search?q=bit&limit=10
```

## WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

### Client Messages

**Subscribe:**
```json
{"type": "subscribe", "assets": ["btc", "eth", "sol"]}
```

**Unsubscribe:**
```json
{"type": "unsubscribe", "assets": ["sol"]}
```

### Server Messages

**Price Update:**
```json
{
  "type": "price_update",
  "data": {
    "id": "btc",
    "symbol": "btc",
    "price": 50000.00,
    "previousPrice": 49500.00,
    "change24h": 2.5,
    "volume24h": 50000000000,
    "tradeDirection": "up",
    "source": "coinbase",
    "sources": ["coinbase", "binance"],
    "timestamp": 1704067200000
  }
}
```

**Seeding Progress:**
```json
{
  "type": "seeding_progress",
  "data": {
    "symbol": "btc",
    "status": "in_progress",
    "progress": 50,
    "points": 500,
    "message": "Fetching from CoinGecko..."
  }
}
```

**Market Update:**
```json
{
  "type": "market_update",
  "data": {
    "totalMarketCap": 2000000000000,
    "totalVolume24h": 100000000000,
    "btcDominance": 45.5,
    "timestamp": 1704067200000
  }
}
```

## Data Flow

### Initial Page Load

1. Wraith calls `GET /api/crypto/listings`
2. Haunt returns cached listings from CMC
3. Wraith establishes WebSocket connection
4. Wraith subscribes to visible assets
5. Haunt sends real-time price updates

### Chart Loading

1. User navigates to asset detail
2. Wraith calls `GET /api/crypto/:id/chart?range=1d`
3. Haunt checks chart store for data
4. If data is inadequate, Haunt triggers background seeding
5. Haunt returns available data + seeding status
6. Wraith shows HeartbeatChart during seeding
7. Wraith polls for updates while `seedingStatus: "in_progress"`
8. Once complete, Wraith renders the chart

### Real-Time Updates

1. Haunt receives price from exchange WebSocket
2. Price is aggregated with other sources
3. PriceCache determines trade direction (up/down)
4. Update is broadcast to subscribed WebSocket clients
5. Wraith updates chart data in real-time

## Chart Data Seeding

Historical data is seeded from multiple sources:

1. **CoinGecko** (primary): Market chart for 1, 7, 30, 90 days
2. **CryptoCompare** (supplement): Hourly OHLC up to 2000 hours

Seeding progress:
- 0%: Starting
- 10-50%: Fetching from CoinGecko
- 60-75%: Fetching from CryptoCompare hourly
- 85%: Fetching CryptoCompare daily
- 100%: Complete

Data is stored in Redis for persistence across restarts.
