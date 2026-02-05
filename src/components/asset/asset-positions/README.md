# AssetPositions Component

Visual component for displaying open trading positions for a specific asset on the asset detail page.

## Features

- **Real-time Position Tracking**: Shows all open long/short positions for the current asset
- **Comprehensive Position Details**: 
  - Side badge (long/short) with direction icon
  - Leverage indicator with lightning icon
  - Entry price, current price, and liquidation price
  - Unrealized P&L in both dollars and percentage
  - Quantity held
  - Margin mode (isolated/cross)
  - Margin used
- **Visual Feedback**:
  - Color-coded badges for position side (green for long, red for short)
  - Color-coded P&L (green profit, red loss)
  - Warning banner when near liquidation price (within 10%)
- **Interactive**: Click on a position card to navigate to portfolio page with position details
- **Responsive**: Grid layout on desktop, stacked on mobile
- **Auth-Aware**: Only displays when user is authenticated
- **Smart Visibility**: Automatically hides section when no positions exist for the asset

## Usage

```tsx
import { AssetPositions } from "../components/asset";

// In your component:
<AssetPositions 
  symbol="BTC" 
  loading={isLoadingAssetData} 
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | `string` | Yes | Asset symbol to filter positions (e.g., "BTC", "ETH") |
| `loading` | `boolean` | No | Whether parent component is loading |

## Data Flow

1. Authenticates user via `useAuth` hook
2. Fetches active portfolio via `usePortfolio` hook
3. Loads all positions via `usePositions` hook
4. Filters positions by asset symbol (case-insensitive)
5. Subscribes to real-time WebSocket updates for position changes
6. Displays filtered positions in responsive grid layout

## Position Card Layout

Each position card displays:

### Header Row
- **Left**: Side badge (LONG/SHORT) with trending arrow icon
- **Right**: Leverage (e.g., "10x") with lightning bolt icon

### Stats Row
- **Left Column**: 
  - Label: "Quantity"
  - Value: Position quantity with appropriate decimals
- **Right Column**: 
  - Label: "Unrealized P&L"
  - Value: Dollar amount + percentage change

### Price Details Row
- **Entry**: Entry price
- **Current**: Current market price
- **Liq.** (if set): Liquidation price (red if within 10%)

### Margin Row
- **Left**: Margin used amount
- **Right**: Margin mode badge (Isolated/Cross)

### Warning Banner (Conditional)
- Only appears when liquidation price is within 10% of current price
- Warning icon + "Near liquidation price" message

## Integration

The component is integrated into the Asset Detail page (`AssetDetail.tsx`) and appears:
- Below the chart and key metrics panel
- Above the trading timeframe selector

This provides immediate visibility of your positions when viewing an asset you're actively trading.

## Dependencies

- `@wraith/ghost/components`: Card, Badge, Currency, PercentChange, Icon, Text, Skeleton
- `useAuth`: Authentication context
- `usePortfolio`: Active portfolio data
- `usePositions`: Position data with real-time updates
- `useBreakpoint`: Responsive layout handling

## Error Handling

- Handles authentication (hides if not authenticated)
- Displays error state if position fetch fails
- Shows loading skeletons during data fetch
- Gracefully handles missing or null data

## Future Enhancements

Potential improvements:
- Quick actions (close position, modify stop-loss/take-profit)
- Position performance chart (mini timeline)
- Risk metrics (distance to liquidation as gauge)
- Group multiple positions with same direction
- Export position details
