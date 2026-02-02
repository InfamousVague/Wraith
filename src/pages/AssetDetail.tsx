import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useParams, useNavigate } from "react-router-dom";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { useTheme } from "../context/ThemeContext";
import { Navbar } from "../components/Navbar";
import { AssetHeader } from "../components/AssetHeader";
import { AdvancedChart } from "../components/AdvancedChart";
import { MetricsGrid } from "../components/MetricsGrid";
import { AssetSourceBreakdown } from "../components/AssetSourceBreakdown";
import { ConfidenceCard } from "../components/ConfidenceCard";
import { SignalSummaryCard } from "../components/SignalSummaryCard";
import { SignalIndicatorsPanel } from "../components/SignalIndicatorsPanel";
import { PredictionAccuracyCard } from "../components/PredictionAccuracyCard";
import { TimeframeSelector } from "../components/TimeframeSelector";
import { hauntClient } from "../services/haunt";
import { useAssetSubscription, type PriceUpdate } from "../hooks/useHauntSocket";
import { useSignals } from "../hooks/useSignals";
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

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradingTimeframe, setTradingTimeframe] = useState<TradingTimeframe>("day_trading");

  // Fetch trading signals with timeframe
  const {
    signals,
    accuracies,
    predictions,
    recommendation,
    loading: signalsLoading,
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
            <View style={styles.section}>
              <MetricsGrid asset={asset} loading={loading} />
            </View>

            <View style={styles.section}>
              <AdvancedChart asset={asset} loading={loading} height={400} />
            </View>

            {/* Trading Timeframe Selector */}
            {asset && (
              <View style={styles.section}>
                <TimeframeSelector
                  value={tradingTimeframe}
                  onChange={setTradingTimeframe}
                />
              </View>
            )}

            {/* Trading Signals & Prediction Accuracy */}
            {asset && (
              <View style={styles.section}>
                <View style={styles.signalsRow}>
                  <SignalSummaryCard
                    compositeScore={signals?.compositeScore ?? 0}
                    direction={signals?.direction ?? "neutral"}
                    trendScore={signals?.trendScore ?? 0}
                    momentumScore={signals?.momentumScore ?? 0}
                    volatilityScore={signals?.volatilityScore ?? 0}
                    volumeScore={signals?.volumeScore ?? 0}
                    indicatorCount={signals?.signals?.length ?? 12}
                    priceChange24h={asset.change24h}
                    loading={signalsLoading}
                  />
                  <PredictionAccuracyCard
                    recommendation={recommendation}
                    accuracies={accuracies}
                    predictions={predictions}
                    loading={signalsLoading}
                  />
                </View>
              </View>
            )}

            {/* Technical Indicators Panel */}
            {asset && (
              <View style={styles.section}>
                <SignalIndicatorsPanel
                  signals={signals?.signals ?? []}
                  loading={signalsLoading}
                />
              </View>
            )}

            {/* Data Quality Cards */}
            {asset && (
              <View style={styles.section}>
                <View style={styles.cardsRow}>
                  <ConfidenceCard symbol={asset.symbol} loading={loading} />
                  <AssetSourceBreakdown symbol={asset.symbol} loading={loading} />
                </View>
              </View>
            )}
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
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  signalsRow: {
    flexDirection: "row",
    gap: 24,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 24,
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
