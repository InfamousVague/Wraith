/**
 * @file DeveloperSettingsSection.tsx
 * @description Settings section for developer tools including the Random Auto Trader (RAT).
 *
 * Includes:
 * - RAT enable/disable toggle
 * - Trading statistics display (trades, win rate, P&L)
 * - Configurable trade interval
 * - Max open positions setting
 * - Advanced settings (collapsible)
 */

import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Toggle, Slider, Icon, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance, Shape } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useRat } from "../../hooks/useRat";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { usePortfolio } from "../../hooks/usePortfolio";
import { spacing, radii } from "../../styles/tokens";
import type { RatStatus } from "../../types/rat";

// Status colors
const STATUS_COLORS: Record<RatStatus, string> = {
  idle: Colors.text.muted,
  active: Colors.status.success,
  stopping: Colors.status.warning,
  error: Colors.status.danger,
};

const STATUS_LABELS: Record<RatStatus, string> = {
  idle: "Idle",
  active: "Active",
  stopping: "Stopping...",
  error: "Error",
};

/**
 * Format currency value with appropriate precision
 */
function formatPnl(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  if (Math.abs(value) >= 1000) {
    return `${prefix}$${(value / 1000).toFixed(1)}k`;
  }
  return `${prefix}$${value.toFixed(2)}`;
}

/**
 * Settings section for developer tools including the Random Auto Trader (RAT).
 */
export function DeveloperSettingsSection() {
  const { isMobile } = useBreakpoint();
  const themeColors = useThemeColors();
  const { portfolioId } = usePortfolio();
  const {
    config,
    stats,
    status,
    openPositions,
    isLoading,
    error,
    isActive,
    winRate,
    start,
    stop,
    updateConfig,
  } = useRat();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localInterval, setLocalInterval] = useState(config.tradeIntervalSecs);
  const [localMaxPositions, setLocalMaxPositions] = useState(config.maxOpenPositions);

  // Debounce timers for slider updates
  const intervalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when config changes
  useEffect(() => {
    setLocalInterval(config.tradeIntervalSecs);
    setLocalMaxPositions(config.maxOpenPositions);
  }, [config.tradeIntervalSecs, config.maxOpenPositions]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (intervalTimerRef.current) clearTimeout(intervalTimerRef.current);
      if (positionsTimerRef.current) clearTimeout(positionsTimerRef.current);
    };
  }, []);

  const handleToggle = async () => {
    try {
      if (isActive) {
        await stop();
      } else {
        await start();
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleIntervalChange = (value: number) => {
    setLocalInterval(value);
    // Debounce API update
    if (intervalTimerRef.current) clearTimeout(intervalTimerRef.current);
    intervalTimerRef.current = setTimeout(async () => {
      if (value !== config.tradeIntervalSecs) {
        await updateConfig({ tradeIntervalSecs: value });
      }
    }, 500);
  };

  const handleMaxPositionsChange = (value: number) => {
    setLocalMaxPositions(value);
    // Debounce API update
    if (positionsTimerRef.current) clearTimeout(positionsTimerRef.current);
    positionsTimerRef.current = setTimeout(async () => {
      if (value !== config.maxOpenPositions) {
        await updateConfig({ maxOpenPositions: value });
      }
    }, 500);
  };

  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];
  const hasPortfolio = !!portfolioId;

  return (
    <View style={styles.section}>
      <Text
        size={Size.Medium}
        appearance={TextAppearance.Muted}
        style={styles.sectionTitle}
      >
        Developer Tools
      </Text>

      <Card style={styles.card} fullBleed={isMobile}>
        <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
          {/* Error display */}
          {error && (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={Size.Small} color={Colors.status.danger} />
              <Text size={Size.Small} style={{ color: Colors.status.danger }}>
                {error}
              </Text>
            </View>
          )}

          {/* No portfolio warning */}
          {!hasPortfolio && (
            <View style={styles.warningBanner}>
              <Icon name="alert-triangle" size={Size.Small} color={Colors.status.warning} />
              <Text size={Size.Small} style={{ color: Colors.status.warning }}>
                Select a portfolio to use developer tools
              </Text>
            </View>
          )}

          {/* RAT Header with Toggle */}
          <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
            <View style={styles.settingInfo}>
              <View style={styles.titleRow}>
                <Text size={Size.Medium} weight="medium">
                  Random Auto Trader
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text size={Size.TwoXSmall} style={{ color: statusColor }}>
                    {statusLabel}
                  </Text>
                </View>
              </View>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Automatically generate random trades for UI testing
              </Text>
            </View>
            <Toggle
              value={isActive}
              onValueChange={handleToggle}
              size={Size.Medium}
              disabled={isLoading || !hasPortfolio}
            />
          </View>

          {/* Stats Grid - Only show when there's data */}
          {(stats.totalTrades > 0 || isActive) && (
            <>
              <View style={styles.divider} />
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Total Trades
                  </Text>
                  <AnimatedNumber
                    value={stats.totalTrades}
                    decimals={0}
                    size={Size.Large}
                    weight="semibold"
                    animate
                    animationDuration={300}
                  />
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Win Rate
                  </Text>
                  <View style={styles.statValue}>
                    <AnimatedNumber
                      value={winRate}
                      decimals={1}
                      size={Size.Large}
                      weight="semibold"
                      animate
                      animationDuration={300}
                    />
                    <Text size={Size.Large} weight="semibold" appearance={TextAppearance.Muted}>
                      %
                    </Text>
                  </View>
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Total P&L
                  </Text>
                  <Text
                    size={Size.Large}
                    weight="semibold"
                    style={{
                      color: stats.totalPnl >= 0 ? Colors.status.success : Colors.status.danger,
                    }}
                  >
                    {formatPnl(stats.totalPnl)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Open Positions
                  </Text>
                  <AnimatedNumber
                    value={openPositions}
                    decimals={0}
                    size={Size.Large}
                    weight="semibold"
                    animate
                    animationDuration={300}
                  />
                </View>
                <View style={styles.statItem}>
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    Errors
                  </Text>
                  <AnimatedNumber
                    value={stats.errors}
                    decimals={0}
                    size={Size.Large}
                    weight="semibold"
                    animate
                    animationDuration={300}
                    style={{ color: stats.errors > 0 ? Colors.status.danger : undefined }}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Trade Interval Slider */}
          <View style={styles.settingBlock}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text
                  size={Size.Medium}
                  weight="medium"
                  appearance={!hasPortfolio ? TextAppearance.Muted : undefined}
                >
                  Trade Interval
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Time between random trade actions
                </Text>
              </View>
              <View style={styles.valueDisplay}>
                <Text size={Size.Large} weight="semibold">
                  {localInterval}
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  sec
                </Text>
              </View>
            </View>
            <Slider
              min={10}
              max={300}
              step={5}
              value={310 - localInterval}
              onChange={(v) => handleIntervalChange(310 - v)}
              disabled={!hasPortfolio}
              style={styles.slider}
            />
            <View style={styles.sliderLabels}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                300s (Slow)
              </Text>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                10s (Fast)
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Max Open Positions Slider */}
          <View style={styles.settingBlock}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text
                  size={Size.Medium}
                  weight="medium"
                  appearance={!hasPortfolio ? TextAppearance.Muted : undefined}
                >
                  Max Open Positions
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Maximum simultaneous positions allowed
                </Text>
              </View>
              <View style={styles.valueDisplay}>
                <Text size={Size.Large} weight="semibold">
                  {localMaxPositions}
                </Text>
              </View>
            </View>
            <Slider
              min={1}
              max={20}
              step={1}
              value={localMaxPositions}
              onChange={handleMaxPositionsChange}
              disabled={!hasPortfolio}
              style={styles.slider}
            />
            <View style={styles.sliderLabels}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                1
              </Text>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                20
              </Text>
            </View>
          </View>

          {/* Advanced Settings Toggle */}
          <View style={styles.divider} />
          <Pressable
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text size={Size.Small} appearance={TextAppearance.Muted}>
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Text>
            <Icon
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              size={Size.Small}
              color={themeColors.text.muted}
            />
          </Pressable>

          {/* Advanced Settings */}
          {showAdvanced && (
            <View style={styles.advancedSection}>
              <View style={styles.advancedRow}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Min Hold Time
                </Text>
                <Text size={Size.Small}>
                  {config.minHoldTimeSecs}s
                </Text>
              </View>
              <View style={styles.advancedRow}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Position Size Range
                </Text>
                <Text size={Size.Small}>
                  {(config.sizeRangePct[0] * 100).toFixed(0)}% - {(config.sizeRangePct[1] * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.advancedRow}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Stop Loss Probability
                </Text>
                <Text size={Size.Small}>
                  {(config.stopLossProbability * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.advancedRow}>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Take Profit Probability
                </Text>
                <Text size={Size.Small}>
                  {(config.takeProfitProbability * 100).toFixed(0)}%
                </Text>
              </View>
              {stats.errors > 0 && (
                <View style={styles.advancedRow}>
                  <Text size={Size.Small} appearance={TextAppearance.Muted}>
                    Errors
                  </Text>
                  <Text size={Size.Small} style={{ color: Colors.status.danger }}>
                    {stats.errors}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
  },
  cardContentMobile: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: `${Colors.status.danger}15`,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: `${Colors.status.warning}15`,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  settingRowMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: 80,
    gap: 4,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  settingBlock: {
    gap: spacing.sm,
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  slider: {
    marginTop: spacing.xs,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xxs,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  advancedSection: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  advancedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
