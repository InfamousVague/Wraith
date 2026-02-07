/**
 * @file TapTrading.tsx
 * @description Tap Trading page — real-time prediction trading on a 2D grid.
 *
 * Route: /tap/:symbol?
 *
 * Users place bets on grid cells (price x time). A sparkline shows live price.
 * Each cell displays a multiplier derived from one-touch barrier option pricing.
 * Tap a cell to bet. If price touches that cell, win bet x multiplier.
 *
 * ## Layout:
 * - Navbar at top
 * - Toolbar (leverage pills, bet size pills, W/L stats, PnL, balance)
 * - Full-screen canvas (sparkline + grid + tiles)
 * - Top-left overlay: asset info card
 * - Bottom-right overlay: trade count badge
 * - Connection status badge (top right)
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { useParams } from "react-router-dom";
import { Text, Icon, Badge } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { Navbar } from "../components/ui";
import {
  TapCanvas,
  AssetInfoCard,
  LeverageControl,
} from "../components/tap-trading";
import { useTapTrading } from "../hooks/useTapTrading";
import { useAuth } from "../context/AuthContext";
import { usePortfolio } from "../hooks/usePortfolio";
import { useToast } from "../context/ToastContext";
import { hauntClient } from "../services/haunt";
import { spacing } from "../styles/tokens";
import { DEFAULT_TAP_SETTINGS } from "../types/tap-trading";
import type { TapSettings } from "../types/tap-trading";
import type { Asset } from "../types/asset";

export function TapTrading() {
  const { symbol = "BTC" } = useParams<{ symbol?: string }>();
  const { sessionToken } = useAuth();
  const { portfolio } = usePortfolio();
  const { showError, showSuccess } = useToast();

  const [betSize, setBetSize] = useState(5);
  const [leverage, setLeverage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [settings] = useState<TapSettings>(() => {
    try {
      const saved = localStorage.getItem("tap-trading-settings");
      if (saved) return { ...DEFAULT_TAP_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_TAP_SETTINGS;
  });

  // Fetch asset metadata (image, name, change24h) for the info card
  useEffect(() => {
    let cancelled = false;
    hauntClient.search(symbol, 1).then((res) => {
      if (!cancelled && res.data?.length > 0) {
        setAsset(res.data[0]);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [symbol]);

  const {
    gridConfig,
    multipliers,
    activePositions,
    currentPrice,
    priceHistory,
    placeTrade,
    stats,
    betSizePresets,
    leveragePresets,
    connected,
    loading,
    error,
  } = useTapTrading(symbol, portfolio?.id);

  const handleCellTap = useCallback(
    async (row: number, col: number, timeStart: number, timeEnd: number) => {
      // Pre-flight validation
      if (!sessionToken) {
        showError("Sign in to trade");
        return;
      }
      const balance = portfolio?.cashBalance ?? 0;
      if (balance < betSize) {
        showError("Insufficient balance");
        return;
      }
      const activeCount = activePositions.filter((p) => p.status === "active" || p.status === "pending").length;
      if (activeCount >= (gridConfig?.max_active_trades ?? 10)) {
        showError("Max trades reached");
        return;
      }
      // Check if cell already has a trade
      if (activePositions.some((p) => p.row_index === row && p.col_index === col && (p.status === "active" || p.status === "pending"))) {
        showError("Try another square");
        return;
      }

      try {
        await placeTrade(row, col, betSize, leverage, timeStart, timeEnd);
      } catch {
        showError("Trade failed");
      }
    },
    [placeTrade, betSize, leverage, sessionToken, portfolio, activePositions, gridConfig, showError]
  );

  // Spinning loader animation (matches Preloader pattern)
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Loading state
  if (loading && !gridConfig) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
            <Icon name="loader" size={Size.Large} color={Colors.accent.primary} />
          </Animated.View>
          <Text appearance={TextAppearance.Muted} size={Size.Small}>
            Loading grid data...
          </Text>
        </View>
      </View>
    );
  }

  const activeCount = activePositions.filter((p) => p.status === "active" || p.status === "pending").length;
  const maxTrades = gridConfig?.max_active_trades ?? 10;

  return (
    <View style={styles.container}>
      <Navbar />

      {/* Toolbar: leverage, bet size, stats */}
      <LeverageControl
        value={leverage}
        presets={leveragePresets}
        onChange={setLeverage}
        betSize={betSize}
        betSizePresets={betSizePresets}
        onBetSizeChange={setBetSize}
        stats={stats}
        balance={portfolio?.cashBalance ?? 0}
        symbol={symbol}
      />

      {/* Main canvas fills remaining space */}
      <View style={styles.canvasContainer}>
        <TapCanvas
          gridConfig={gridConfig}
          multipliers={multipliers}
          activePositions={activePositions}
          currentPrice={currentPrice}
          priceHistory={priceHistory}
          settings={settings}
          zoomLevel={zoomLevel}
          onCellTap={handleCellTap}
        />

        {/* Top-left: asset info card */}
        <View style={styles.topLeftOverlay} pointerEvents="box-none">
          <AssetInfoCard asset={asset} livePrice={currentPrice} />
        </View>

        {/* Bottom-right: trade count badge */}
        <View style={styles.bottomRightOverlay} pointerEvents="box-none">
          <Badge
            label={`${activeCount}/${maxTrades}`}
            icon="layers"
            variant="outline"
            size={Size.Small}
          />
        </View>

        {/* Connection status indicator */}
        {!connected && (
          <View style={styles.connectionBadge}>
            <Badge
              label="Connecting..."
              dot
              variant="warning"
              size={Size.TwoXSmall}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  canvasContainer: {
    flex: 1,
    position: "relative",
  },
  topLeftOverlay: {
    position: "absolute",
    top: spacing.xs,
    left: spacing.sm,
    zIndex: 10,
  },
  bottomRightOverlay: {
    position: "absolute",
    bottom: 14,
    right: spacing.sm,
    zIndex: 10,
  },
  connectionBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.sm,
    zIndex: 10,
  },
});
