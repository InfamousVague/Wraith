# Frontend Integration Plan

Checklist for wiring Wraith frontend to the Haunt backend API.

> **See also**: [Trading Integration Checklist](./trading-integration-checklist.md) for comprehensive trading feature wiring.

## Current State

### Already Wired Up
- [x] Asset listings (`useCryptoData` → `/api/crypto/listings`)
- [x] Single asset fetch (`hauntClient.getAsset` → `/api/crypto/:id`)
- [x] Chart data (`AdvancedChart` → `/api/crypto/:id/chart`)
- [x] WebSocket price updates (`useHauntSocket` → `/ws`)
- [x] Global metrics (`MetricsCarousel` → `/api/market/global`)
- [x] Fear & Greed Index (`useFearGreed` → `/api/market/fear-greed`)
- [x] Trading signals (`useSignals` → `/api/signals/:symbol`)
- [x] Signal accuracy (`useSignals` → `/api/signals/:symbol/accuracy`)
- [x] Signal predictions (`useSignals` → `/api/signals/:symbol/predictions`)
- [x] Recommendations (`useSignals` → `/api/signals/:symbol/recommendation`)
- [x] Order book (`useOrderBook` → `/api/orderbook/:symbol`)
- [x] Source stats (`AssetSourceBreakdown` → `/api/market/source-stats/:symbol`)
- [x] Confidence metrics (`AssetSourceBreakdown` → `/api/market/confidence/:symbol`)
- [x] Authentication flow (`AuthContext` → `/api/auth/*`)
- [x] Peer mesh status (`useHauntSocket` → `/api/peers`)
- [x] API health check (`ApiServerContext` → `/api/health`)
- [x] Leaderboard (`useLeaderboard` → `/api/leaderboard`)

### Not Yet Wired Up
- [x] Exchange dominance by region (wired in `KeyMetricsPanel`)
- [x] Portfolio holdings (wired in `Portfolio.tsx` with mock fallback)
- [x] Portfolio performance/equity curve (wired with mock fallback)
- [x] Trade execution (wired in `TradeSandbox` via useOrders.placeOrder)
- [x] Positions management (wired in `TradeSandbox` via usePositions)
- [x] Orders management (wired in `TradeSandbox` via useOrders)
- [x] Trade history (wired in `TradeSandbox` via useTrades)
- [ ] Top movers real-time updates
- [ ] Search functionality in navbar

---

## Phase 1: Exchange Dominance Integration ✅

**Priority: High** - Needed for server selection feature

### Tasks
- [x] 1.1 Add `getExchangeDominance` method to `hauntClient`
- [x] 1.2 Create `useExchangeDominance` hook
- [x] 1.3 Wire `KeyMetricsPanel` to use real data
- [x] 1.4 Add loading/error states

### Files to Modify
- `src/services/haunt.ts` - Add API method
- `src/hooks/useExchangeDominance.ts` - New hook
- `src/components/asset/key-metrics-panel/KeyMetricsPanel.tsx` - Wire up
- `src/components/asset/key-metrics-panel/types.ts` - Add types

---

## Phase 2: Portfolio Integration ✅

**Priority: High** - Core feature for trading

### Tasks
- [x] 2.1 Add portfolio API methods to `hauntClient`
  - `getPortfolio()` - Account balance, margin
  - `getHoldings()` - Asset breakdown
  - `getPerformance(range)` - Equity curve data
- [x] 2.2 Create `usePortfolio` hook with polling
- [x] 2.3 Create `useHoldings` hook
- [x] 2.4 Create `usePerformance` hook
- [x] 2.5 Wire `Portfolio.tsx` to real data
- [x] 2.6 Wire `PortfolioSummary` component
- [ ] 2.7 Add WebSocket subscription for portfolio updates

### Files to Modify
- `src/services/haunt.ts` - Add API methods
- `src/hooks/usePortfolio.ts` - New hook
- `src/hooks/useHoldings.ts` - New hook
- `src/hooks/usePerformance.ts` - New hook
- `src/pages/Portfolio.tsx` - Wire up
- `src/components/trade/portfolio-summary/PortfolioSummary.tsx` - Wire up
- `src/data/mockPortfolio.ts` - Keep for fallback/testing

---

## Phase 3: Trading Integration ✅

**Priority: High** - Core trading functionality

### Tasks
- [x] 3.1 Add trading API methods to `hauntClient`
  - `getPositions()` - Open positions
  - `getOrders()` - Pending orders
  - `getTrades(limit)` - Trade history
  - `placeOrder(order)` - Execute trade
  - `cancelOrder(id)` - Cancel order
  - `closePosition(id)` - Close position
- [x] 3.2 Create `usePositions` hook with polling (WebSocket optional)
- [x] 3.3 Create `useOrders` hook with polling (WebSocket optional)
- [x] 3.4 Create `useTrades` hook
- [x] 3.5 placeOrder integrated into `useOrders` hook
- [x] 3.6 Wire `TradeSandbox.tsx` to real data
- [x] 3.7 Wire `PositionsTable` component (via types update)
- [x] 3.8 Wire `OrdersTable` component (via types update)
- [x] 3.9 Wire `TradeHistoryTable` component (via types update)
- [x] 3.10 Wire `OrderForm` to execute real trades
- [ ] 3.11 Add order confirmation modal
- [ ] 3.12 Add error handling for failed trades

### Files to Modify
- `src/services/haunt.ts` - Add API methods
- `src/hooks/usePositions.ts` - New hook
- `src/hooks/useOrders.ts` - New hook
- `src/hooks/useTrades.ts` - New hook
- `src/hooks/usePlaceOrder.ts` - New hook
- `src/pages/TradeSandbox.tsx` - Wire up
- `src/components/trade/positions/PositionsTable.tsx` - Wire up
- `src/components/trade/orders/OrdersTable.tsx` - Wire up
- `src/components/trade/trade-history/TradeHistoryTable.tsx` - Wire up
- `src/components/trade/order-form/OrderForm.tsx` - Wire up

---

## Phase 4: Search Integration

**Priority: Medium** - UX improvement

### Tasks
- [ ] 4.1 Add search component to Navbar
- [ ] 4.2 Create `useSearch` hook with debounce
- [ ] 4.3 Add search results dropdown
- [ ] 4.4 Navigate to asset detail on selection

### Files to Modify
- `src/components/ui/navbar/Navbar.tsx` - Add search
- `src/hooks/useSearch.ts` - New hook
- `src/components/ui/search/SearchDropdown.tsx` - New component

---

## Phase 5: Top Movers Integration

**Priority: Medium** - Dashboard enhancement

### Tasks
- [ ] 5.1 Create `useMovers` hook
- [ ] 5.2 Add movers widget to Dashboard
- [ ] 5.3 Real-time updates via WebSocket

### Files to Modify
- `src/hooks/useMovers.ts` - New hook
- `src/components/market/movers/MoversWidget.tsx` - New component
- `src/pages/Dashboard.tsx` - Add widget

---

## Phase 6: Error Handling & Offline Support

**Priority: Medium** - Production readiness

### Tasks
- [ ] 6.1 Add global error boundary
- [ ] 6.2 Add toast notifications for API errors
- [ ] 6.3 Add offline detection
- [ ] 6.4 Cache critical data in localStorage
- [ ] 6.5 Add retry logic to API calls
- [ ] 6.6 Add loading skeletons everywhere

---

## Implementation Notes

### API Client Pattern
```typescript
// In haunt.ts - add new method
async getExchangeDominance(symbol: string): Promise<ApiResponse<ExchangeDominance>> {
  return this.fetch(`/api/market/exchange-dominance/${symbol.toLowerCase()}`);
}
```

### Hook Pattern
```typescript
// New hook pattern with loading/error states
export function useExchangeDominance(symbol: string | undefined) {
  const [data, setData] = useState<ExchangeDominance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    hauntClient.getExchangeDominance(symbol)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  return { data, loading, error };
}
```

### WebSocket Integration Pattern
```typescript
// For real-time updates, use useHauntSocket
const { onPriceUpdate } = useHauntSocket();

useEffect(() => {
  return onPriceUpdate((update) => {
    if (update.symbol === symbol) {
      // Update local state
    }
  });
}, [symbol, onPriceUpdate]);
```

---

## Testing Checklist

After each phase:
- [ ] Verify data loads correctly
- [ ] Verify loading states show
- [ ] Verify error states handle gracefully
- [ ] Verify real-time updates work
- [ ] Verify mobile responsive
- [ ] Run `npm run build` - no errors
- [ ] Manual testing in browser
