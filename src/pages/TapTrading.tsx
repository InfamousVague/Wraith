/**
 * @file TapTrading.tsx
 * @description Tap Trading page — real-time prediction trading on a 2D grid.
 *
 * Route: /tap/:symbol?
 *
 * Users place bets on grid cells (price x time). A sparkline shows live price.
 * Each cell displays a multiplier derived from one-touch barrier option pricing.
 * Tap a cell to bet. If price touches that cell, win bet × multiplier.
 *
 * ## Layout:
 * - Navbar at top
 * - Leverage toolbar (leverage pills + 24h stats)
 * - Full-screen canvas (sparkline + grid + tiles)
 * - Bottom bar (balance pill left, bet size toggle right)
 * - Notification banners (top center, max 3)
 */

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useParams } from "react-router-dom";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { Navbar } from "../components/ui";
import {
  TapCanvas,
  AssetInfoCard,
  BetSizeToggle,
  LeverageControl,
} from "../components/tap-trading";
import { useTapTrading } from "../hooks/useTapTrading";
import { useAuth } from "../context/AuthContext";
import { usePortfolio } from "../hooks/usePortfolio";
import { useToast } from "../context/ToastContext";
import { hauntClient } from "../services/haunt";
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

  // Loading state
  if (loading && !gridConfig) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2FD575" />
          <Text appearance={TextAppearance.Secondary} style={styles.loadingText}>
            Loading grid data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar />

      {/* Leverage toolbar */}
      <LeverageControl
        value={leverage}
        presets={leveragePresets}
        onChange={setLeverage}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        stats={stats}
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

        {/* Bottom overlay: asset info + bet size */}
        <div style={bottomOverlayStyle}>
          <AssetInfoCard asset={asset} livePrice={currentPrice} />
          <div style={bottomRightStyle}>
            <span style={tradeCountStyle}>
              {activePositions.filter((p) => p.status === "active" || p.status === "pending").length}
              /{gridConfig?.max_active_trades ?? 10}
            </span>
            <BetSizeToggle
              value={betSize}
              presets={betSizePresets}
              onChange={setBetSize}
            />
          </div>
        </div>

        {/* Connection status indicator */}
        {!connected && (
          <div style={connectionIndicatorStyle}>
            <span style={connectionDotStyle} />
            Connecting...
          </div>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  canvasContainer: {
    flex: 1,
    position: "relative",
  },
});

const bottomOverlayStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 14,
  left: 12,
  right: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  pointerEvents: "none",
  zIndex: 10,
};

const bottomRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  pointerEvents: "auto",
};

const tradeCountStyle: React.CSSProperties = {
  color: "rgba(255, 255, 255, 0.4)",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
};

const connectionIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 12,
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  backgroundColor: "rgba(30, 30, 35, 0.9)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 6,
  color: "rgba(255, 255, 255, 0.5)",
  fontSize: 11,
  fontFamily: "-apple-system, system-ui, sans-serif",
  zIndex: 10,
};

const connectionDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#F59E0B",
};
