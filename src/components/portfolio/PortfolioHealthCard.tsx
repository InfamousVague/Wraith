/**
 * @file PortfolioHealthCard.tsx
 * @description Card component displaying portfolio health metrics and risk status.
 *
 * Shows:
 * - Health score (0-100) with visual gauge
 * - Risk level badge (low/medium/high/critical)
 * - Current drawdown percentage with progress bar
 * - Warning/critical banners when approaching limits
 * - Peak value and distance from peak
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Icon, ProgressBar, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useTradingSettings } from "../../hooks/useTradingSettings";
import { spacing, radii } from "../../styles/tokens";

/**
 * Risk level classification
 */
type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Props for PortfolioHealthCard
 */
export type PortfolioHealthCardProps = {
  /** Current portfolio value */
  currentValue?: number;
  /** Peak portfolio value achieved */
  peakValue?: number;
  /** Timestamp of peak value */
  peakDate?: number;
  /** Starting/initial portfolio balance */
  initialBalance?: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Compact display mode */
  compact?: boolean;
};

/**
 * Calculate health score based on drawdown and settings
 */
function calculateHealthScore(
  currentDrawdownPercent: number,
  maxDrawdownPercent: number
): number {
  if (maxDrawdownPercent <= 0) return 100;
  const score = 100 - (currentDrawdownPercent / maxDrawdownPercent) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine risk level based on health score
 */
function getRiskLevel(healthScore: number): RiskLevel {
  if (healthScore >= 80) return "low";
  if (healthScore >= 60) return "medium";
  if (healthScore >= 40) return "high";
  return "critical";
}

/**
 * Get color for risk level
 */
function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return Colors.status.success;
    case "medium":
      return Colors.status.warning;
    case "high":
      return "#ff8c00"; // Orange
    case "critical":
      return Colors.status.danger;
  }
}

/**
 * Get background color for risk level
 */
function getRiskBackgroundColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return Colors.status.successSurface;
    case "medium":
      return Colors.status.warningSurface;
    case "high":
      return "rgba(255, 140, 0, 0.15)";
    case "critical":
      return Colors.status.dangerSurface;
  }
}

/**
 * Get label for risk level
 */
function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "Low Risk";
    case "medium":
      return "Medium Risk";
    case "high":
      return "High Risk";
    case "critical":
      return "Critical Risk";
  }
}

/**
 * Get icon for risk level
 */
function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "shield-check";
    case "medium":
      return "alert-circle";
    case "high":
      return "alert-triangle";
    case "critical":
      return "alert-octagon";
  }
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format relative date
 */
function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Portfolio health card showing risk metrics and drawdown status.
 */
export function PortfolioHealthCard({
  currentValue = 0,
  peakValue = 0,
  peakDate,
  initialBalance = 100000,
  loading = false,
  error = null,
  compact = false,
}: PortfolioHealthCardProps) {
  const { settings, isApproachingLimit, isAtLimit } = useTradingSettings();
  const { drawdownProtection } = settings;

  // Calculate current drawdown from peak
  const currentDrawdownPercent = useMemo(() => {
    if (peakValue <= 0) return 0;
    const drawdown = ((peakValue - currentValue) / peakValue) * 100;
    return Math.max(0, drawdown);
  }, [currentValue, peakValue]);

  // Calculate health score
  const healthScore = useMemo(() => {
    return calculateHealthScore(
      currentDrawdownPercent,
      drawdownProtection.maxDrawdownPercent
    );
  }, [currentDrawdownPercent, drawdownProtection.maxDrawdownPercent]);

  // Determine risk level
  const riskLevel = useMemo(() => getRiskLevel(healthScore), [healthScore]);
  const riskColor = getRiskColor(riskLevel);
  const riskBgColor = getRiskBackgroundColor(riskLevel);
  const riskLabel = getRiskLabel(riskLevel);
  const riskIcon = getRiskIcon(riskLevel);

  // Calculate from peak percentage
  const fromPeakPercent = useMemo(() => {
    if (peakValue <= 0 || currentValue <= 0) return 0;
    return ((currentValue - peakValue) / peakValue) * 100;
  }, [currentValue, peakValue]);

  // Calculate drawdown progress (0-1 scale for progress bar)
  const drawdownProgress = useMemo(() => {
    if (drawdownProtection.maxDrawdownPercent <= 0) return 0;
    return Math.min(1, currentDrawdownPercent / drawdownProtection.maxDrawdownPercent);
  }, [currentDrawdownPercent, drawdownProtection.maxDrawdownPercent]);

  // Loading state
  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Skeleton width={120} height={20} />
            <Skeleton width={60} height={32} style={{ borderRadius: 16 }} />
          </View>
          <View style={styles.scoreSection}>
            <Skeleton width={80} height={80} style={{ borderRadius: 40 }} />
          </View>
          <Skeleton width="100%" height={8} style={{ borderRadius: 4 }} />
          <View style={styles.statsRow}>
            <Skeleton width={100} height={40} />
            <Skeleton width={100} height={40} />
          </View>
        </View>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card style={styles.card}>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={Size.Large} color={Colors.status.danger} />
            <Text size={Size.Medium} appearance={TextAppearance.Danger}>
              {error}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  // Compact variant
  if (compact) {
    return (
      <Card style={styles.cardCompact}>
        <View style={styles.contentCompact}>
          <View style={styles.compactRow}>
            {/* Health Score */}
            <View style={[styles.scoreBadge, { backgroundColor: riskBgColor }]}>
              <Text size={Size.Large} weight="bold" style={{ color: riskColor }}>
                {Math.round(healthScore)}
              </Text>
            </View>

            {/* Risk Badge */}
            <View style={[styles.riskBadgeCompact, { backgroundColor: riskBgColor }]}>
              <Icon name={riskIcon} size={Size.ExtraSmall} color={riskColor} />
              <Text size={Size.ExtraSmall} weight="medium" style={{ color: riskColor }}>
                {riskLabel}
              </Text>
            </View>

            {/* Drawdown */}
            <View style={styles.compactStat}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Drawdown
              </Text>
              <Text
                size={Size.Small}
                weight="bold"
                style={{ color: currentDrawdownPercent > 0 ? Colors.status.danger : Colors.text.primary }}
              >
                -{currentDrawdownPercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  // Full variant
  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text size={Size.Medium} weight="bold">
            Portfolio Health
          </Text>
          <View style={[styles.scoreBadgeLarge, { backgroundColor: riskBgColor }]}>
            <Text size={Size.ExtraLarge} weight="bold" style={{ color: riskColor }}>
              {Math.round(healthScore)}
            </Text>
          </View>
        </View>

        {/* Risk Level Badge */}
        <View style={[styles.riskBadge, { backgroundColor: riskBgColor }]}>
          <Icon name={riskIcon} size={Size.Small} color={riskColor} />
          <Text size={Size.Small} weight="medium" style={{ color: riskColor }}>
            {riskLabel}
          </Text>
        </View>

        {/* Warning Banner */}
        {isApproachingLimit && !isAtLimit && drawdownProtection.enabled && (
          <View style={[styles.warningBanner, { backgroundColor: Colors.status.warningSurface }]}>
            <Icon name="alert-triangle" size={Size.Small} color={Colors.status.warning} />
            <Text size={Size.Small} style={{ color: Colors.status.warning, flex: 1 }}>
              Approaching drawdown limit ({drawdownProtection.warningThresholdPercent}% of max)
            </Text>
          </View>
        )}

        {/* Critical Banner */}
        {isAtLimit && drawdownProtection.enabled && (
          <View style={[styles.criticalBanner, { backgroundColor: Colors.status.dangerSurface }]}>
            <Icon name="alert-octagon" size={Size.Small} color={Colors.status.danger} />
            <Text size={Size.Small} style={{ color: Colors.status.danger, flex: 1 }}>
              Drawdown limit reached - Trading paused
            </Text>
          </View>
        )}

        {/* Drawdown Section */}
        <View style={styles.drawdownSection}>
          <View style={styles.drawdownHeader}>
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              Current Drawdown
            </Text>
            <Text
              size={Size.Medium}
              weight="bold"
              style={{ color: currentDrawdownPercent > 0 ? Colors.status.danger : Colors.text.primary }}
            >
              -{currentDrawdownPercent.toFixed(2)}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={drawdownProgress}
              size={Size.Small}
              appearance={
                riskLevel === "critical"
                  ? TextAppearance.Danger
                  : riskLevel === "high"
                  ? TextAppearance.Warning
                  : TextAppearance.Primary
              }
            />
            {/* Max threshold marker */}
            <View style={styles.thresholdMarker}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                Max: {drawdownProtection.maxDrawdownPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Peak Value */}
          <View style={styles.statItem}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Peak Value
            </Text>
            <Text size={Size.Medium} weight="bold">
              {formatCurrency(peakValue)}
            </Text>
            {peakDate && (
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                {formatRelativeDate(peakDate)}
              </Text>
            )}
          </View>

          {/* From Peak */}
          <View style={styles.statItem}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              From Peak
            </Text>
            <Text
              size={Size.Medium}
              weight="bold"
              style={{
                color: fromPeakPercent >= 0 ? Colors.status.success : Colors.status.danger,
              }}
            >
              {fromPeakPercent >= 0 ? "+" : ""}
              {fromPeakPercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Protection Status */}
        {!drawdownProtection.enabled && (
          <View style={styles.protectionDisabled}>
            <Icon name="shield-off" size={Size.ExtraSmall} color={Colors.text.muted} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Drawdown protection disabled
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  cardCompact: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  contentCompact: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreBadgeLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  riskBadgeCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  compactStat: {
    gap: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  criticalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  drawdownSection: {
    gap: spacing.sm,
  },
  drawdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressContainer: {
    gap: spacing.xs,
  },
  thresholdMarker: {
    alignItems: "flex-end",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  protectionDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  errorContainer: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
