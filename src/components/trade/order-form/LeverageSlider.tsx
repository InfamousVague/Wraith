/**
 * @file LeverageSlider.tsx
 * @description Leverage slider with preset buttons.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Slider, Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipSignal,
  TooltipDivider,
  TooltipHighlight,
} from "../../ui/hint-indicator";
import type { LeverageSliderProps } from "./types";

const LEVERAGE_PRESETS = [1, 5, 10, 25, 50, 100];

export function LeverageSlider({
  value,
  onChange,
  min = 1,
  max = 100,
}: LeverageSliderProps) {
  // Get color based on leverage level
  const getLeverageColor = (leverage: number) => {
    if (leverage <= 5) return Colors.status.success;
    if (leverage <= 25) return Colors.status.warning;
    return Colors.status.danger;
  };

  const leverageColor = getLeverageColor(value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Leverage
          </Text>
          <HintIndicator
            id="leverage-hint"
            title="Leverage"
            icon="i"
            color={Colors.accent.primary}
            priority={56}
            width={400}
            inline
          >
            <TooltipContainer>
              <TooltipText>
                Leverage multiplies your buying power — and your risk. 10x means $1,000 controls $10,000 in assets.
              </TooltipText>
              <TooltipSection title="Risk Levels">
                <TooltipSignal type="bullish" text="1-5x — Low risk, safer for beginners" />
                <TooltipSignal type="neutral" text="10-25x — Moderate risk, common for experienced traders" />
                <TooltipSignal type="bearish" text="50-100x — High risk, small moves can liquidate" />
              </TooltipSection>
              <TooltipDivider />
              <TooltipHighlight color={Colors.status.danger} icon="alert-triangle">
                Higher leverage = closer liquidation price
              </TooltipHighlight>
            </TooltipContainer>
          </HintIndicator>
        </View>
        <View style={[styles.valueContainer, { backgroundColor: leverageColor }]}>
          <Text size={Size.Small} style={styles.valueText}>
            {value}x
          </Text>
        </View>
      </View>

      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={1}
      />

      <View style={styles.presets}>
        {LEVERAGE_PRESETS.map((preset) => (
          <Pressable
            key={preset}
            style={[
              styles.presetButton,
              value === preset && styles.presetButtonActive,
              value === preset && { borderColor: getLeverageColor(preset) },
            ]}
            onPress={() => onChange(preset)}
          >
            <Text
              size={Size.ExtraSmall}
              style={[
                styles.presetText,
                value === preset && { color: getLeverageColor(preset) },
              ]}
            >
              {preset}x
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Risk warning for high leverage */}
      {value > 25 && (
        <View style={styles.warning}>
          <Text size={Size.ExtraSmall} style={styles.warningText}>
            High leverage increases liquidation risk
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  valueContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.soft,
  },
  valueText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  presets: {
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  presetButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: radii.soft,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.raised,
  },
  presetButtonActive: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  presetText: {
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  warning: {
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderRadius: radii.soft,
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.warning,
  },
  warningText: {
    color: Colors.status.warning,
  },
});
