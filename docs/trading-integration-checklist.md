# Trading Integration Checklist

Comprehensive checklist for wiring Wraith frontend to Haunt trading API.

> **Status**: In Progress
> **Last Updated**: 2026-02-04

---

## Quick Reference

| Phase | Status | Priority |
|-------|--------|----------|
| 1. Leaderboard | ✅ Done | High |
| 2. Portfolio Real-time | ✅ Done | High |
| 3. Order Management | ✅ Done | High |
| 4. Trade Confirmations | ✅ Done | High |
| 5. Alerts & Notifications | ✅ Done | Medium |
| 6. Search | ✅ Done | Medium |
| 7. Top Movers | ✅ Done | Medium |
| 8. Error Handling | ✅ Done | Medium |

---

## Phase 1: Leaderboard Integration ✅

**Status**: Complete

### Completed Tasks
- [x] 1.1 Add leaderboard types to `haunt.ts`
  - `LeaderboardTimeframe`
  - `LeaderboardEntry`
  - `LeaderboardResponse`
- [x] 1.2 Add API methods to `hauntClient`
  - `getLeaderboard(timeframe, limit)`
  - `getTraderStats(traderId)`
  - `getMyRank(sessionToken)`
- [x] 1.3 Create `useLeaderboard` hook
- [x] 1.4 Create `Leaderboard.tsx` page
- [x] 1.5 Add route `/leaderboard`
- [x] 1.6 Add navbar navigation link
- [x] 1.7 Add translations (en, ko)

### Files Modified
- `src/services/haunt.ts`
- `src/hooks/useLeaderboard.ts` (new)
- `src/pages/Leaderboard.tsx` (new)
- `src/main.tsx`
- `src/components/ui/navbar/Navbar.tsx`
- `src/i18n/locales/en/navigation.json`
- `src/i18n/locales/ko/navigation.json`

---

## Phase 2: Portfolio Real-time Updates ✅

**Status**: Complete
**Priority**: High

### Completed Tasks
- [x] 2.1 Add WebSocket subscription for portfolio updates
  - Added `portfolio_update`, `position_update`, `order_update`, `alert_triggered` message types
  - Added `subscribePortfolio()` / `unsubscribePortfolio()` methods
- [x] 2.2 Update `useHauntSocket` hook
  - Added `onPortfolioUpdate`, `onPositionUpdate`, `onOrderUpdate`, `onAlertTriggered` callbacks
  - Added `useTradingSubscription()` helper hook
- [x] 2.3 Update `usePositions` hook for WebSocket
  - Real-time position P&L updates via `onPositionUpdate`
  - Position opened/closed/liquidated events handled
  - Returns `lastPositionUpdate` for UI feedback
- [x] 2.4 Update `useOrders` hook for WebSocket
  - Order created/filled/cancelled/rejected events
  - Partial fill updates
  - Returns `lastOrderUpdate` for UI feedback

### Files to Modify
- `src/hooks/useHauntSocket.tsx` - Add portfolio message types
- `src/hooks/usePortfolio.ts` - Add WebSocket integration
- `src/hooks/usePositions.ts` - Add WebSocket integration
- `src/hooks/useOrders.ts` - Add WebSocket integration
- `src/pages/Portfolio.tsx` - Add connection status
- `src/pages/TradeSandbox.tsx` - Add connection status

### API Requirements
```typescript
// WebSocket message types
{ type: "subscribe_portfolio" }
{ type: "portfolio_update", data: PortfolioUpdate }
{ type: "position_update", data: PositionUpdate }
{ type: "order_update", data: OrderUpdate }
```

---

## Phase 3: Order Management Enhancements ✅

**Status**: Complete
**Priority**: High

### Completed Tasks
- [x] 3.1 Add order modification API methods to `haunt.ts`
  - `modifyOrder(token, orderId, changes)` - Update price/quantity
  - `cancelAllOrders(token, symbol?)` - Cancel all pending (optionally by symbol)
- [x] 3.2 Update `useOrders` hook with new methods
  - `modifyOrder()` function
  - `cancelAllOrders()` function
- [x] 3.3 Add batch order controls to `OrdersTable`
  - "Cancel All" button shown when pending orders exist
  - Pending order count display

### Remaining (Lower Priority)
- [ ] 3.4 Add order modification modal (edit price/quantity)
- [ ] 3.5 Add order duplication feature

### Files to Modify
- `src/services/haunt.ts` - Add modify/cancel methods
- `src/hooks/useOrderManagement.ts` (new)
- `src/components/trade/orders/OrdersTable.tsx` - Add actions
- `src/components/trade/orders/OrderModifyModal.tsx` (new)
- `src/pages/TradeSandbox.tsx` - Wire up modals

### API Requirements
```typescript
// New endpoints
PUT /api/orders/:id - Modify order
DELETE /api/orders - Cancel all orders
DELETE /api/orders?symbol=:symbol - Cancel by symbol
```

---

## Phase 4: Trade Confirmations & Receipts ✅

**Status**: Complete
**Priority**: High

### Completed Tasks
- [x] 4.1 Create `OrderConfirmModal`
  - Shows order details before submission
  - Estimated fees display
  - Confirm/Cancel buttons
  - "Don't show again" checkbox (per-session)
- [x] 4.2 Create `TradeReceiptModal`
  - Shows completed trade details
  - Execution price, slippage, fees
  - P&L display for position closes
  - Order ID reference
- [x] 4.3 Create `ClosePositionModal`
  - Shows position P&L before closing
  - Position details summary
  - Confirm close action
- [x] 4.4 Wire modals into `TradeSandbox`
  - Order confirmation before placing
  - Trade receipt on order fill (via WebSocket)
  - Position close confirmation

### Files Created
- `src/components/trade/modals/OrderConfirmModal.tsx`
- `src/components/trade/modals/TradeReceiptModal.tsx`
- `src/components/trade/modals/ClosePositionModal.tsx`
- `src/components/trade/modals/index.ts`

### Remaining (Lower Priority)
- [ ] 4.5 Add confirmation preference to Settings
- [ ] 4.6 Add trade sound effects (optional)

---

## Phase 5: Alerts & Notifications ✅

**Status**: Complete
**Priority**: Medium

### Completed Tasks
- [x] 5.1 Add price alert API methods to `haunt.ts`
  - `getAlerts(token)` - Get all user alerts
  - `createAlert(token, request)` - Create new price alert
  - `deleteAlert(token, alertId)` - Delete an alert
- [x] 5.2 Create `useAlerts` hook
- [x] 5.3 Create price alert modal
  - Symbol selector
  - Condition (above/below)
  - Target price input
  - Notification preference
- [x] 5.4 Add alerts panel in TradeSandbox
  - List active alerts
  - Delete/edit actions
- [x] 5.5 Add toast notifications
  - Price alert triggered
  - Order filled
  - Position liquidation warning
- [ ] 5.6 Add browser notifications (optional)
  - Request permission
  - Send on alert trigger

### Files Created
- `src/hooks/useAlerts.ts`
- `src/components/trade/alerts/AlertsPanel.tsx`
- `src/components/trade/alerts/CreateAlertModal.tsx`
- `src/components/ui/toast/Toast.tsx`
- `src/components/ui/toast/ToastContainer.tsx`
- `src/context/ToastContext.tsx`

### API Requirements
```typescript
// New endpoints
GET /api/alerts - Get user alerts
POST /api/alerts - Create alert
DELETE /api/alerts/:id - Delete alert
// WebSocket
{ type: "alert_triggered", data: AlertTriggered }
```

---

## Phase 6: Search Integration ✅

**Status**: Complete
**Priority**: Medium

### Completed Tasks
- [x] 6.1 Add search component to Navbar
  - Search input with icon
  - Keyboard shortcut (Cmd/Ctrl + K)
- [x] 6.2 Create `useSearch` hook
  - Debounced API calls
  - Recent searches storage
  - Search history
- [x] 6.3 Create search dropdown
  - Asset results with icons
  - Price and change display
  - Keyboard navigation
- [x] 6.4 Add recent searches
  - Store in localStorage
  - Clear history option
- [ ] 6.5 Add search analytics (optional)
  - Track popular searches
  - Trending assets

### Files Created
- `src/hooks/useSearch.ts`
- `src/components/ui/search/SearchInput.tsx`
- `src/components/ui/search/index.ts`

### Files Modified
- `src/components/ui/navbar/Navbar.tsx` - Add search

### API Requirements
```typescript
// Existing endpoint
GET /api/crypto/search?q=:query&limit=:limit
```

---

## Phase 7: Top Movers Integration ✅

**Status**: Complete
**Priority**: Medium

### Completed Tasks
- [x] 7.1 Create `useMovers` hook
  - Fetch top gainers/losers
  - Timeframe selection
  - Auto-refresh
- [x] 7.2 Create MoversWidget component
  - Tabbed gainers/losers view
  - Mini price charts
  - Click to navigate
- [ ] 7.3 Add to Dashboard
  - Position in layout
  - Responsive behavior
- [ ] 7.4 Add WebSocket updates
  - Real-time mover changes
  - Animation on rank change

### Files Created
- `src/hooks/useMovers.ts`
- `src/components/market/movers/MoversWidget.tsx`
- `src/components/market/movers/index.ts`

### Files Modified
- `src/components/market/index.ts` - Export MoversWidget

### API Requirements
```typescript
// Existing endpoint
GET /api/market/movers?timeframe=:tf&limit=:limit
```

---

## Phase 8: Error Handling & Recovery ✅

**Status**: Complete
**Priority**: Medium

### Completed Tasks
- [x] 8.1 Add global error boundary
  - Catch React errors
  - Show recovery UI
  - Report to analytics
- [x] 8.2 Add API error handling
  - Retry logic with backoff
  - Rate limit handling
  - Session expiry handling
- [x] 8.3 Add offline detection
  - Show offline banner
  - Queue actions for retry
  - Sync on reconnect
- [x] 8.4 Add toast notifications for errors (via ToastContext)
  - Network errors
  - API errors
  - Trade failures
- [ ] 8.5 Add loading skeletons everywhere
  - Audit all components
  - Add missing skeletons
- [ ] 8.6 Add connection recovery
  - Auto-reconnect WebSocket
  - Re-subscribe on reconnect
  - Show reconnecting state

### Files Created
- `src/components/error/ErrorBoundary.tsx`
- `src/components/error/ErrorFallback.tsx`
- `src/components/error/index.ts`
- `src/components/ui/offline-banner/OfflineBanner.tsx`
- `src/utils/retry.ts`

### Files Modified
- `src/main.tsx` - Add error boundary and offline banner

---

## Testing Checklist

After each phase completion:

- [x] Manual testing in browser
- [x] Mobile responsive testing
- [x] Loading states visible
- [x] Error states handled
- [x] Real-time updates working
- [x] `npm run build` passes
- [x] No console errors/warnings

---

## Mock Data Handling ✅

**Status**: Fixed (2026-02-04)

### Issue
Authenticated users with no positions/orders saw mock data instead of empty states.
The logic `apiPositions.length > 0` meant empty API responses triggered mock data fallback.

### Fix Applied
Changed data selection logic in both pages:
- **Authenticated users**: ALWAYS see real API data (even if empty) - show empty states
- **Unauthenticated users (demo mode)**: See mock data for demonstration

### Files Modified
- `src/pages/TradeSandbox.tsx`
  - Changed from `usingRealPositions = isAuthenticated && apiPositions.length > 0`
  - To `usingRealData = isAuthenticated` (always use real data when authenticated)
- `src/pages/Portfolio.tsx`
  - Added `usingRealData` check for all data sources
  - Added empty state UI for holdings

### E2E Tests Created
- `e2e/mock-data-handling.spec.ts`
  - Tests authenticated users see empty states with no data
  - Tests unauthenticated users see demo data
  - Tests API endpoint structures

---

## API Endpoints Summary

### Existing (Wired)
| Endpoint | Hook/Component |
|----------|---------------|
| GET /api/trading/leaderboard | useLeaderboard |
| GET /api/trading/leaderboard/me | useLeaderboard |
| GET /api/trading/portfolios | usePortfolio |
| GET /api/trading/portfolios/:id/holdings | useHoldings |
| GET /api/trading/portfolios/:id/performance | usePerformance |
| GET /api/trading/positions | usePositions |
| GET /api/trading/orders | useOrders |
| GET /api/trading/trades | useTrades |
| POST /api/trading/orders | useOrders.placeOrder |
| DELETE /api/trading/orders/:id | useOrders.cancelOrder |
| DELETE /api/trading/positions/:id | usePositions.closePosition |

### API Methods Ready (In haunt.ts)
| Endpoint | Method | Status |
|----------|--------|--------|
| PUT /api/trading/orders/:id | modifyOrder | ✅ Ready |
| DELETE /api/trading/orders | cancelAllOrders | ✅ Ready |
| GET /api/alerts | getAlerts | ✅ Ready |
| POST /api/alerts | createAlert | ✅ Ready |
| DELETE /api/alerts/:id | deleteAlert | ✅ Ready |
| GET /api/account/summary | getAccountSummary | ✅ Ready |
| GET /api/account/transactions | getTransactions | ✅ Ready |
| GET /api/account/stats | getTradingStats | ✅ Ready |
| GET /api/market/funding | getFundingRates | ✅ Ready |
| GET /api/market/funding/:symbol/history | getFundingHistory | ✅ Ready |
| GET /api/trades (extended) | getTradeHistory | ✅ Ready |

### Hooks Created
| Hook | Phase | Uses |
|------|-------|------|
| useAlerts | Phase 5 | getAlerts, createAlert, deleteAlert |
| useSearch | Phase 6 | search |
| useMovers | Phase 7 | getMovers |
| useAccountSummary | Future | getAccountSummary |
| useTradingStats | Future | getTradingStats |
| useFundingRates | Future | getFundingRates |

### WebSocket Subscriptions Needed
| Message Type | Phase |
|--------------|-------|
| portfolio_update | Phase 2 ✅ |
| position_update | Phase 2 ✅ |
| order_update | Phase 2 ✅ |
| alert_triggered | Phase 5 ✅ |
| movers_update | Phase 7 (optional) |

---

## New Types Added to haunt.ts

These types are ready for future phases:

### Alert Types
```typescript
AlertCondition = "above" | "below" | "crosses"
Alert = { id, symbol, condition, targetPrice, triggered, ... }
CreateAlertRequest = { symbol, condition, targetPrice, ... }
```

### Account Types
```typescript
AccountSummary = { balance, equity, marginUsed, marginLevel, liquidationRisk, ... }
Transaction = { id, type, amount, balance, status, ... }
TransactionHistoryParams = { type?, status?, startTime?, endTime?, limit? }
```

### Trading Stats Types
```typescript
TradingStats = { totalTrades, winRate, profitFactor, sharpeRatio, maxDrawdown, ... }
TradingStatsTimeframe = "today" | "week" | "month" | "year" | "all"
```

### Funding Rate Types
```typescript
FundingRate = { symbol, rate, nextFundingTime, predictedRate?, interval }
FundingHistory = { symbol, rate, timestamp, payment? }
```

### Trade History Filter
```typescript
TradeHistoryParams = { symbol?, side?, startTime?, endTime?, limit?, offset? }
```

---

## Notes

- Phases can be worked in parallel where no dependencies exist
- Phase 2 (real-time) depends on WebSocket server support
- Phase 4 (confirmations) is purely frontend, no API needed
- Phase 8 should be done incrementally alongside other phases
- All new types and API methods added 2026-02-04 for future phases
- API endpoints updated to use `/api/trading/` prefix on 2026-02-04
