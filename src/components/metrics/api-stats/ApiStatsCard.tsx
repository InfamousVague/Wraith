import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, AnimatedNumber, Icon, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useApiServer } from "../../../context/ApiServerContext";
import { type ApiStats } from "../../../services/haunt";
import { StatRow } from "./StatRow";
import { formatUptime, getHealthColor } from "./utils/formatters";
import type { ApiStatsCardProps } from "./types";

export function ApiStatsCard({
  loading = false,
  pollInterval = 2000,
}: ApiStatsCardProps) {
  const { t } = useTranslation("components");
  const { hauntClient } = useApiServer();
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const themeColors = useThemeColors();

  const fetchStats = useCallback(async () => {
    const startTime = performance.now();
    try {
      const response = await hauntClient.getStats();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [hauntClient]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStats, pollInterval]);

  const showLoading = loading || isLoading;

  // Calculate health score based on online sources
  const healthScore = stats
    ? Math.round((stats.onlineSources / stats.totalSources) * 100)
    : 0;

  const healthColor = getHealthColor(healthScore);

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {t("apiStats.title")}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${healthColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
            <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
              {t("apiStats.online", { online: stats?.onlineSources || 0, total: stats?.totalSources || 0 })}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color={Colors.status.danger} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              {t("apiStats.apiOffline")}
            </Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* TPS (Transactions Per Second) */}
            <StatRow
              icon="zap"
              label={t("apiStats.throughput")}
              value={
                <View style={styles.tpsValue}>
                  <AnimatedNumber
                    value={stats?.tps || 0}
                    decimals={1}
                    size={Size.Small}
                    weight="semibold"
                    animate
                    animationDuration={200}
                  />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    {" "}{t("apiStats.tps")}
                  </Text>
                </View>
              }
              color={Colors.data.amber}
            />

            {/* Latency */}
            <StatRow
              icon="activity"
              label={t("apiStats.latency")}
              value={
                <View style={styles.latencyValue}>
                  <AnimatedNumber
                    value={latency}
                    decimals={0}
                    size={Size.Small}
                    weight="semibold"
                    animate
                    animationDuration={200}
                  />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    {" "}{t("apiStats.ms")}
                  </Text>
                </View>
              }
              color={latency < 100 ? Colors.status.success : latency < 300 ? Colors.status.warning : Colors.status.danger}
            />

            {/* Active Symbols */}
            <StatRow
              icon="layers"
              label={t("apiStats.trackedAssets")}
              value={
                <AnimatedNumber
                  value={stats?.activeSymbols || 0}
                  decimals={0}
                  separator=","
                  size={Size.Small}
                  weight="semibold"
                  animate
                  animationDuration={200}
                />
              }
              color={Colors.data.violet}
            />

            {/* Total Updates */}
            <StatRow
              icon="database"
              label={t("apiStats.totalUpdates")}
              value={
                <AnimatedNumber
                  value={stats?.totalUpdates || 0}
                  decimals={0}
                  separator=","
                  size={Size.Small}
                  weight="semibold"
                  appearance={TextAppearance.Info}
                  brightness={Brightness.Soft}
                  animate
                  animationDuration={200}
                />
              }
              color={Colors.data.cyan}
            />

            {/* Uptime */}
            <StatRow
              icon="clock"
              label={t("apiStats.uptime")}
              value={
                <Text size={Size.Small} weight="semibold">
                  {formatUptime(stats?.uptimeSecs || 0)}
                </Text>
              }
              color={Colors.data.emerald}
            />

            {/* Health Score Progress */}
            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {t("apiStats.systemHealth")}
                </Text>
                <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
                  {healthScore}%
                </Text>
              </View>
              <ProgressBar
                value={healthScore}
                max={100}
                size={Size.ExtraSmall}
                color={healthColor}
                brightness={Brightness.Soft}
              />
            </View>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.lg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
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
  statsContainer: {
    flex: 1,
    gap: 14,
  },
  tpsValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  latencyValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  healthSection: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
