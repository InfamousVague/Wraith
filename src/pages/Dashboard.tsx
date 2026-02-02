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
import { getMarketStatus } from "../utils/marketHours";

const DEFAULT_FILTERS: FilterState = {
  sort: "market_cap",
  sortDir: "desc",
  filter: "all",
  assetType: "all",
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

export function Dashboard() {
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;
  const [viewMode, setViewMode] = usePersistedState<ViewMode>("wraith:viewMode", "list");
  const [cardSize, setCardSize] = usePersistedState("wraith:cardSize", 220);
  const [filters, setFilters] = usePersistedState<FilterState>("wraith:filters", DEFAULT_FILTERS);

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
        />
        <View style={styles.contentContainer}>
          {viewMode === "list" ? (
            <AssetList filters={filters} />
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
