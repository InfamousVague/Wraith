import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, AnimatedNumber, Icon, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { hauntClient, type ApiStats } from "../services/haunt";

// Format uptime as human-readable string
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

type StatRowProps = {
  icon: string;
  label: string;
  value: React.ReactNode;
  color?: string;
};

const StatRow = React.memo(function StatRow({ icon, label, value, color }: StatRowProps) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabel}>
        <Icon name={icon as any} size={Size.Small} color={color || themeColors.text.muted} />
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <View style={styles.statValue}>{value}</View>
    </View>
  );
});

type ApiStatsCardProps = {
  loading?: boolean;
  pollInterval?: number;
};

export function ApiStatsCard({
  loading = false,
  pollInterval = 2000,
}: ApiStatsCardProps) {
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
  }, []);

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

  // Get health color based on score
  const getHealthColor = (score: number) => {
    if (score >= 80) return "#22C55E"; // Green
    if (score >= 50) return "#EAB308"; // Yellow
    return "#EF4444"; // Red
  };

  const healthColor = getHealthColor(healthScore);

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            API STATISTICS
          </Text>
          <View style={[styles.badge, { backgroundColor: `${healthColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
            <Text size={Size.TwoXSmall} style={{ color: healthColor }}>
              {stats?.onlineSources || 0}/{stats?.totalSources || 0} Online
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color="#FF5C7A" />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              API Offline
            </Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* TPS (Transactions Per Second) */}
            <StatRow
              icon="zap"
              label="Throughput"
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
                    {" "}TPS
                  </Text>
                </View>
              }
              color="#F59E0B"
            />

            {/* Latency */}
            <StatRow
              icon="activity"
              label="Latency"
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
                    {" "}ms
                  </Text>
                </View>
              }
              color={latency < 100 ? "#22C55E" : latency < 300 ? "#EAB308" : "#EF4444"}
            />

            {/* Active Symbols */}
            <StatRow
              icon="layers"
              label="Tracked Assets"
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
              color="#8B5CF6"
            />

            {/* Total Updates */}
            <StatRow
              icon="database"
              label="Total Updates"
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
              color="#06B6D4"
            />

            {/* Uptime */}
            <StatRow
              icon="clock"
              label="Uptime"
              value={
                <Text size={Size.Small} weight="semibold">
                  {formatUptime(stats?.uptimeSecs || 0)}
                </Text>
              }
              color="#10B981"
            />

            {/* Health Score Progress */}
            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  System Health
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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    marginBottom: 16,
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
  statsContainer: {
    flex: 1,
    gap: 14,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "baseline",
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
    marginTop: 8,
    gap: 8,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
