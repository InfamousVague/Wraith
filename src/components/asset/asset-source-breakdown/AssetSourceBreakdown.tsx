/**
 * @file AssetSourceBreakdown.tsx
 * @description Data quality card showing price source breakdown and confidence score.
 *
 * ## Features:
 * - Half-circle gauge visualization of confidence score (0-100)
 * - Color-coded score levels (excellent/good/fair/low/veryLow)
 * - Stats row: source count, total updates, data points
 * - Per-source progress bars showing update distribution
 * - Exchange brand colors for visual source identification
 * - Offline source detection with skull icon indicator
 * - Auto-polling for real-time updates (default: 5 seconds)
 * - Responsive mobile/desktop layouts
 *
 * ## Props:
 * - `symbol`: Asset symbol to fetch source stats for
 * - `loading`: Optional external loading state
 * - `pollInterval`: Optional polling interval in ms (default: 5000)
 *
 * ## API Calls:
 * - `hauntClient.getSymbolSourceStats(symbol)` - Source update counts
 * - `hauntClient.getConfidence(symbol)` - Confidence score and data points
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { hauntClient, type SymbolSourceStat, type ConfidenceResponse } from "../../../services/haunt";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipMetric,
  TooltipListItem,
} from "../../ui/hint-indicator";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { HalfCircleGauge } from "./HalfCircleGauge";
import { SourceRow } from "./SourceRow";
import { getScoreColor, getScoreLabelKey } from "./utils/scoreHelpers";
import type { AssetSourceBreakdownProps } from "./types";

export function AssetSourceBreakdown({
  symbol,
  loading = false,
  pollInterval = 5000, // Poll every 5 seconds
}: AssetSourceBreakdownProps) {
  const { t } = useTranslation("components");
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

  const { isMobile } = useBreakpoint();
  const showLoading = loading || isLoading;
  const score = confidence?.confidence.score ?? 0;
  const scoreColor = getScoreColor(score);
  const scoreLabelKey = getScoreLabelKey(score);
  const scoreLabel = t(`dataQuality.levels.${scoreLabelKey}`);

  return (
    <Card style={styles.card} loading={showLoading} fullBleed={isMobile}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Header with hint */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.headerLabel}>
              {t("dataQuality.title")}
            </Text>
            <HintIndicator
              id="data-quality-hint"
              title={t("dataQuality.hint.title")}
              icon="?"
              color={Colors.accent.primary}
              priority={15}
              width={400}
              inline
            >
              <TooltipContainer>
                <TooltipText>
                  Measures how reliable the price data is for accurate analysis.
                </TooltipText>
                <TooltipSection title="Quality Factors">
                  <TooltipListItem icon="database" color={Colors.data.violet}>
                    Source diversity — more exchanges = better accuracy
                  </TooltipListItem>
                  <TooltipListItem icon="refresh-cw" color={Colors.data.cyan}>
                    Update frequency — how often prices refresh
                  </TooltipListItem>
                  <TooltipListItem icon="clock" color={Colors.data.amber}>
                    Data recency — how fresh the latest update is
                  </TooltipListItem>
                  <TooltipListItem icon="check-circle" color={Colors.data.emerald}>
                    Price consistency — agreement across sources
                  </TooltipListItem>
                </TooltipSection>
                <TooltipSection title="Score Levels">
                  <TooltipMetric label="80-100" value="Excellent — highly reliable" valueColor={Colors.status.success} />
                  <TooltipMetric label="60-79" value="Good — reliable" valueColor={Colors.data.emerald} />
                  <TooltipMetric label="40-59" value="Fair — use with caution" valueColor={Colors.data.amber} />
                  <TooltipMetric label="0-39" value="Low — limited reliability" valueColor={Colors.status.danger} />
                </TooltipSection>
              </TooltipContainer>
            </HintIndicator>
          </View>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {t("dataQuality.subtitle", { symbol: symbol?.toUpperCase() ?? "—" })}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color={Colors.status.danger} />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              {t("dataQuality.unableToLoad")}
            </Text>
          </View>
        ) : (
          <>
            {/* Confidence Half-Circle Gauge */}
            <View style={styles.gaugeSection}>
              <HalfCircleGauge
                score={score}
                color={scoreColor}
                label={scoreLabel}
                mutedColor={themeColors.text.muted}
                trackColor={themeColors.border.subtle}
              />
            </View>

            {/* Stats row */}
            <View style={[styles.statsRow, { backgroundColor: themeColors.background.secondary }]}>
              <View style={styles.statItem}>
                <Text size={Size.Small} weight="semibold">
                  {sources.length}
                </Text>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  {t("dataQuality.sources")}
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
                  {t("dataQuality.updates")}
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
                  {t("dataQuality.dataPoints")}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

            {/* Source list */}
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.sourcesTitle}>
              {t("dataQuality.activeSources")}
            </Text>

            {sources.length === 0 && !isLoading ? (
              <View style={styles.emptyState}>
                <Icon name="wifi-off" size={Size.Large} appearance={TextAppearance.Muted} />
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.emptyText}>
                  {t("dataQuality.noSources")}
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
    padding: spacing.md,
  },
  contentMobile: {
    padding: spacing.sm,
  },
  header: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerLabel: {
    marginBottom: 2,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  gaugeSection: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: spacing.xxl,
  },
  sourcesTitle: {
    marginBottom: spacing.sm,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyText: {
    marginTop: spacing.xs,
  },
  sourceList: {
    gap: spacing.sm,
  },
});
