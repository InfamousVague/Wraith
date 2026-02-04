# API Data Validation Checklist

This checklist tracks all UI components that should use real API data for authenticated users.

## Running the Tests

```bash
# Run API validation tests
npx playwright test e2e/api-data-validation.spec.ts --headed

# Run with debug output
DEBUG=pw:api npx playwright test e2e/api-data-validation.spec.ts --headed
```

---

## Portfolio Page (`/portfolio`)

### Portfolio Summary Component
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Balance | `portfolio.cashBalance` | [ ] | Must show real balance from API |
| Margin Used | `portfolio.marginUsed` | [ ] | From API |
| Margin Available | `portfolio.marginAvailable` | [ ] | From API |
| Unrealized P&L | `portfolio.unrealizedPnl` | [ ] | From API |
| Realized P&L | `portfolio.realizedPnl` | [ ] | From API |

### Performance Cards
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Total P&L | Calculated from portfolio | [ ] | `realizedPnl + unrealizedPnl` |
| Realized | `portfolio.realizedPnl` | [ ] | From API |
| Unrealized | `portfolio.unrealizedPnl` | [ ] | From API |
| Portfolio Value | `portfolio.totalValue` | [ ] | From API |

### Equity Curve Chart
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Chart Data | `usePerformance(portfolioId)` | [ ] | Empty state if no data |
| Total Value | `portfolio.totalValue` | [ ] | From API |

### Holdings Section
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Holdings List | `useHoldings(portfolioId)` | [ ] | Empty state if no holdings |
| Asset Count | `displayHoldings.length` | [ ] | Should be 0 if empty |
| Treemap Chart | `displayHoldings` | [ ] | Not shown if empty |

### Open Positions Section
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Positions List | `usePositions(portfolioId)` | [ ] | Only shows if positions exist |
| Position Count | `displayPositions.length` | [ ] | From API |

### Recent Trades Section
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Trade History | `useTrades(portfolioId, 10)` | [ ] | From API |

---

## TradeSandbox Page (`/trade-sandbox`)

### Portfolio Data (for Order Form)
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Available Margin | `portfolio.marginAvailable` | [ ] | Used in order form |
| Balance | `portfolio.cashBalance` | [ ] | May be displayed |

### Positions Tab
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Positions Table | `usePositions(portfolioId)` | [ ] | Empty if no positions |
| Position P&L | From API position data | [ ] | Real-time updates |
| Close Position | Calls `closePosition` API | [ ] | Real action |
| Modify Position | Calls `modifyPosition` API | [ ] | Real action |

### Orders Tab
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Orders Table | `useOrders(portfolioId)` | [ ] | Empty if no orders |
| Cancel Order | Calls `cancelOrder` API | [ ] | Real action |
| Cancel All | Calls `cancelAllOrders` API | [ ] | Real action |

### History Tab
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Trade History | `useTrades(portfolioId, 20)` | [ ] | From API |

### Order Form
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Place Order | Calls `placeOrder` API | [ ] | Real action for authenticated |
| Available Margin Display | `portfolio.marginAvailable` | [ ] | From API |

---

## Trade Page (`/trade`)

### Portfolio Summary
| Component | Data Source | Status | Notes |
|-----------|-------------|--------|-------|
| Balance | `portfolio.cashBalance` | [ ] | From `usePortfolio` |
| Margin Used | `portfolio.marginUsed` | [ ] | From API |
| Margin Available | `portfolio.marginAvailable` | [ ] | From API |
| Unrealized P&L | `portfolio.unrealizedPnl` | [ ] | From API |
| Realized P&L | `portfolio.realizedPnl` | [ ] | From API |

---

## Known Issues to Fix

### 1. usePortfolio Hook - User ID Issue
**File:** `src/hooks/usePortfolio.ts`
**Problem:** The hook may not be correctly identifying the user to fetch their portfolio.
**Status:** [ ] Fixed

**Debugging steps:**
1. Check browser console for `[usePortfolio]` logs
2. Verify session token is present
3. Check API response in Network tab
4. Compare with direct API call: `curl "http://localhost:3001/api/trading/portfolios" -H "Authorization: Bearer <token>"`

### 2. Balance Field Mapping
**File:** `src/hooks/usePortfolio.ts`, `src/pages/Portfolio.tsx`, `src/pages/TradeSandbox.tsx`
**Problem:** API returns `cashBalance`, UI expects `balance`
**Status:** [x] Fixed - Added mapping in components

### 3. Mock Data Fallback Logic
**Files:** `src/pages/Portfolio.tsx`, `src/pages/TradeSandbox.tsx`
**Problem:** Previously showed mock data for authenticated users with empty data
**Status:** [x] Fixed - `usingRealData = isAuthenticated`

---

## Hooks Data Flow

```
AuthContext
├── sessionToken (from server auth)
├── serverProfile (contains user id)
└── isAuthenticated

usePortfolio(pollInterval)
├── Input: sessionToken from AuthContext
├── API Call: GET /api/trading/portfolios
├── Output: { portfolio, portfolioId, loading, error, refetch }
└── Note: Uses session token for auth, no user_id param needed

usePositions(portfolioId)
├── Input: portfolioId from usePortfolio
├── API Call: GET /api/trading/positions?portfolio_id=X
└── Output: { positions, closePosition, modifyPosition, ... }

useOrders(portfolioId)
├── Input: portfolioId from usePortfolio
├── API Call: GET /api/trading/orders?portfolio_id=X
└── Output: { orders, placeOrder, cancelOrder, ... }

useTrades(portfolioId, limit)
├── Input: portfolioId from usePortfolio
├── API Call: GET /api/trading/trades?portfolio_id=X&limit=Y
└── Output: { trades, loading, error }

useHoldings(portfolioId)
├── Input: portfolioId from usePortfolio
├── API Call: GET /api/trading/portfolios/X/holdings
└── Output: { holdings, loading, error }

usePerformance(portfolioId, period)
├── Input: portfolioId from usePortfolio
├── API Call: GET /api/trading/portfolios/X/performance?period=Y
└── Output: { performance, loading, error }
```

---

## Testing Commands

```bash
# Run all API validation tests
npx playwright test e2e/api-data-validation.spec.ts

# Run with browser visible
npx playwright test e2e/api-data-validation.spec.ts --headed

# Run specific test
npx playwright test e2e/api-data-validation.spec.ts -g "portfolio balance"

# Debug mode
npx playwright test e2e/api-data-validation.spec.ts --debug

# Generate report
npx playwright test e2e/api-data-validation.spec.ts --reporter=html
```

---

## Manual Testing Checklist

1. [ ] Create a new account via `/profile`
2. [ ] Verify console shows `[usePortfolio] Fetching portfolios`
3. [ ] Check Network tab for API calls to `/api/trading/portfolios`
4. [ ] Verify API response contains portfolio with `cashBalance`
5. [ ] Navigate to `/portfolio`
6. [ ] Verify Balance shows API value (not $0 if API has data)
7. [ ] Verify Margin Used/Available match API
8. [ ] Verify P&L values match API
9. [ ] Navigate to `/trade-sandbox`
10. [ ] Verify Positions tab shows real positions (or empty)
11. [ ] Verify Orders tab shows real orders (or empty)
12. [ ] Verify order form available margin matches API

---

## API Endpoints Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/trading/portfolios` | GET | Yes | List user's portfolios |
| `/api/trading/portfolios/:id` | GET | Yes | Get specific portfolio |
| `/api/trading/portfolios/:id/holdings` | GET | Yes | Get portfolio holdings |
| `/api/trading/portfolios/:id/performance` | GET | Yes | Get performance data |
| `/api/trading/positions` | GET | Yes | List open positions |
| `/api/trading/orders` | GET | Yes | List pending orders |
| `/api/trading/trades` | GET | Yes | List trade history |
