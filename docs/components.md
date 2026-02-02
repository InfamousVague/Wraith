# Wraith Components Guide

This document describes the key components in the Wraith frontend application.

## Core Components

### AssetList

The main cryptocurrency table displaying prices, changes, and sparklines.

**Location:** `src/components/AssetList.tsx`

**Features:**
- Paginated list of crypto assets
- Real-time price updates via WebSocket
- Trade direction indicators (buy/sell tags)
- Sparkline charts for 24h price movement
- Sortable columns

**Usage:**
```tsx
import { AssetList } from '@/components/AssetList';

<AssetList
  assets={cryptoData}
  onAssetPress={(asset) => navigate(`/asset/${asset.id}`)}
  loading={isLoading}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `assets` | `Asset[]` | Array of crypto assets to display |
| `onAssetPress` | `(asset: Asset) => void` | Callback when asset row is pressed |
| `loading` | `boolean` | Show loading skeleton |

---

### AdvancedChart

Interactive chart component with candlestick, line, and area modes.

**Location:** `src/components/AdvancedChart.tsx`

**Features:**
- Multiple chart types (candlestick, line, area)
- Time range selection (1h, 4h, 1d, 1w, 1m)
- Real-time price updates
- Loading states with HeartbeatChart
- Seeding progress indicator

**Usage:**
```tsx
import { AdvancedChart } from '@/components/AdvancedChart';

<AdvancedChart
  symbol="btc"
  assetId={1}
  initialRange="1d"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `symbol` | `string` | Asset symbol (lowercase) |
| `assetId` | `number` | Asset ID for API calls |
| `initialRange` | `string` | Initial time range |

**Loading States:**
1. **Initial fetch** - Shows HeartbeatChart with "Loading chart data..."
2. **Seeding** - Shows HeartbeatChart with "Building chart data..." and progress
3. **Updating** - Shows subtle loading indicator while fetching new range

---

### HeartbeatChart

Animated ECG-style loading indicator for chart states.

**Location:** `src/components/HeartbeatChart.tsx`

**Features:**
- Smooth SVG animation
- Configurable colors and duration
- Optional banner text overlay
- Pulsing glow effect

**Usage:**
```tsx
import { HeartbeatChart } from '@/components/HeartbeatChart';

<HeartbeatChart
  width={800}
  height={400}
  bannerText="Loading chart data..."
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `600` | Chart width in pixels |
| `height` | `number` | `300` | Chart height in pixels |
| `color` | `string` | `#00D9FF` | Line color |
| `bannerText` | `string` | - | Optional overlay text |
| `animationDuration` | `number` | `2000` | Animation cycle in ms |

---

### Navbar

Top navigation bar with search and theme toggle.

**Location:** `src/components/Navbar.tsx`

**Features:**
- Search input with icon
- Theme toggle (light/dark)
- Responsive layout

**Usage:**
```tsx
import { Navbar } from '@/components/Navbar';

<Navbar
  onSearch={(query) => handleSearch(query)}
  onThemeToggle={() => toggleTheme()}
/>
```

---

### AssetHeader

Header component for asset detail pages.

**Location:** `src/components/AssetHeader.tsx`

**Features:**
- Back navigation button
- Asset name and symbol
- Current price with change indicator
- Asset logo

**Usage:**
```tsx
import { AssetHeader } from '@/components/AssetHeader';

<AssetHeader
  asset={assetData}
  onBack={() => navigate(-1)}
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `asset` | `Asset` | Asset data object |
| `onBack` | `() => void` | Back button callback |

---

### ChartGrid

Grid layout for multiple mini charts on dashboard.

**Location:** `src/components/ChartGrid.tsx`

**Features:**
- Responsive grid layout
- Mini chart previews
- Quick navigation to detail view

**Usage:**
```tsx
import { ChartGrid } from '@/components/ChartGrid';

<ChartGrid
  assets={topAssets}
  onAssetSelect={(asset) => navigate(`/asset/${asset.id}`)}
/>
```

---

### MiniChart

Compact chart for use in lists and grids.

**Location:** `src/components/MiniChart.tsx`

**Features:**
- Sparkline visualization
- Positive/negative color coding
- Compact size for tables

**Usage:**
```tsx
import { MiniChart } from '@/components/MiniChart';

<MiniChart
  data={sparklineData}
  width={100}
  height={30}
  positive={change24h > 0}
/>
```

---

### MetricsGrid

Grid display for market metrics.

**Location:** `src/components/MetricsGrid.tsx`

**Features:**
- Market cap display
- 24h volume
- BTC dominance
- Total market metrics

**Usage:**
```tsx
import { MetricsGrid } from '@/components/MetricsGrid';

<MetricsGrid
  marketCap={totalMarketCap}
  volume24h={totalVolume}
  btcDominance={45.5}
/>
```

---

### Toolbar

Chart toolbar for type and range selection.

**Location:** `src/components/Toolbar.tsx`

**Features:**
- Chart type selector (candlestick, line, area)
- Time range buttons
- Fullscreen toggle

**Usage:**
```tsx
import { Toolbar } from '@/components/Toolbar';

<Toolbar
  chartType={chartType}
  range={range}
  onChartTypeChange={setChartType}
  onRangeChange={setRange}
/>
```

---

## Ghost Design System Components

Wraith uses the Ghost design system for UI primitives. Key components:

### Tag (Trade Indicator)

Used for buy/sell indicators in asset lists.

```tsx
import { Tag } from '@ghost/components';
import { Size } from '@ghost/enums';

<Tag
  direction="up"
  label="BUY"
  size={Size.TwoXSmall}
/>
```

### Button

Used for navigation and actions.

```tsx
import { Button } from '@ghost/components';
import { Appearance } from '@ghost/enums';

<Button
  iconLeft="arrow-left"
  appearance={Appearance.Ghost}
  onPress={handleBack}
/>
```

### Input

Used for search and form inputs.

```tsx
import { Input } from '@ghost/components';

<Input
  leadingIcon="search"
  placeholder="Search assets..."
  value={searchQuery}
  onChangeText={setSearchQuery}
/>
```

### Text

Typography component with semantic variants.

```tsx
import { Text } from '@ghost/components';
import { Size, TextAppearance } from '@ghost/enums';

<Text size={Size.Large} appearance={TextAppearance.Primary}>
  Bitcoin
</Text>
```

### Currency

Formatted currency display.

```tsx
import { Currency } from '@ghost/components';

<Currency value={50000} currency="USD" />
```

### PercentChange

Formatted percentage with color coding.

```tsx
import { PercentChange } from '@ghost/components';

<PercentChange value={2.5} /> // Shows "+2.50%" in green
```

---

## Component Patterns

### Loading States

All data-fetching components should handle loading states:

```tsx
if (isLoading) {
  return <Skeleton width="100%" height={200} />;
}

if (isChartLoading) {
  return <HeartbeatChart bannerText="Loading..." />;
}
```

### Error States

Handle errors gracefully:

```tsx
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" color={Colors.danger} />
      <Text appearance={TextAppearance.Secondary}>
        Failed to load data. Please try again.
      </Text>
      <Button onPress={refetch}>Retry</Button>
    </View>
  );
}
```

### Real-Time Updates

Use the `useHauntSocket` hook for real-time data:

```tsx
const { subscribe, unsubscribe, lastMessage } = useHauntSocket();

useEffect(() => {
  subscribe(['btc', 'eth']);
  return () => unsubscribe(['btc', 'eth']);
}, []);

useEffect(() => {
  if (lastMessage?.type === 'price_update') {
    updatePrice(lastMessage.data);
  }
}, [lastMessage]);
```

---

## Styling Guidelines

### Use Ghost Tokens

Always use design tokens for consistency:

```tsx
import { Colors, Spacing, Typography } from '@ghost/tokens';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.medium,
    backgroundColor: Colors.surface,
  },
  title: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
});
```

### Responsive Design

Use percentage widths and flex layouts:

```tsx
const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%', // 2 columns
    padding: Spacing.small,
  },
});
```

### Dark Mode Support

Colors automatically adapt to theme:

```tsx
// Colors.surface is #FFFFFF in light mode, #1A1A1A in dark mode
backgroundColor: Colors.surface
```
