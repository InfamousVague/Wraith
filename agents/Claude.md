# Wraith Testing & Validation Guide

This document provides comprehensive testing instructions for Claude agents to validate features in the Wraith trading application.

## Prerequisites

### Required Services

1. **Haunt Backend** (Rust) - Port 3001
   ```bash
   cd ../Haunt
   cargo run
   ```

2. **Wraith Frontend** (React/Vite) - Port 5173
   ```bash
   cd ../Wraith
   npm run dev
   ```

### Health Checks

Verify services are running:
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend (check dev server)
curl -s http://localhost:5173 | head -20
```

---

## E2E Testing Framework

### Running Tests

```bash
# All E2E tests (headless)
npm run test:e2e

# Specific test file
npm run test:e2e -- e2e/trade-sandbox.spec.ts

# With browser visible (for debugging)
npm run test:e2e:headed

# Filter by test name
npm run test:e2e -- --grep "Drawdown"
npm run test:e2e -- --grep "TradeSandbox"

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### Test File Locations

| File | Purpose |
|------|---------|
| `e2e/trade-sandbox.spec.ts` | Trading functionality tests |
| `e2e/drawdown-protection.spec.ts` | Drawdown protection modal tests |
| `e2e/fixtures/trade.fixtures.ts` | Authentication & navigation helpers |
| `e2e/fixtures/trade.data.ts` | Test constants (timeouts, sizes) |

---

## Feature Validation Checklists

### Drawdown Protection System

The drawdown protection system prevents excessive losses by stopping trading when the portfolio value drops below a threshold.

#### Components to Validate

1. **DrawdownWarningModal** (`src/components/trade/DrawdownWarningModal.tsx`)
   - Appears when order fails with `PORTFOLIO_STOPPED` error code
   - Shows current drawdown percentage and limit
   - Provides buttons: Bypass for This Trade, Reset Portfolio, Adjust Settings, Cancel

2. **DrawdownWarningBanner** (in `src/pages/TradeSandbox.tsx`)
   - Shows when approaching drawdown limit (within warning threshold)
   - Shows when at limit (trading stopped)
   - Displays progress bar and percentages

3. **useTradingSettings Hook** (`src/hooks/useTradingSettings.ts`)
   - Loads settings from localStorage
   - Calculates `currentDrawdownPercent`, `isApproachingLimit`, `isAtLimit`
   - Returns settings for drawdown protection configuration

#### Validation Steps

##### Manual Testing

1. **Trigger Drawdown State**:
   - Place losing trades until portfolio value drops below (100% - maxDrawdownPercent)
   - Or use backend API to set portfolio to stopped state

2. **Verify Modal Appears**:
   - Try to place an order
   - Modal should appear with "Drawdown Protection Triggered" title
   - Should show current drawdown % and configured limit

3. **Test Modal Actions**:
   - **Bypass for This Trade**: Order should proceed with `bypassDrawdown: true`
   - **Reset Portfolio**: Portfolio resets to starting balance, trading resumes
   - **Adjust Settings**: Navigates to /settings page
   - **Cancel**: Closes modal, order cancelled

4. **Verify Banner Display**:
   - When approaching limit: Yellow warning banner above order form
   - When at limit: Red critical banner with "Trading Stopped" message

##### E2E Tests

Run the drawdown-specific tests:
```bash
npm run test:e2e -- --grep "Drawdown"
```

Expected tests:
- `should show drawdown modal when order fails with PORTFOLIO_STOPPED error`
- `should display correct drawdown information in modal`
- `should allow bypass for single trade when enabled`
- `should navigate to settings when clicking Adjust Settings`
- `should reset portfolio when clicking Reset Portfolio`
- `should close modal when clicking Cancel`
- `should show warning banner when approaching drawdown limit`

#### Debugging Drawdown Issues

1. **Check Browser Console**:
   Look for logs starting with `[TradeSandbox]`:
   ```
   [TradeSandbox] HauntApiError - message: Portfolio is stopped due to drawdown code: PORTFOLIO_STOPPED
   [TradeSandbox] isDrawdownError: true (code: PORTFOLIO_STOPPED)
   [TradeSandbox] *** DRAWDOWN ERROR DETECTED - SHOWING MODAL ***
   ```

2. **Check Network Tab**:
   - POST to `/api/trading/orders`
   - Response should have: `{"error":"Portfolio is stopped due to drawdown","code":"PORTFOLIO_STOPPED"}`

3. **Check State**:
   ```javascript
   // In browser console
   localStorage.getItem('wraith_trading_settings')
   ```

4. **Common Issues**:
   - Modal not showing: Check error handling extracts `code` from HauntApiError
   - Banner not showing: Verify `useTradingSettings` returns correct `isApproachingLimit`/`isAtLimit`
   - Bypass not working: Check `bypassDrawdown` flag passed in PlaceOrderRequest

---

### Trade Execution System

#### Components to Validate

1. **OrderForm** (`src/components/trade/order-form/`)
2. **OrderConfirmModal** (`src/components/trade/OrderConfirmModal.tsx`)
3. **PositionsTable** (`src/components/trade/PositionsTable.tsx`)
4. **OrdersTable** (`src/components/trade/OrdersTable.tsx`)

#### Validation Steps

##### Order Placement

1. Navigate to `/trade/btc`
2. Enter order details (size, leverage)
3. Click Buy/Sell
4. Verify confirmation modal shows correct details
5. Click Confirm
6. Verify:
   - Success toast appears
   - Position appears in Positions tab (for market orders)
   - Order appears in Orders tab (for limit orders)

##### Position Management

1. **Close Position**: Click close button, verify modal, confirm
2. **Modify Position**: Click edit, add/modify SL/TP, save
3. **Verify P&L**: Check unrealized P&L updates with price changes

##### E2E Tests

```bash
npm run test:e2e -- --grep "TradeSandbox"
```

---

### Portfolio Page

#### Components to Validate

1. **PortfolioSummary** - Account value, P&L, margin info
2. **PositionsTable** - Open positions list
3. **Trade History** - Recent trades

#### Validation Steps

1. Navigate to `/portfolio`
2. Verify balance displays correctly
3. Verify positions match TradeSandbox positions
4. Verify P&L calculations are correct

---

## Code Review Checklist

When reviewing trading-related code changes:

### Error Handling

- [ ] Uses `HauntApiError` for API errors with code preservation
- [ ] Checks error code (not just message) for specific error types
- [ ] Shows appropriate user feedback (toast/modal)
- [ ] Cleans up state on error (loading states reset)

### API Integration

- [ ] Correct endpoint and method
- [ ] Proper request body format (camelCase for Haunt)
- [ ] Auth token included in headers
- [ ] Response data properly typed

### UI/UX

- [ ] Loading states shown during async operations
- [ ] Disabled states applied when appropriate
- [ ] Error messages are user-friendly
- [ ] Modal transitions are smooth

### Testing

- [ ] Unit tests for hooks/utilities
- [ ] E2E tests for user flows
- [ ] Edge cases covered (auth, errors, empty states)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Modal not appearing | Error code not extracted | Check HauntApiError class and error handling |
| 403 errors | Session expired | Re-authenticate (logout/login) |
| No portfolio data | Portfolio not created | Create portfolio via API or UI |
| WebSocket disconnects | Server restart | Refresh page to reconnect |

### Debug Commands

```bash
# Check backend logs
cd ../Haunt && cargo run 2>&1 | grep -i error

# Check frontend console
# Open DevTools > Console, filter for [TradeSandbox] or [useOrders]

# Reset local storage
# In browser console:
localStorage.clear()
location.reload()
```

---

## Adding New Tests

### E2E Test Template

```typescript
import { test, expect, Page } from "@playwright/test";
import { createAccountAndAuthenticate, navigateToTradeSandbox } from "./fixtures/trade.fixtures";
import { TIMEOUTS } from "./fixtures/trade.data";

test.describe("Feature Name", () => {
  test.setTimeout(60000);

  test("should do something specific", async ({ page }) => {
    // Setup
    await createAccountAndAuthenticate(page);
    await navigateToTradeSandbox(page);
    await page.waitForTimeout(TIMEOUTS.pageLoad);

    // Action
    // ... interact with page ...

    // Assertion
    expect(/* condition */).toBe(/* expected */);

    // Screenshot for debugging
    await page.screenshot({ path: "e2e/screenshots/test-name.png" });
  });
});
```

### Screenshot Location

All test screenshots go to `e2e/screenshots/`. This directory should be gitignored.

---

---

## Known Issues & Investigation Checklist

### Drawdown Data Not Flowing

**Symptom**: Drawdown modal shows `-0.0%` instead of actual drawdown value.

**Root Cause**: The `useTradingSettings` hook has a `setCurrentDrawdown` function that needs to be called with portfolio data. This was missing in TradeSandbox.

**Fix Applied**: Added useEffect in TradeSandbox.tsx to calculate drawdown from `apiPortfolio.startingBalance` and `apiPortfolio.totalValue`.

**Verification**:
1. Open browser console
2. Navigate to `/trade-sandbox`
3. Look for log: `[TradeSandbox] Drawdown calculated: X.XX% (starting: 100000 current: XXXXX)`
4. If `starting` and `current` are both valid numbers, drawdown should display correctly
5. If values are 0 or undefined, check if portfolio data is being fetched

### Portfolio P&L Not Calculating

**Symptom**: P&L shows $0 or incorrect values on Portfolio page.

**Investigation Steps**:
1. Check browser console for `[usePortfolio]` logs
2. Verify portfolio data contains `realizedPnl` and `unrealizedPnl` fields
3. Check backend API response: `GET /api/trading/portfolios?user_id=<publicKey>`

**Backend Fields Required**:
```json
{
  "startingBalance": 100000,
  "totalValue": 95000,
  "realizedPnl": -3000,
  "unrealizedPnl": -2000,
  "cashBalance": 95000,
  "marginUsed": 0,
  "marginAvailable": 95000
}
```

**If P&L is 0**:
- Backend may not be tracking trades properly
- Check if trades exist: `GET /api/trading/trades?portfolio_id=<id>`
- Check if positions exist: `GET /api/trading/positions?portfolio_id=<id>`

### ProgressBar Prop Mismatch

**Symptom**: CSS error "Failed to set indexed property [0] on 'CSSStyleDeclaration'"

**Root Cause**: Ghost's `ProgressBar` component expects `value` and `max` props, not `progress`.

**Fix Applied**: Changed `progress={value}` to `value={value * 100} max={100}`

### Invalid Icon Names

**Symptom**: CSS/rendering errors when showing icons

**Root Cause**: Used `alert-octagon` and `alert-triangle` which don't exist in Ghost.

**Valid Icon Names** (from Ghost):
- `warning` - Warning triangle
- `error` - Error/stop icon
- `info` - Information circle
- `success` - Checkmark
- `lock` / `unlock` - Lock icons
- `settings` - Gear icon

### Ghost Card Style Array Issue

**Symptom**: CSS error "Failed to set indexed property [0] on 'CSSStyleDeclaration'" when Card component renders

**Root Cause**: Ghost's `Card` component doesn't handle style arrays properly in react-native-web. Passing `style={[styles.a, styles.b]}` causes the error.

**Fix Applied**: Merge styles into a single object instead of using arrays:
```typescript
// BAD - causes CSS error
<Card style={isCritical ? [styles.modal, styles.modalCritical] : styles.modal}>

// GOOD - merge styles into single object
const modalStyle = isCritical
  ? { ...styles.modal, ...styles.modalCritical }
  : styles.modal;
<Card style={modalStyle}>
```

**Affected Files**:
- `src/components/trade/modals/DrawdownWarningModal.tsx` - Card style
- `src/pages/TradeSandbox.tsx` - DrawdownWarningBanner Card style

**Pattern for Ghost Components**: Always merge styles into a single object when passing to Ghost components (Card, Button, etc.). React Native View components handle style arrays fine, but Ghost components may not.

---

## Backend API Validation Checklist

When testing trading features, verify these API responses:

### Portfolio Data
```bash
# Get portfolio
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/trading/portfolios?user_id=$PUBLIC_KEY"

# Expected fields:
# - startingBalance (should be 100000 for new portfolios)
# - totalValue (current portfolio value)
# - realizedPnl (closed trade P&L)
# - unrealizedPnl (open position P&L)
# - cashBalance
# - marginUsed / marginAvailable
```

### Portfolio Stopped State
```bash
# Place order when stopped
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"...","symbol":"BTC",...}' \
  "http://localhost:3001/api/trading/orders"

# Expected error response:
# {"error":"Portfolio is stopped due to drawdown","code":"PORTFOLIO_STOPPED"}
```

### Reset Portfolio
```bash
# Reset portfolio
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/trading/portfolios/$PORTFOLIO_ID/reset"

# Should reset:
# - cashBalance back to startingBalance
# - Clear all positions
# - Clear stopped state
# - Reset P&L counters
```

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-02-04 | 1.1.0 | Added known issues, P&L investigation, backend validation |
| 2024-01-XX | 1.0.0 | Initial documentation |
