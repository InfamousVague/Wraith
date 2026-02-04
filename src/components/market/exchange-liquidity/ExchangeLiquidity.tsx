/**
 * ExchangeLiquidity Component
 *
 * @fileoverview Displays real-time data source statistics and online/offline status
 * for all connected exchange feeds.
 *
 * @description
 * Features:
 * - **Exchange List**: Shows all configured data sources with update counts
 * - **Progress Bars**: Visual representation of relative update volume per exchange
 * - **Online/Offline Status**: Color-coded indicators and skull icon for offline sources
 * - **Auto-Refresh**: Polls `/api/market/exchanges` every 2 seconds (configurable)
 * - **Brand Colors**: Exchange-specific colors for visual identification
 *
 * Sub-components:
 * - `ExchangeRow`: Memoized row showing name, count, percentage, and progress bar
 *
 * Exchange configuration includes brand colors for: Binance, Coinbase, CMC,
 * CoinGecko, CryptoCompare, Kraken, KuCoin, OKX, and Huobi.
 *
 * @example
 * <ExchangeLiquidity pollInterval={5000} />
 *
 * @exports ExchangeLiquidity - Main component
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { ExchangeRow } from "./ExchangeRow";
import type { ExchangeStats, ExchangeLiquidityProps } from "./types";

export function ExchangeLiquidity({
  loading = false,
  pollInterval = 2000,
}: ExchangeLiquidityProps) {
  const [exchanges, setExchanges] = useState<ExchangeStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeColors = useThemeColors();

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/market/exchanges");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const json = await response.json();
      setExchanges(json.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStats, pollInterval]);

  // Find max update count for scaling progress bars
  const maxCount = useMemo(() => {
    return Math.max(...exchanges.map((e) => e.updateCount), 1);
  }, [exchanges]);

  const onlineCount = useMemo(() => {
    return exchanges.filter((e) => e.online).length;
  }, [exchanges]);

  const showLoading = loading || isLoading;

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            DATA SOURCES
          </Text>
          <View style={styles.badge}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {onlineCount}/{exchanges.length} Online
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color={Colors.status.danger} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              API Offline
            </Text>
          </View>
        ) : exchanges.length === 0 ? (
          <View style={styles.errorState}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Collecting data from sources...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exchangeList}
          >
            {exchanges.map((exchange) => (
              <ExchangeRow
                key={exchange.source}
                exchange={exchange}
                maxCount={maxCount}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 356,
    flexShrink: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  divider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  exchangeList: {
    gap: spacing.sm,
  },
});
