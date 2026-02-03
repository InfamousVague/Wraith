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
import { Card, Text, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";

type ExchangeStats = {
  source: string;
  updateCount: number;
  updatePercent: number;
  online: boolean;
  lastError?: string;
};

// Exchange display names and brand colors
const EXCHANGE_CONFIG: Record<string, { name: string; color: string }> = {
  binance: { name: "Binance", color: "#F0B90B" },
  coinbase: { name: "Coinbase", color: "#0052FF" },
  coinmarketcap: { name: "CMC", color: "#3861FB" },
  coingecko: { name: "CoinGecko", color: "#8DC63F" },
  cryptocompare: { name: "CryptoCompare", color: "#FF9500" },
  kraken: { name: "Kraken", color: "#5741D9" },
  kucoin: { name: "KuCoin", color: "#23AF91" },
  okx: { name: "OKX", color: "#FFFFFF" },
  huobi: { name: "Huobi", color: "#1E88E5" },
};

type ExchangeRowProps = {
  exchange: ExchangeStats;
  maxCount: number;
};

const ExchangeRow = React.memo(function ExchangeRow({ exchange, maxCount }: ExchangeRowProps) {
  const themeColors = useThemeColors();
  const config = EXCHANGE_CONFIG[exchange.source.toLowerCase()] || {
    name: exchange.source,
    color: "#888",
  };

  // Calculate progress as percentage of max updates (0-100)
  const progressValue = maxCount > 0 ? (exchange.updateCount / maxCount) * 100 : 0;

  // Use muted color when offline
  const dotColor = exchange.online ? config.color : themeColors.text.muted;
  const barColor = exchange.online ? config.color : themeColors.text.muted;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.exchangeInfo}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <Text
            size={Size.ExtraSmall}
            weight="medium"
            appearance={exchange.online ? undefined : TextAppearance.Muted}
          >
            {config.name}
          </Text>
          {!exchange.online && (
            <View style={styles.offlineBadge}>
              <Icon name="skull" size={Size.TwoXSmall} color={Colors.status.danger} />
            </View>
          )}
        </View>
        <View style={styles.countInfo}>
          <AnimatedNumber
            value={exchange.updateCount}
            decimals={0}
            separator=","
            size={Size.Small}
            appearance={exchange.online ? TextAppearance.Primary : TextAppearance.Muted}
            brightness={exchange.online ? Brightness.Soft : Brightness.None}
            animate
            animationDuration={200}
          />
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {" "}({(exchange.updatePercent ?? 0).toFixed(1)}%)
          </Text>
        </View>
      </View>
      <ProgressBar
        value={progressValue}
        max={100}
        size={Size.ExtraSmall}
        color={barColor}
        brightness={exchange.online ? Brightness.Soft : Brightness.None}
      />
    </View>
  );
});

type ExchangeLiquidityProps = {
  loading?: boolean;
  pollInterval?: number;
};

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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  errorText: {
    marginTop: 8,
  },
  exchangeList: {
    gap: 12,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exchangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countInfo: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  offlineBadge: {
    marginLeft: 4,
  },
});
