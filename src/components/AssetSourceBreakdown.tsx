import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { Card, Text, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { hauntClient, type SymbolSourceStat, type ConfidenceResponse } from "../services/haunt";
import { HintIndicator } from "./HintIndicator";

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

// Get color based on confidence score
function getScoreColor(score: number): string {
  if (score >= 80) return "#22C55E"; // Green
  if (score >= 60) return "#84CC16"; // Lime
  if (score >= 40) return "#EAB308"; // Yellow
  if (score >= 20) return "#F97316"; // Orange
  return "#EF4444"; // Red
}

// Get label based on score
function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Low";
  return "Very Low";
}

type HalfCircleGaugeProps = {
  score: number;
  color: string;
  label: string;
};

function HalfCircleGauge({ score, color, label }: HalfCircleGaugeProps) {
  // SVG half-circle gauge
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const progress = (score / 100) * circumference;

  return (
    <View style={gaugeStyles.container}>
      {Platform.OS === "web" ? (
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 8}
            textAnchor="middle"
            fill={color}
            fontSize="28"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {score}
          </text>
          {/* Label text */}
          <text
            x={size / 2}
            y={size / 2 + 14}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {label}
          </text>
        </svg>
      ) : (
        <View style={gaugeStyles.fallback}>
          <Text size={Size.TwoXLarge} weight="bold" style={{ color }}>
            {score}
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    alignItems: "center",
    paddingVertical: 16,
  },
});

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
  symbol: string | undefined;
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
  const [confidence, setConfidence] = useState<ConfidenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeColors = useThemeColors();

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch both source stats and confidence in parallel
      const [sourceResponse, confidenceResponse] = await Promise.all([
        hauntClient.getSymbolSourceStats(symbol),
        hauntClient.getConfidence(symbol),
      ]);

      setSources(sourceResponse.data?.sources || []);
      setTotalUpdates(sourceResponse.data?.totalUpdates || 0);
      setConfidence(confidenceResponse.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  // Find max update count for scaling progress bars
  const maxCount = useMemo(() => {
    return Math.max(...sources.map((s) => s.updateCount), 1);
  }, [sources]);

  const showLoading = loading || isLoading;
  const score = confidence?.confidence.score ?? 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        {/* Header with hint */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.headerLabel}>
              DATA QUALITY
            </Text>
            <HintIndicator
              id="data-quality-hint"
              title="Data Quality"
              content="Measures how reliable the price data is based on source diversity, update frequency, data recency, and price consistency across sources. Higher scores mean more trustworthy data for analysis."
              icon="?"
              color="#A78BFA"
              priority={15}
              inline
            />
          </View>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {symbol?.toUpperCase() ?? "—"} confidence & sources
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color="#FF5C7A" />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              Unable to load data
            </Text>
          </View>
        ) : (
          <>
            {/* Confidence Half-Circle Gauge */}
            <View style={styles.gaugeSection}>
              <HalfCircleGauge score={score} color={scoreColor} label={scoreLabel} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text size={Size.Small} weight="semibold">
                  {sources.length}
                </Text>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Sources
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border.subtle }]} />
              <View style={styles.statItem}>
                <AnimatedNumber
                  value={totalUpdates}
                  decimals={0}
                  separator=","
                  size={Size.Small}
                  weight="semibold"
                  animate
                  animationDuration={200}
                />
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Updates
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border.subtle }]} />
              <View style={styles.statItem}>
                <AnimatedNumber
                  value={confidence?.chartDataPoints ?? 0}
                  decimals={0}
                  separator=","
                  size={Size.Small}
                  weight="semibold"
                  animate
                  animationDuration={200}
                />
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Data Points
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

            {/* Source list */}
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sourcesTitle}>
              ACTIVE SOURCES
            </Text>

            {sources.length === 0 && !isLoading ? (
              <View style={styles.emptyState}>
                <Icon name="wifi-off" size={Size.Large} appearance={TextAppearance.Muted} />
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.emptyText}>
                  No data sources yet
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
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    marginBottom: 2,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  gaugeSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sourcesTitle: {
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
