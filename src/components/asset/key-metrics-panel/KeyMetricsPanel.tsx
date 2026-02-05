/**
 * @file KeyMetricsPanel.tsx
 * @description Visual metrics display panel for asset detail page.
 *
 * Displays key metrics with visual indicators:
 * - Market Cap (with rank badge)
 * - 24h Volume
 * - Circulating Supply
 * - Signal Score (half-circle gauge)
 * - Trend Direction (with icon)
 * - Volatility Level (progress bar)
 * - Exchange Dominance by Region
 */

import React, { useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Card, Icon, Skeleton, Currency, type IconName } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { HintIndicator } from "../../ui/hint-indicator";
import { spacing, radii } from "../../../styles/tokens";
import { getScoreColor, getDirectionLabel, getDirectionColor } from "../../../types/signals";
import { useExchangeDominance } from "../../../hooks/useExchangeDominance";
import type { KeyMetricsPanelProps } from "./types";
import type { RegionDominance } from "../../../services/haunt";

function formatCompact(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

/**
 * Half-circle gauge for signal score (-100 to +100)
 * Adapted from HalfCircleGauge to handle bipolar score range
 */
function SignalScoreGauge({
  score,
  size = 120,
}: {
  score: number;
  size?: number;
}) {
  const color = getScoreColor(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  // Normalize -100 to +100 into 0 to 100 for progress calculation
  const normalizedScore = ((score + 100) / 200) * 100;
  const progress = (normalizedScore / 100) * circumference;

  const trackColor = "rgba(255, 255, 255, 0.08)";
  const mutedColor = Colors.text.muted;

  // Determine label based on score
  const getLabel = () => {
    if (score >= 60) return "Strong Buy";
    if (score >= 20) return "Buy";
    if (score > -20) return "Neutral";
    if (score > -60) return "Sell";
    return "Strong Sell";
  };

  return (
    <View style={[styles.gaugeContainer, { width: size }]}>
      {Platform.OS === "web" ? (
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={trackColor}
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
            style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 6}
            textAnchor="middle"
            fill={color}
            fontSize="22"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {score > 0 ? "+" : ""}{score}
          </text>
          {/* Label text */}
          <text
            x={size / 2}
            y={size / 2 + 12}
            textAnchor="middle"
            fill={mutedColor}
            fontSize="10"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {getLabel()}
          </text>
        </svg>
      ) : (
        <View style={styles.gaugeFallback}>
          <Text size={Size.ExtraLarge} weight="bold" style={{ color }}>
            {score > 0 ? "+" : ""}{score}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {getLabel()}
          </Text>
        </View>
      )}
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(100, Math.max(0, value))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

type MetricRowProps = {
  icon: IconName;
  label: string;
  hint?: { title: string; content: string };
  loading?: boolean;
  children: React.ReactNode;
};

function MetricRow({ icon, label, hint, loading, children }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLabel}>
        <Icon name={icon} size={Size.Small} color={Colors.text.muted} />
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
        {hint && (
          <HintIndicator
            id={`metric-${label.toLowerCase().replace(/\s/g, "-")}`}
            title={hint.title}
            content={hint.content}
            inline
            priority={50}
          />
        )}
      </View>
      {loading ? (
        <Skeleton width={80} height={18} />
      ) : (
        <View style={styles.metricValue}>{children}</View>
      )}
    </View>
  );
}

// Region color mapping
const REGION_COLORS: Record<string, string> = {
  americas: Colors.data.blue,
  europe: Colors.data.violet,
  asia: Colors.data.amber,
  oceania: Colors.data.cyan,
  africa: Colors.data.emerald,
};

function getRegionColor(region: string): string {
  return REGION_COLORS[region.toLowerCase()] || Colors.data.blue;
}

function formatRegionName(region: string): string {
  return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
}

function ExchangeDominanceRow({
  region,
}: {
  region: RegionDominance;
}) {
  const color = getRegionColor(region.region);

  return (
    <View style={styles.dominanceRow}>
      <View style={styles.dominanceLeft}>
        <View style={[styles.dominanceDot, { backgroundColor: color }]} />
        <View>
          <Text size={Size.ExtraSmall} weight="semibold">
            {formatRegionName(region.region)}
          </Text>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {region.dominantExchange}
          </Text>
        </View>
      </View>
      <View style={styles.dominanceRight}>
        <Text size={Size.Small} weight="semibold">
          {region.percentage.toFixed(0)}%
        </Text>
        <View style={styles.dominanceBarContainer}>
          <ProgressBar value={region.percentage} color={color} />
        </View>
      </View>
    </View>
  );
}

export function KeyMetricsPanel({ asset, signals, loading }: KeyMetricsPanelProps) {
  // Fetch exchange dominance data
  const {
    data: exchangeDominance,
    loading: dominanceLoading,
    error: dominanceError,
  } = useExchangeDominance(asset?.symbol);

  const metrics = useMemo(() => {
    if (!asset) return null;

    const volatilityLevel = signals?.volatilityScore
      ? Math.abs(signals.volatilityScore)
      : Math.abs(asset.change24h) * 2;

    const volatilityLabel =
      volatilityLevel > 60 ? "High" : volatilityLevel > 30 ? "Medium" : "Low";

    const volatilityColor =
      volatilityLevel > 60
        ? Colors.status.danger
        : volatilityLevel > 30
        ? Colors.status.warning
        : Colors.status.success;

    return {
      marketCap: asset.marketCap,
      rank: asset.rank,
      volume24h: asset.volume24h,
      circulatingSupply: asset.circulatingSupply,
      maxSupply: asset.maxSupply,
      symbol: asset.symbol,
      compositeScore: signals?.compositeScore ?? 0,
      direction: signals?.direction ?? "neutral",
      trendScore: signals?.trendScore ?? 0,
      momentumScore: signals?.momentumScore ?? 0,
      volatilityLevel,
      volatilityLabel,
      volatilityColor,
    };
  }, [asset, signals]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text size={Size.Small} weight="semibold">
          Key Metrics
        </Text>
      </View>

      <View style={styles.content}>
        {/* Market Cap with Rank */}
        <MetricRow
          icon="bar-chart-2"
          label="Market Cap"
          hint={{
            title: "Market Cap",
            content: "Total value of all circulating coins, calculated as price multiplied by circulating supply.",
          }}
          loading={loading}
        >
          <View style={styles.valueWithBadge}>
            <Currency
              value={metrics?.marketCap ?? 0}
              size={Size.Small}
              weight="semibold"
              compact
              decimals={2}
            />
            <View style={styles.rankBadge}>
              <Text size={Size.TwoXSmall} style={{ color: Colors.accent.primary }}>
                #{metrics?.rank}
              </Text>
            </View>
          </View>
        </MetricRow>

        {/* 24h Volume */}
        <MetricRow
          icon="activity"
          label="24h Volume"
          hint={{
            title: "24h Volume",
            content: "Total trading volume across all exchanges in the last 24 hours.",
          }}
          loading={loading}
        >
          <Currency
            value={metrics?.volume24h ?? 0}
            size={Size.Small}
            weight="semibold"
            compact
            decimals={2}
          />
        </MetricRow>

        {/* Circulating Supply */}
        <MetricRow
          icon="database"
          label="Circulating Supply"
          hint={{
            title: "Circulating Supply",
            content: "Number of coins currently in circulation and available to the public.",
          }}
          loading={loading}
        >
          <Text size={Size.Small} weight="semibold">
            {formatCompact(metrics?.circulatingSupply ?? 0)} {metrics?.symbol}
          </Text>
        </MetricRow>

        {/* Supply Progress (if max supply exists) */}
        {metrics?.maxSupply && metrics.maxSupply > 0 && (
          <MetricRow
            icon="pie-chart"
            label="Supply Mined"
            hint={{
              title: "Supply Progress",
              content: "Percentage of maximum supply currently in circulation.",
            }}
            loading={loading}
          >
            <View style={styles.supplyProgress}>
              <Text size={Size.Small} weight="semibold">
                {((metrics.circulatingSupply / metrics.maxSupply) * 100).toFixed(1)}%
              </Text>
              <ProgressBar
                value={(metrics.circulatingSupply / metrics.maxSupply) * 100}
                color={Colors.accent.primary}
              />
            </View>
          </MetricRow>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Signal Score - Half Circle Gauge */}
        <View style={styles.signalSection}>
          <View style={styles.signalHeader}>
            <Icon name="target" size={Size.Small} color={Colors.text.muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Signal Score
            </Text>
            <HintIndicator
              id="metric-signal-score"
              title="Signal Score"
              content="Composite score from all technical indicators, ranging from -100 (strong sell) to +100 (strong buy)."
              inline
              priority={50}
            />
          </View>
          {loading ? (
            <Skeleton width={120} height={70} borderRadius={60} />
          ) : (
            <SignalScoreGauge score={metrics?.compositeScore ?? 0} size={120} />
          )}
        </View>

        {/* Trend Direction */}
        <MetricRow
          icon="trending-up"
          label="Trend"
          hint={{
            title: "Trend Direction",
            content: "Overall market trend based on moving averages and price action.",
          }}
          loading={loading}
        >
          <View style={styles.directionValue}>
            <Text
              size={Size.Small}
              weight="semibold"
              style={{ color: getDirectionColor(metrics?.direction ?? "neutral") }}
            >
              {getDirectionLabel(metrics?.direction ?? "neutral")}
            </Text>
            <Icon
              name={
                metrics?.direction?.includes("buy")
                  ? "arrow-up-right"
                  : metrics?.direction?.includes("sell")
                  ? "arrow-down-right"
                  : "minus"
              }
              size={Size.Small}
              color={getDirectionColor(metrics?.direction ?? "neutral")}
            />
          </View>
        </MetricRow>

        {/* Volatility */}
        <MetricRow
          icon="zap"
          label="Volatility"
          hint={{
            title: "Volatility Level",
            content: "Measure of price fluctuation. High volatility means larger price swings.",
          }}
          loading={loading}
        >
          <View style={styles.volatilityValue}>
            <Text
              size={Size.Small}
              weight="semibold"
              style={{ color: metrics?.volatilityColor }}
            >
              {metrics?.volatilityLabel}
            </Text>
            <View style={styles.volatilityBar}>
              <ProgressBar
                value={metrics?.volatilityLevel ?? 0}
                color={metrics?.volatilityColor ?? Colors.text.muted}
              />
            </View>
          </View>
        </MetricRow>

        {/* Momentum */}
        <MetricRow
          icon="trending-up"
          label="Momentum"
          hint={{
            title: "Momentum Score",
            content: "Momentum indicators measure the speed of price changes. Positive values indicate upward momentum.",
          }}
          loading={loading}
        >
          <Text
            size={Size.Small}
            weight="semibold"
            style={{ color: getScoreColor(metrics?.momentumScore ?? 0) }}
          >
            {(metrics?.momentumScore ?? 0) > 0 ? "+" : ""}
            {metrics?.momentumScore ?? 0}
          </Text>
        </MetricRow>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Exchange Dominance by Region */}
        <View style={styles.dominanceSection}>
          <View style={styles.dominanceHeader}>
            <Icon name="globe" size={Size.Small} color={Colors.text.muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Exchange Dominance
            </Text>
            <HintIndicator
              id="metric-exchange-dominance"
              title="Exchange Dominance"
              content="Shows the dominant exchange for this asset by region. Useful for choosing which server to trade on for best liquidity."
              inline
              priority={50}
            />
          </View>
          {loading || dominanceLoading ? (
            <View style={styles.dominanceLoading}>
              <Skeleton width="100%" height={40} />
              <Skeleton width="100%" height={40} />
              <Skeleton width="100%" height={40} />
            </View>
          ) : dominanceError ? (
            <View style={styles.dominanceError}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Unable to load exchange data
              </Text>
            </View>
          ) : exchangeDominance?.regions && exchangeDominance.regions.length > 0 ? (
            <View style={styles.dominanceList}>
              {exchangeDominance.regions.map((region) => (
                <ExchangeDominanceRow key={region.region} region={region} />
              ))}
            </View>
          ) : (
            <View style={styles.dominanceEmpty}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                No exchange data available
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  metricLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rankBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  supplyProgress: {
    alignItems: "flex-end",
    gap: 4,
    minWidth: 80,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: spacing.xs,
  },
  signalSection: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  signalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeFallback: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  directionValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  volatilityValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  volatilityBar: {
    width: 40,
  },
  progressBarContainer: {
    width: "100%",
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  // Exchange Dominance styles
  dominanceSection: {
    gap: spacing.sm,
  },
  dominanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dominanceLoading: {
    gap: spacing.xs,
  },
  dominanceList: {
    gap: spacing.xs,
  },
  dominanceError: {
    padding: spacing.sm,
    alignItems: "center",
  },
  dominanceEmpty: {
    padding: spacing.sm,
    alignItems: "center",
  },
  dominanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  dominanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dominanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dominanceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dominanceBarContainer: {
    width: 50,
  },
});
