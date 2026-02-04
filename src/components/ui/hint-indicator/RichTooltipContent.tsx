/**
 * Rich Tooltip Content Components
 *
 * Reusable components for creating visually rich tooltip content
 * with consistent styling across the app.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";

/** Section header with uppercase styling */
export function TooltipSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title && (
        <Text
          size={Size.ExtraSmall}
          weight="semibold"
          style={styles.sectionHeader}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

/** Regular paragraph text */
export function TooltipText({ children }: { children: React.ReactNode }) {
  return (
    <Text size={Size.Small} style={styles.text}>
      {children}
    </Text>
  );
}

/** Highlighted text with icon and colored background */
export function TooltipHighlight({
  children,
  color = Colors.accent.primary,
  icon,
}: {
  children: React.ReactNode;
  color?: string;
  icon?: string;
}) {
  return (
    <View style={[styles.highlight, { backgroundColor: `${color}15` }]}>
      {icon && (
        <Icon name={icon} size={Size.Small} color={color} />
      )}
      <Text size={Size.Small} style={[styles.highlightText, { color }]}>
        {children}
      </Text>
    </View>
  );
}

/** Badge with label and value */
export function TooltipBadge({
  label,
  value,
  color = Colors.text.secondary,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.badgeRow}>
      <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
        <Text size={Size.ExtraSmall} weight="medium" style={{ color }}>
          {label}
        </Text>
      </View>
      <Text size={Size.Small} style={styles.badgeValue}>
        {value}
      </Text>
    </View>
  );
}

/** Bullish/Bearish signal indicator */
export function TooltipSignal({
  type,
  text,
}: {
  type: "bullish" | "bearish" | "neutral" | "warning" | "info";
  text: string;
}) {
  const colorMap = {
    bullish: Colors.status.success,
    bearish: Colors.status.danger,
    neutral: Colors.text.muted,
    warning: Colors.status.warning,
    info: Colors.data.blue,
  };
  const labelMap = {
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral",
    warning: "Warning",
    info: "Info",
  };
  const iconMap = {
    bullish: "trending-up",
    bearish: "trending-down",
    neutral: "minus",
    warning: "alert-triangle",
    info: "info",
  };

  const color = colorMap[type];

  return (
    <View style={styles.signalRow}>
      <View style={[styles.signalBadge, { backgroundColor: `${color}20` }]}>
        <Icon name={iconMap[type]} size={Size.ExtraSmall} color={color} />
        <Text size={Size.ExtraSmall} weight="medium" style={{ color }}>
          {labelMap[type]}
        </Text>
      </View>
      <Text size={Size.Small} style={styles.signalText}>
        {text}
      </Text>
    </View>
  );
}

/** List item with bullet point */
export function TooltipListItem({
  children,
  icon = "chevron-right",
  color = Colors.accent.primary,
}: {
  children: React.ReactNode;
  icon?: string;
  color?: string;
}) {
  return (
    <View style={styles.listItem}>
      <Icon name={icon} size={Size.ExtraSmall} color={color} />
      <Text size={Size.Small} style={styles.listText}>
        {children}
      </Text>
    </View>
  );
}

/** Metric row with label and value */
export function TooltipMetric({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text size={Size.Small} appearance={TextAppearance.Muted}>
        {label}
      </Text>
      <Text
        size={Size.Small}
        weight="semibold"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

/** Divider line */
export function TooltipDivider() {
  return <View style={styles.divider} />;
}

/** Container for tooltip content */
export function TooltipContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    color: Colors.text.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  text: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  highlightText: {
    fontWeight: "500",
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.soft,
    minWidth: 56,
    alignItems: "center",
  },
  badgeValue: {
    flex: 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  signalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.soft,
    minWidth: 72,
  },
  signalText: {
    flex: 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  listText: {
    flex: 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: spacing.xs,
  },
});
