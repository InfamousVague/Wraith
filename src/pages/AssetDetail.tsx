/**
 * @file AssetDetail.tsx
 * @description Individual asset detail page with charts, signals, and predictions.
 *
 * ## URL Parameters:
 * - `:id` - Asset ID (numeric) to display
 *
 * ## Features:
 * - Real-time price updates via WebSocket subscription
 * - Interactive TradingView-style chart with key metrics panel
 * - Technical indicators and trading signals
 * - AI-generated price predictions with accuracy tracking
 * - Responsive layout (desktop/tablet/mobile)
 *
 * ## Data Flow:
 * 1. Fetch asset data from API on mount using asset ID
 * 2. Subscribe to WebSocket for real-time price updates
 * 3. Fetch trading signals based on selected timeframe
 * 4. Display all data in organized sections
 *
 * ## WebSocket Notes:
 * Only price and tradeDirection are updated from WebSocket.
 * change24h and volume24h come from API (market-wide stats).
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { Navbar, TimeframeSelector } from "../components/ui";
import { AssetHeader, AssetSourceBreakdown, KeyMetricsPanel, AssetPositions } from "../components/asset";
import { AdvancedChart } from "../components/chart";
import { SignalSummaryCard, SignalIndicatorsPanel } from "../components/signal";
import { PredictionAccuracyCard } from "../components/prediction";
import { hauntClient } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import { useSignals } from "../hooks/useSignals";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { Asset } from "../types/asset";
import type { TradingTimeframe } from "../types/signals";

/** Theme color definitions for dark/light mode */
const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

/**
 * Asset detail page component showing comprehensive information about a single asset.
 *
 * Sections (top to bottom):
 * 1. Asset Header - Name, symbol, price, 24h change, Trade button
 * 2. Chart + Key Metrics Panel - Interactive chart with metrics sidebar
 * 3. Timeframe Selector - Trading timeframe for signals
 * 4. Signals + Predictions - AI signals and prediction accuracy
 * 5. Technical Indicators - Full indicator panel
 *
 * @returns Asset detail page or error state
 */
export function AssetDetail() {
  // URL params and navigation
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Theme and responsive layout
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingTimeframe, setTradingTimeframe] = useState<TradingTimeframe>("day_trading");

  // Responsive layout values
  const sectionPadding = isMobile ? 12 : isNarrow ? 16 : 24;
  const showMetricsPanel = !isMobile;
  const metricsPanelWidth = isNarrow ? 280 : 320;

  // Calculate chart height based on viewport
  // Reserve space for navbar (~64px), header (~80px), metrics (~100px), and padding
  const { height: viewportHeight } = useBreakpoint();
  const chartHeight = isMobile
    ? Math.max(350, viewportHeight - 300)  // Mobile: smaller minimum
    : Math.max(500, viewportHeight - 350); // Desktop: larger chart

  // Fetch trading signals with timeframe
  const {
    signals,
    accuracies,
    predictions,
    pendingPredictions,
    recommendation,
    loading: signalsLoading,
    generating: generatingPredictions,
    generatePredictions,
  } = useSignals(asset?.symbol, { timeframe: tradingTimeframe });

  // Handle real-time price updates
  // IMPORTANT: Only update price and tradeDirection from WebSocket.
  // Do NOT update change24h or volume24h - WebSocket data shows exchange-specific
  // values, not global market data. The API provides authoritative market-wide statistics.
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setAsset((prev) => {
      if (!prev) return null;

      // Determine trade direction
      const tradeDirection = update.tradeDirection
        ?? (update.price > prev.price ? "up" as const
          : update.price < prev.price ? "down" as const
          : prev.tradeDirection);

      return {
        ...prev,
        price: update.price,
        tradeDirection,
        // Keep original API values for change24h and volume24h
      };
    });
  }, []);

  // Subscribe to price updates for this asset
  useAssetSubscription(
    asset ? [asset.symbol] : [],
    handlePriceUpdate
  );

  // Fetch asset data
  useEffect(() => {
    async function fetchAsset() {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const assetId = parseInt(id, 10);
        if (isNaN(assetId)) {
          throw new Error("Invalid asset ID");
        }

        const response = await hauntClient.getAsset(assetId);
        setAsset(response.data);
      } catch (err) {
        console.error("Failed to fetch asset:", err);
        setError(err instanceof Error ? err.message : "Failed to load asset");
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();
  }, [id]);

  const handleBack = () => {
    navigate("/");
  };

  const handleTrade = () => {
    navigate(`/trade/${asset?.symbol?.toLowerCase() || ""}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AssetHeader asset={asset} loading={loading} onBack={handleBack} onTradePress={handleTrade} />

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorBox}>
              <Text appearance={TextAppearance.Danger}>{error}</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Chart with Key Metrics Panel */}
            <View style={[styles.section, { paddingHorizontal: isMobile ? 0 : sectionPadding }]}>
              <View style={[styles.chartRow, isMobile && styles.chartRowStacked]}>
                {showMetricsPanel && (
                  <View style={[styles.metricsPanelColumn, { width: metricsPanelWidth }]} data-testid="key-metrics-panel">
                    <KeyMetricsPanel asset={asset} signals={signals} loading={loading || signalsLoading} />
                  </View>
                )}
                <View style={[styles.chartColumn, isMobile && styles.chartColumnMobile]} data-testid="advanced-chart">
                  <AdvancedChart asset={asset} loading={loading} height={chartHeight} />
                </View>
              </View>
            </View>

            {/* Your Open Positions */}
            {asset?.symbol && (
              <View style={[styles.section, { paddingHorizontal: isMobile ? 0 : sectionPadding }]}>
                <AssetPositions symbol={asset.symbol} loading={loading} />
              </View>
            )}

            {/* Trading Timeframe Selector */}
            <View style={[styles.section, { paddingHorizontal: isMobile ? 12 : sectionPadding }]}>
              <TimeframeSelector
                value={tradingTimeframe}
                onChange={setTradingTimeframe}
              />
            </View>

            {/* Trading Signals, Data Quality & Prediction Accuracy */}
            <View style={[styles.section, { paddingHorizontal: isMobile ? 0 : sectionPadding }]}>
              <View style={[styles.signalsRow, isNarrow && styles.signalsRowStacked]}>
                {/* Left column: Trading Signals + Data Quality stacked */}
                <View style={styles.leftColumn}>
                  <SignalSummaryCard
                    compositeScore={signals?.compositeScore ?? 0}
                    direction={signals?.direction ?? "neutral"}
                    trendScore={signals?.trendScore ?? 0}
                    momentumScore={signals?.momentumScore ?? 0}
                    volatilityScore={signals?.volatilityScore ?? 0}
                    volumeScore={signals?.volumeScore ?? 0}
                    indicatorCount={signals?.signals?.length ?? 12}
                    priceChange24h={asset?.change24h ?? 0}
                    loading={loading || signalsLoading}
                  />
                  <AssetSourceBreakdown symbol={asset?.symbol} loading={loading} />
                </View>
                {/* Right column: Market Prediction (tall) */}
                <PredictionAccuracyCard
                  recommendation={recommendation}
                  accuracies={accuracies}
                  predictions={predictions}
                  pendingPredictions={pendingPredictions}
                  loading={loading || signalsLoading}
                  generating={generatingPredictions}
                  onGeneratePredictions={generatePredictions}
                />
              </View>
            </View>

            {/* Technical Indicators Panel */}
            <View style={[styles.section, { paddingHorizontal: isMobile ? 0 : sectionPadding }]}>
              <SignalIndicatorsPanel
                signals={signals?.signals ?? []}
                loading={loading || signalsLoading}
              />
            </View>
          </>
        )}
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
  content: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  signalsRow: {
    flexDirection: "row",
    gap: 24,
  },
  signalsRowStacked: {
    flexDirection: "column",
    gap: 16,
  },
  leftColumn: {
    flex: 1,
    gap: 24,
  },
  chartRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "stretch",
  },
  chartRowStacked: {
    flexDirection: "column",
    gap: 16,
  },
  metricsPanelColumn: {
    flexShrink: 0,
  },
  chartColumn: {
    flex: 1,
    display: "flex",
  },
  chartColumnMobile: {
    // Height controlled by chartHeight prop passed to AdvancedChart
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
    padding: 16,
  },
});
