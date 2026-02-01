import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, ProgressCircle, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { hauntClient, type ConfidenceResponse } from "../services/haunt";

// Get color based on score
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

type FactorRowProps = {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon: string;
};

const FactorRow = React.memo(function FactorRow({ label, value, maxValue, color, icon }: FactorRowProps) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.factorRow}>
      <View style={styles.factorLabel}>
        <Icon name={icon as any} size={Size.ExtraSmall} color={themeColors.text.muted} />
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <View style={styles.factorValue}>
        <ProgressBar
          value={value}
          max={maxValue}
          size={Size.ExtraSmall}
          color={color}
          brightness={value > maxValue / 2 ? Brightness.Soft : Brightness.None}
          style={styles.factorBar}
        />
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {value}/{maxValue}
        </Text>
      </View>
    </View>
  );
});

type ConfidenceCardProps = {
  symbol: string;
  loading?: boolean;
  pollInterval?: number;
};

export function ConfidenceCard({
  symbol,
  loading = false,
  pollInterval = 10000, // Poll every 10 seconds
}: ConfidenceCardProps) {
  const [data, setData] = useState<ConfidenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeColors = useThemeColors();

  const fetchConfidence = useCallback(async () => {
    if (!symbol) return;

    try {
      const response = await hauntClient.getConfidence(symbol);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setIsLoading(true);
    fetchConfidence();
    const interval = setInterval(fetchConfidence, pollInterval);
    return () => clearInterval(interval);
  }, [fetchConfidence, pollInterval]);

  const showLoading = loading || isLoading;
  const score = data?.confidence.score ?? 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.headerLabel}>
              DATA CONFIDENCE
            </Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Quality score for {symbol.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.errorState}>
            <Icon name="skull" size={Size.ExtraLarge} color="#FF5C7A" />
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.errorText}>
              Unable to load confidence data
            </Text>
          </View>
        ) : (
          <View style={styles.mainContent}>
            {/* Score Circle */}
            <View style={styles.scoreSection}>
              <ProgressCircle
                value={score}
                max={100}
                size={Size.TwoXLarge}
                color={scoreColor}
                brightness={Brightness.Medium}
                showValue
              >
                <View style={styles.scoreInner}>
                  <AnimatedNumber
                    value={score}
                    decimals={0}
                    size={Size.ExtraLarge}
                    weight="bold"
                    style={{ color: scoreColor }}
                    animate
                    animationDuration={300}
                  />
                  <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                    / 100
                  </Text>
                </View>
              </ProgressCircle>
              <Text
                size={Size.Small}
                weight="semibold"
                style={{ color: scoreColor, marginTop: 8 }}
              >
                {scoreLabel}
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text size={Size.Small} weight="semibold">
                  {data?.confidence.sourceCount ?? 0}
                </Text>
                <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
                  Sources
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border.subtle }]} />
              <View style={styles.statItem}>
                <AnimatedNumber
                  value={data?.confidence.totalUpdates ?? 0}
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
                  value={data?.chartDataPoints ?? 0}
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

            {/* Factor Breakdown */}
            <View style={styles.factorsSection}>
              <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.factorsTitle}>
                CONFIDENCE FACTORS
              </Text>
              <View style={styles.factorsList}>
                <FactorRow
                  label="Source Diversity"
                  value={data?.confidence.factors.sourceDiversity ?? 0}
                  maxValue={30}
                  color="#8B5CF6"
                  icon="layers"
                />
                <FactorRow
                  label="Update Frequency"
                  value={data?.confidence.factors.updateFrequency ?? 0}
                  maxValue={25}
                  color="#06B6D4"
                  icon="zap"
                />
                <FactorRow
                  label="Data Recency"
                  value={data?.confidence.factors.dataRecency ?? 0}
                  maxValue={25}
                  color="#10B981"
                  icon="clock"
                />
                <FactorRow
                  label="Price Consistency"
                  value={data?.confidence.factors.priceConsistency ?? 0}
                  maxValue={20}
                  color="#F59E0B"
                  icon="check-circle"
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 380,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  headerLabel: {
    marginBottom: 2,
  },
  divider: {
    height: 1,
    marginBottom: 16,
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
  mainContent: {
    flex: 1,
    gap: 20,
  },
  scoreSection: {
    alignItems: "center",
  },
  scoreInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  factorsSection: {
    gap: 10,
  },
  factorsTitle: {
    marginBottom: 4,
  },
  factorsList: {
    gap: 10,
  },
  factorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  factorLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 120,
  },
  factorValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  factorBar: {
    flex: 1,
  },
});
