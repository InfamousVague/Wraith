/**
 * Indicator Tooltip Component
 *
 * Displays a question mark help icon next to indicator names that opens
 * an explanatory modal when clicked. Uses the HintIndicator system to
 * track viewed state and manage the hint queue.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { HintIndicator } from "../../ui/hint-indicator";
import {
  getIndicatorExplanation,
  hasIndicatorExplanation,
} from "../../../data/indicatorExplanations";

type IndicatorTooltipProps = {
  /** The indicator name exactly as returned from the API */
  indicatorName: string;
  /** Priority in the hint queue (lower = shown first). Default: 50 */
  priority?: number;
  /** Custom color for the hint icon */
  color?: string;
};

/** Section header for tooltip content */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text
      size={Size.ExtraSmall}
      weight="semibold"
      style={styles.sectionHeader}
    >
      {children}
    </Text>
  );
}

/** Section content text */
function SectionContent({ children }: { children: React.ReactNode }) {
  return (
    <Text size={Size.Small} style={styles.sectionContent}>
      {children}
    </Text>
  );
}

/** Signal row (bullish/bearish) */
function SignalRow({
  type,
  text,
}: {
  type: "bullish" | "bearish";
  text: string;
}) {
  const color =
    type === "bullish" ? Colors.status.success : Colors.status.danger;
  const label = type === "bullish" ? "Bullish" : "Bearish";

  return (
    <View style={styles.signalRow}>
      <View style={[styles.signalBadge, { backgroundColor: `${color}20` }]}>
        <Text size={Size.ExtraSmall} weight="medium" style={{ color }}>
          {label}
        </Text>
      </View>
      <Text size={Size.Small} style={styles.signalText}>
        {text}
      </Text>
    </View>
  );
}

/**
 * A tooltip component that shows explanatory information about a trading indicator.
 * Returns null if no explanation is available for the indicator.
 */
export function IndicatorTooltip({
  indicatorName,
  priority = 50,
  color = Colors.text.muted,
}: IndicatorTooltipProps) {
  // Don't render if no explanation exists
  if (!hasIndicatorExplanation(indicatorName)) {
    return null;
  }

  const explanation = getIndicatorExplanation(indicatorName);
  if (!explanation) {
    return null;
  }

  return (
    <HintIndicator
      id={`indicator-hint-${explanation.id}`}
      title={explanation.name}
      icon="?"
      color={color}
      priority={priority}
      width={420}
      inline
    >
      <View style={styles.container}>
        {/* Description */}
        <View style={styles.section}>
          <SectionContent>{explanation.description}</SectionContent>
        </View>

        {/* Calculation */}
        <View style={styles.section}>
          <SectionHeader>CALCULATION</SectionHeader>
          <SectionContent>{explanation.calculation}</SectionContent>
        </View>

        {/* Interpretation */}
        <View style={styles.section}>
          <SectionHeader>INTERPRETATION</SectionHeader>
          <SectionContent>{explanation.interpretation}</SectionContent>
        </View>

        {/* Signals */}
        <View style={styles.section}>
          <SectionHeader>SIGNALS</SectionHeader>
          <View style={styles.signalsContainer}>
            <SignalRow type="bullish" text={explanation.bullishSignal} />
            <SignalRow type="bearish" text={explanation.bearishSignal} />
          </View>
        </View>
      </View>
    </HintIndicator>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.xxs,
  },
  sectionHeader: {
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  sectionContent: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  signalsContainer: {
    gap: spacing.xs,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  signalBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.soft,
    minWidth: 56,
    alignItems: "center",
  },
  signalText: {
    flex: 1,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
