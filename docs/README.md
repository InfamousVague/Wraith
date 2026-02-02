# Wraith Documentation

Wraith is a React-based cryptocurrency dashboard that displays real-time price data, charts, and market metrics.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Wraith (Frontend)                         │
│  React + React Native Web + Ghost Design System                  │
├─────────────────────────────────────────────────────────────────┤
│  Components: AssetList, AdvancedChart, Navbar, etc.             │
│  Hooks: useCryptoData, useChartData, useHauntSocket             │
│  Services: haunt.ts (API client)                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Haunt (Backend)                          │
│  Rust + Axum + Redis                                            │
├─────────────────────────────────────────────────────────────────┤
│  Multi-source price aggregation                                  │
│  Historical data seeding                                         │
│  Real-time WebSocket updates                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Wraith/
├── src/
│   ├── components/     # React components
│   │   ├── AssetList.tsx
│   │   ├── AdvancedChart.tsx
│   │   ├── HeartbeatChart.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── hooks/          # Custom React hooks
│   │   ├── useCryptoData.ts
│   │   ├── useChartData.ts
│   │   └── useHauntSocket.tsx
│   ├── services/       # API clients
│   │   └── haunt.ts
│   ├── pages/          # Page components
│   └── types/          # TypeScript types
├── e2e/                # Playwright E2E tests
└── docs/               # Documentation
```

## Key Components

| Component | Description |
|-----------|-------------|
| `AssetList` | Main cryptocurrency table with prices, changes, and sparklines |
| `AdvancedChart` | Interactive chart with candlestick, line, and area modes |
| `HeartbeatChart` | Animated ECG-style loading indicator for charts |
| `Navbar` | Top navigation with search and theme toggle |
| `AssetHeader` | Asset detail page header with price and change |

## Key Hooks

| Hook | Description |
|------|-------------|
| `useCryptoData` | Fetches crypto listings with pagination and real-time updates |
| `useChartData` | Manages chart data fetching, seeding status, and real-time updates |
| `useHauntSocket` | WebSocket connection management for real-time prices |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## Environment Variables

```env
VITE_HAUNT_API_URL=http://localhost:3000
VITE_HAUNT_WS_URL=ws://localhost:3000/ws
```

## Documentation

- [Architecture](./architecture.md) - System design and data flow
- [Components](./components.md) - Component usage guide
