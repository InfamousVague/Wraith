/**
 * @file PortfolioSummary.tsx
 * @description Displays portfolio metrics in a horizontal bar format.
 *
 * Shows key trading metrics:
 * - Account Balance
 * - Margin Used / Available
 * - Unrealized P&L
 * - Realized P&L
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Skeleton, Currency } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import type { PortfolioSummaryProps } from "./types";

export function PortfolioSummary({
  balance,
  marginUsed,
  marginAvailable,
  unrealizedPnl,
  realizedPnl,
  loading = false,
  compact = false,
}: PortfolioSummaryProps) {
  const { isMobile } = useBreakpoint();
  const isCompact = compact || isMobile;

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={[styles.container, isCompact && styles.containerCompact]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.metricItem}>
              <Skeleton width={60} height={12} />
              <Skeleton width={80} height={20} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </Card>
    );
  }

  const marginUsedPercent = balance > 0 ? (marginUsed / balance) * 100 : 0;
  const totalPnl = unrealizedPnl + realizedPnl;

  return (
    <Card style={styles.card}>
      <View style={[styles.container, isCompact && styles.containerCompact]}>
        <MetricItem
          label="Balance"
          value={balance}
          compact={isCompact}
        />

        {!isCompact && <View style={styles.divider} />}

        <MetricItem
          label="Margin Used"
          value={marginUsed}
          subValue={`${marginUsedPercent.toFixed(1)}%`}
          compact={isCompact}
        />

        {!isCompact && <View style={styles.divider} />}

        <MetricItem
          label="Available"
          value={marginAvailable}
          compact={isCompact}
        />

        {!isCompact && <View style={styles.divider} />}

        <MetricItem
          label="Unrealized P&L"
          value={unrealizedPnl}
          isPnl
          compact={isCompact}
        />

        {!isCompact && <View style={styles.divider} />}

        <MetricItem
          label="Realized P&L"
          value={realizedPnl}
          isPnl
          compact={isCompact}
        />

        {!isCompact && <View style={styles.divider} />}

        <MetricItem
          label="Total P&L"
          value={totalPnl}
          isPnl
          compact={isCompact}
          highlight
        />
      </View>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
  subValue?: string;
  isPnl?: boolean;
  compact?: boolean;
  highlight?: boolean;
}

function MetricItem({ label, value, subValue, isPnl = false, compact = false, highlight = false }: MetricItemProps) {
  const getPnlColor = (val: number) => {
    if (val > 0) return Colors.status.success;
    if (val < 0) return Colors.status.danger;
    return Colors.text.secondary;
  };

  const pnlColor = isPnl ? getPnlColor(value) : undefined;
  const metricItemStyle = compact
    ? [styles.metricItem, styles.metricItemCompact]
    : styles.metricItem;
  const valueStyle = highlight
    ? [styles.value, styles.valueHighlight]
    : styles.value;

  return (
    <View style={metricItemStyle}>
      <Text
        size={Size.ExtraSmall}
        appearance={TextAppearance.Muted}
        style={styles.label}
      >
        {label}
      </Text>
      <View style={styles.valueRow}>
        {isPnl && (
          <Text
            size={compact ? Size.Small : Size.Medium}
            style={[valueStyle, { color: pnlColor }]}
          >
            {value >= 0 ? "+" : "-"}
          </Text>
        )}
        <Currency
          value={Math.abs(value)}
          decimals={2}
          size={compact ? Size.Small : Size.Medium}
          color={pnlColor}
        />
        {subValue && (
          <Text
            size={Size.ExtraSmall}
            appearance={TextAppearance.Muted}
            style={styles.subValue}
          >
            {subValue}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: spacing.md,
  },
  containerCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  metricItem: {
    flex: 1,
    minWidth: 100,
  },
  metricItemCompact: {
    minWidth: 80,
    flex: 0,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xxs,
  },
  value: {
    fontWeight: "600",
  },
  valueHighlight: {
    fontWeight: "700",
  },
  subValue: {
    marginLeft: spacing.xxs,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border.subtle,
  },
});
