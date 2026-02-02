import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { Navbar } from "../components/Navbar";
import { AssetHeader } from "../components/AssetHeader";
import { AdvancedChart } from "../components/AdvancedChart";
import { AggregatedOrderBook } from "../components/AggregatedOrderBook";
import { MetricsGrid } from "../components/MetricsGrid";
import { AssetSourceBreakdown } from "../components/AssetSourceBreakdown";
import { SignalSummaryCard } from "../components/SignalSummaryCard";
import { SignalIndicatorsPanel } from "../components/SignalIndicatorsPanel";
import { PredictionAccuracyCard } from "../components/PredictionAccuracyCard";
import { TimeframeSelector } from "../components/TimeframeSelector";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { hauntClient } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import { useSignals } from "../hooks/useSignals";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { Asset } from "../types/asset";
import type { TradingTimeframe } from "../types/signals";

// Theme colors
const themes = {
  dark: {
    background: "#050608",
  },
  light: {
    background: "#f8fafc",
  },
};

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;
  const { isMobile, isNarrow } = useBreakpoint();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingTimeframe, setTradingTimeframe] = useState<TradingTimeframe>("day_trading");

  // Responsive layout values
  const sectionPadding = isMobile ? 12 : isNarrow ? 16 : 24;
  const showOrderBook = !isMobile;
  const orderBookWidth = isNarrow ? 280 : 340;

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AssetHeader asset={asset} loading={loading} onBack={handleBack} />

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorBox}>
              <Text appearance={TextAppearance.Danger}>{error}</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Key Details - above chart */}
            <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
              <MetricsGrid asset={asset} loading={loading} />
            </View>

            {/* Chart with Order Book */}
            <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
              <View style={[styles.chartRow, isMobile && styles.chartRowStacked]}>
                {showOrderBook && (
                  <View style={[styles.orderBookColumn, { width: orderBookWidth }]} data-testid="order-book">
                    <AggregatedOrderBook symbol={asset?.symbol} loading={loading} />
                  </View>
                )}
                <View style={styles.chartColumn} data-testid="advanced-chart">
                  <AdvancedChart asset={asset} loading={loading} />
                </View>
              </View>

              {/* Mobile: Collapsible order book */}
              {isMobile && (
                <View style={styles.collapsibleOrderBook} data-testid="collapsible-order-book">
                  <CollapsibleSection title="Order Book" defaultOpen={false}>
                    <AggregatedOrderBook symbol={asset?.symbol} loading={loading} />
                  </CollapsibleSection>
                </View>
              )}
            </View>

            {/* Trading Timeframe Selector */}
            <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
              <TimeframeSelector
                value={tradingTimeframe}
                onChange={setTradingTimeframe}
              />
            </View>

            {/* Trading Signals, Data Quality & Prediction Accuracy */}
            <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
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
            <View style={[styles.section, { paddingHorizontal: sectionPadding }]}>
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
  orderBookColumn: {
    flexShrink: 0,
  },
  chartColumn: {
    flex: 1,
    display: "flex",
    minHeight: 500, // Ensure chart has reasonable minimum height
  },
  collapsibleOrderBook: {
    marginTop: 16,
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
