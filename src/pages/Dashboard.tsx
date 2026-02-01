import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Navbar } from "../components/Navbar";
import { PriceTicker } from "../components/PriceTicker";
import { MetricsCarousel } from "../components/MetricsCarousel";
import { AssetList } from "../components/AssetList";
import { ChartGrid } from "../components/ChartGrid";
import { Toolbar, type ViewMode } from "../components/Toolbar";
import { useTheme } from "../context/ThemeContext";
import { useCryptoData } from "../hooks/useCryptoData";
import { usePersistedState } from "../hooks/usePersistedState";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Get assets for ChartGrid
  const { assets, loading, error } = useCryptoData({ limit: 50, useMock: false });

  // Show loading state when there's an error (no data to display)
  const showChartGridLoading = loading || (error !== null && assets.length === 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PriceTicker />
      <Navbar onSearch={setSearchQuery} />
      <ScrollView style={styles.scrollView}>
        <MetricsCarousel />
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cardSize={cardSize}
          onCardSizeChange={setCardSize}
        />
        <View style={styles.contentContainer}>
          {viewMode === "list" ? (
            <AssetList searchQuery={searchQuery} filter="all" />
          ) : (
            <ChartGrid assets={assets} loading={showChartGridLoading} searchQuery={searchQuery} cardSize={cardSize} />
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
