import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { hauntClient, type SymbolSourceStat } from "../services/haunt";

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

type SourceRowProps = {
  source: SymbolSourceStat;
  maxCount: number;
};

const SourceRow = React.memo(function SourceRow({ source, maxCount }: SourceRowProps) {
  const themeColors = useThemeColors();
  const sourceKey = source.source.toLowerCase();
  const config = EXCHANGE_CONFIG[sourceKey] || {
    name: source.source,
    color: "#888",
  };

  // Calculate progress as percentage of max updates (0-100)
  const progressValue = maxCount > 0 ? (source.updateCount / maxCount) * 100 : 0;

  // Use muted color when offline
  const dotColor = source.online ? config.color : themeColors.text.muted;
  const barColor = source.online ? config.color : themeColors.text.muted;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.sourceInfo}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <Text
            size={Size.ExtraSmall}
            weight="medium"
            appearance={source.online ? undefined : TextAppearance.Muted}
          >
            {config.name}
          </Text>
          {!source.online && (
            <View style={styles.offlineBadge}>
              <Icon name="skull" size={Size.TwoXSmall} color="#FF5C7A" />
            </View>
          )}
        </View>
        <View style={styles.countInfo}>
          <AnimatedNumber
            value={source.updateCount}
            decimals={0}
            separator=","
            size={Size.Small}
            appearance={TextAppearance.Muted}
            animate
            animationDuration={200}
          />
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {" "}({(source.updatePercent ?? 0).toFixed(1)}%)
          </Text>
        </View>
      </View>
      <ProgressBar
        value={progressValue}
        max={100}
        size={Size.ExtraSmall}
        color={barColor}
        brightness={source.online ? Brightness.Soft : Brightness.None}
      />
    </View>
  );
});

type AssetSourceBreakdownProps = {
  symbol: string;
  loading?: boolean;
  pollInterval?: number;
};

export function AssetSourceBreakdown({
  symbol,
  loading = false,
  pollInterval = 5000, // Poll every 5 seconds
}: AssetSourceBreakdownProps) {
  const [sources, setSources] = useState<SymbolSourceStat[]>([]);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeColors = useThemeColors();

  const fetchStats = useCallback(async () => {
    if (!symbol) return;

    try {
      const response = await hauntClient.getSymbolSourceStats(symbol);
      setSources(response.data?.sources || []);
      setTotalUpdates(response.data?.totalUpdates || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStats, pollInterval]);

  // Find max update count for scaling progress bars
  const maxCount = useMemo(() => {
    return Math.max(...sources.map((s) => s.updateCount), 1);
  }, [sources]);

  const showLoading = loading || isLoading;

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.headerLabel}>
              DATA SOURCES FOR {symbol.toUpperCase()}
            </Text>
            <View style={styles.headerValue}>
              <AnimatedNumber
                value={totalUpdates}
                decimals={0}
                separator=","
                size={Size.Large}
                weight="bold"
                animate
                animationDuration={200}
              />
              <Text size={Size.Large} weight="bold" appearance={TextAppearance.Muted}>
                {" "}updates
              </Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {sources.length} {sources.length === 1 ? "Source" : "Sources"}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color="#FF5C7A" />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              Unable to load source data
            </Text>
          </View>
        ) : sources.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Icon name="wifi-off" size={Size.Large} appearance={TextAppearance.Muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.emptyText}>
              No data sources yet
            </Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Sources will appear as data arrives
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sourceList}
          >
            {sources.map((source) => (
              <SourceRow
                key={source.source}
                source={source}
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
    flex: 1,
    minHeight: 200,
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLabel: {
    marginBottom: 4,
  },
  headerValue: {
    flexDirection: "row",
    alignItems: "baseline",
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
    paddingVertical: 32,
    gap: 8,
  },
  errorText: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    marginTop: 8,
  },
  sourceList: {
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
  sourceInfo: {
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
