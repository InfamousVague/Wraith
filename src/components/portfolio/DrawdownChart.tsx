/**
 * @file DrawdownChart.tsx
 * @description Chart component showing drawdown history over time.
 *
 * Features:
 * - Area chart showing drawdown percentage over time
 * - Time range selector (1D, 1W, 1M, 3M, ALL)
 * - Threshold line at max drawdown setting
 * - Warning zone shading
 * - Tooltips on hover/touch
 */

import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Icon, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useTradingSettings } from "../../hooks/useTradingSettings";
import { hauntClient, type DrawdownHistoryPoint, type DrawdownHistoryRange } from "../../services/haunt";
import { useAuth } from "../../context/AuthContext";
import { spacing, radii } from "../../styles/tokens";

/**
 * Props for DrawdownChart
 */
export type DrawdownChartProps = {
  /** Portfolio ID to fetch data for */
  portfolioId: string;
  /** Chart height in pixels */
  height?: number;
  /** Whether to show the max threshold line */
  showThreshold?: boolean;
  /** Whether to show the time range selector */
  showTimeRangeSelector?: boolean;
};

/**
 * Time range options
 */
const TIME_RANGES: { value: DrawdownHistoryRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "all", label: "ALL" },
];

/**
 * Format timestamp for tooltip
 */
function formatTooltipDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format currency for tooltip
 */
function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Simple SVG-based drawdown visualization
 * In a production app, this would use a charting library like lightweight-charts
 */
function DrawdownVisualization({
  data,
  maxDrawdownPercent,
  warningThresholdPercent,
  height,
  showThreshold,
}: {
  data: DrawdownHistoryPoint[];
  maxDrawdownPercent: number;
  warningThresholdPercent: number;
  height: number;
  showThreshold: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate chart dimensions
  const padding = { top: 20, right: 10, bottom: 30, left: 50 };
  const chartWidth = 100; // percentage based
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const { minDrawdown, maxDrawdown, points } = useMemo(() => {
    if (data.length === 0) {
      return { minDrawdown: 0, maxDrawdown: maxDrawdownPercent, points: [] };
    }

    const drawdowns = data.map((d) => d.drawdownPercent);
    const min = 0; // Always start from 0
    const max = Math.max(maxDrawdownPercent, ...drawdowns) * 1.1; // Add 10% padding

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = (d.drawdownPercent / max) * chartHeight;
      return { x, y, data: d };
    });

    return { minDrawdown: min, maxDrawdown: max, points };
  }, [data, maxDrawdownPercent, chartHeight]);

  // Generate path for the area chart
  const areaPath = useMemo(() => {
    if (points.length < 2) return "";

    const pathParts = points.map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd} ${p.x} ${p.y}`;
    });

    // Close the path at the bottom
    pathParts.push(`L ${points[points.length - 1].x} ${chartHeight}`);
    pathParts.push(`L ${points[0].x} ${chartHeight}`);
    pathParts.push("Z");

    return pathParts.join(" ");
  }, [points, chartHeight]);

  // Generate path for the line
  const linePath = useMemo(() => {
    if (points.length < 2) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

  // Threshold line Y position
  const thresholdY = (maxDrawdownPercent / maxDrawdown) * chartHeight;
  const warningY = ((maxDrawdownPercent * warningThresholdPercent) / 100 / maxDrawdown) * chartHeight;

  if (data.length === 0) {
    return (
      <View style={[styles.chartPlaceholder, { height }]}>
        <Icon name="trending-down" size={Size.ExtraLarge} color={Colors.text.muted} />
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          No drawdown history yet
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height, position: "relative" }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {/* Warning zone */}
        {showThreshold && (
          <rect
            x="0"
            y={warningY}
            width="100"
            height={thresholdY - warningY}
            fill={Colors.status.warning}
            fillOpacity={0.1}
          />
        )}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#drawdownGradient)"
          transform={`translate(0, ${padding.top})`}
        />

        {/* Line */}
        <path
          d={linePath}
          stroke={Colors.status.danger}
          strokeWidth={2}
          fill="none"
          transform={`translate(0, ${padding.top})`}
          vectorEffect="non-scaling-stroke"
        />

        {/* Threshold line */}
        {showThreshold && (
          <>
            <line
              x1="0"
              y1={thresholdY + padding.top}
              x2="100"
              y2={thresholdY + padding.top}
              stroke={Colors.status.danger}
              strokeWidth={1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x="2"
              y={thresholdY + padding.top - 4}
              fill={Colors.status.danger}
              fontSize="10"
            >
              Max {maxDrawdownPercent}%
            </text>
          </>
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={Colors.status.danger} stopOpacity={0.4} />
            <stop offset="100%" stopColor={Colors.status.danger} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        <text x="0" y={padding.top - 5} fill={Colors.text.muted} fontSize="10">
          0%
        </text>
        <text
          x="0"
          y={chartHeight + padding.top + 10}
          fill={Colors.text.muted}
          fontSize="10"
        >
          -{maxDrawdown.toFixed(0)}%
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <View
          style={[
            styles.tooltip,
            {
              left: `${points[hoveredIndex].x}%`,
              top: points[hoveredIndex].y + padding.top,
            },
          ]}
        >
          <Text size={Size.ExtraSmall}>
            {formatTooltipDate(points[hoveredIndex].data.timestamp)}
          </Text>
          <Text size={Size.Small} weight="bold" style={{ color: Colors.status.danger }}>
            -{points[hoveredIndex].data.drawdownPercent.toFixed(2)}%
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {formatTooltipValue(points[hoveredIndex].data.portfolioValue)}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Drawdown chart showing historical drawdown over time.
 */
export function DrawdownChart({
  portfolioId,
  height = 200,
  showThreshold = true,
  showTimeRangeSelector = true,
}: DrawdownChartProps) {
  const { sessionToken } = useAuth();
  const { settings } = useTradingSettings();
  const { drawdownProtection } = settings;

  const [range, setRange] = useState<DrawdownHistoryRange>("1m");
  const [data, setData] = useState<DrawdownHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch drawdown history
  useEffect(() => {
    if (!sessionToken || !portfolioId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await hauntClient.getDrawdownHistory(
          sessionToken,
          portfolioId,
          range
        );
        setData(response.data);
      } catch (err) {
        console.warn("[DrawdownChart] Failed to fetch history:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        // Use empty data on error for now
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionToken, portfolioId, range]);

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text size={Size.Medium} weight="bold">
            Drawdown History
          </Text>

          {/* Time Range Selector */}
          {showTimeRangeSelector && (
            <View style={styles.rangeSelector}>
              {TIME_RANGES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[
                    styles.rangeButton,
                    range === r.value && styles.rangeButtonActive,
                  ]}
                  onPress={() => setRange(r.value)}
                >
                  <Text
                    size={Size.ExtraSmall}
                    weight={range === r.value ? "bold" : "medium"}
                    style={range === r.value ? { color: Colors.accent.primary } : undefined}
                    appearance={range !== r.value ? TextAppearance.Muted : undefined}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Chart Area */}
        {loading ? (
          <View style={[styles.chartPlaceholder, { height }]}>
            <Skeleton width="100%" height={height - 40} />
          </View>
        ) : error ? (
          <View style={[styles.chartPlaceholder, { height }]}>
            <Icon name="alert-circle" size={Size.Large} color={Colors.status.danger} />
            <Text size={Size.Small} appearance={TextAppearance.Danger}>
              {error}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
              }}
            >
              <Text size={Size.Small} appearance={TextAppearance.Link}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <DrawdownVisualization
            data={data}
            maxDrawdownPercent={drawdownProtection.maxDrawdownPercent}
            warningThresholdPercent={drawdownProtection.warningThresholdPercent}
            height={height}
            showThreshold={showThreshold}
          />
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.status.danger }]} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Drawdown
            </Text>
          </View>
          {showThreshold && (
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: Colors.status.danger, opacity: 0.5 },
                ]}
              />
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Max Threshold ({drawdownProtection.maxDrawdownPercent}%)
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
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rangeSelector: {
    flexDirection: "row",
    gap: spacing.xxs,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: radii.sm,
    padding: 2,
  },
  rangeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm - 2,
  },
  rangeButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  chartPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: radii.md,
  },
  retryButton: {
    padding: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: radii.sm,
    padding: spacing.sm,
    transform: [{ translateX: -50 }, { translateY: -100 }],
  },
});
