/**
 * @file Dashboard.tsx
 * @description Main dashboard page displaying asset list/grid with market overview.
 *
 * ## Features:
 * - Displays assets in list or grid view mode (persisted preference)
 * - Filters by asset type (crypto, stocks, all)
 * - Sorts by various metrics (market cap, price, change)
 * - Auto-switches to crypto when US stock market is closed
 * - Responsive layout for mobile/tablet/desktop
 * - Shows market metrics carousel at top
 *
 * ## State (persisted to localStorage):
 * - viewMode: "list" | "grid" - Asset display mode
 * - cardSize: number - Grid card size in pixels
 * - filters: FilterState - Sort, filter, and asset type settings
 *
 * ## Data Flow:
 * 1. useCryptoData fetches assets based on filters
 * 2. Assets filtered by market status (hide closed markets unless toggled)
 * 3. Rendered in AssetList (list mode) or ChartGrid (grid mode)
 */

import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Navbar } from "../components/Navbar";
import { MetricsCarousel } from "../components/MetricsCarousel";
import { AssetList } from "../components/AssetList";
import { ChartGrid } from "../components/ChartGrid";
import { Toolbar, type ViewMode, type FilterState } from "../components/Toolbar";
import { useTheme } from "../context/ThemeContext";
import { useCryptoData } from "../hooks/useCryptoData";
import { usePersistedState } from "../hooks/usePersistedState";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { getMarketStatus, isUSMarketOpen } from "../utils/marketHours";

/** Returns default asset type based on US market status */
const getDefaultAssetType = (): "all" | "crypto" => {
  return isUSMarketOpen() ? "all" : "crypto";
};

const DEFAULT_FILTERS: FilterState = {
  sort: "market_cap",
  sortDir: "desc",
  filter: "all",
  assetType: getDefaultAssetType(),
  showOfflineMarkets: false,
};

// Theme colors
const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

/**
 * Main dashboard component displaying the asset list and market overview.
 *
 * @returns Dashboard page with navbar, metrics carousel, toolbar, and asset list/grid
 */
export function Dashboard() {
  // Theme and responsive hooks
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();
  const [viewMode, setViewMode] = usePersistedState<ViewMode>("wraith:viewMode", "list");
  const [cardSize, setCardSize] = usePersistedState("wraith:cardSize", 220);
  const [filters, setFilters] = usePersistedState<FilterState>("wraith:filters", DEFAULT_FILTERS);

  // Auto-switch to crypto when market is closed and user had stock/all selected
  React.useEffect(() => {
    const marketOpen = isUSMarketOpen();
    if (!marketOpen && (filters.assetType === "all" || filters.assetType === "stock")) {
      setFilters({ ...filters, assetType: "crypto" });
    }
  }, []); // Only run on mount

  // Responsive content padding
  const contentPadding = isMobile ? 0 : isNarrow ? 12 : 24;

  // Get assets for ChartGrid with filter params
  const { assets, loading, error } = useCryptoData({
    limit: 50,
    useMock: false,
    sort: filters.sort,
    sortDir: filters.sortDir,
    filter: filters.filter,
    assetType: filters.assetType,
  });

  // Show loading state when there's an error (no data to display)
  const showChartGridLoading = loading || (error !== null && assets.length === 0);

  // Filter assets for ChartGrid based on market status
  const filteredAssets = useMemo(() => {
    if (filters.showOfflineMarkets) {
      return assets;
    }
    return assets.filter((asset) => {
      const marketStatus = getMarketStatus(asset.assetType);
      return marketStatus === "24/7" || marketStatus === "open";
    });
  }, [assets, filters.showOfflineMarkets]);

  // Handle asset type change from navbar
  const handleAssetTypeChange = (assetType: typeof filters.assetType) => {
    setFilters({ ...filters, assetType });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar
        assetType={filters.assetType}
        onAssetTypeChange={handleAssetTypeChange}
      />
      <ScrollView style={styles.scrollView}>
        <MetricsCarousel assetType={filters.assetType} />
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cardSize={cardSize}
          onCardSizeChange={setCardSize}
          filters={filters}
          onFiltersChange={setFilters}
          compact={isMobile}
        />
        <View style={[styles.contentContainer, { paddingHorizontal: contentPadding }]}>
          {viewMode === "list" ? (
            <AssetList filters={filters} fullBleed={isMobile} />
          ) : (
            <ChartGrid assets={filteredAssets} loading={showChartGridLoading} cardSize={cardSize} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
});
