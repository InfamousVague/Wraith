/**
 * @file TimeInForceSelector.tsx
 * @description Time in force selector for order execution.
 *
 * Time in force options:
 * - GTC: Good Till Cancelled - order remains active until filled or cancelled
 * - IOC: Immediate Or Cancel - fills immediately, cancels unfilled portion
 * - FOK: Fill Or Kill - must fill entirely immediately or cancel completely
 * - GTD: Good Till Day - expires at end of trading day
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipListItem,
} from "../../ui/hint-indicator";
import type { TimeInForce } from "./types";

interface TimeInForceSelectorProps {
  value: TimeInForce;
  onChange: (tif: TimeInForce) => void;
}

const TIME_IN_FORCE_OPTIONS: { value: TimeInForce; label: string; description: string }[] = [
  { value: "gtc", label: "GTC", description: "Good Till Cancelled" },
  { value: "ioc", label: "IOC", description: "Immediate Or Cancel" },
  { value: "fok", label: "FOK", description: "Fill Or Kill" },
  { value: "gtd", label: "GTD", description: "Good Till Day" },
];

export function TimeInForceSelector({ value, onChange }: TimeInForceSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          Time in Force
        </Text>
        <HintIndicator
          id="time-in-force-hint"
          title="Time in Force"
          icon="i"
          color={Colors.accent.primary}
          priority={60}
          width={320}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Determines how long your order remains active.
            </TooltipText>
            <TooltipSection title="Options">
              <TooltipListItem icon="clock" color={Colors.data.emerald}>
                GTC - Stays active until filled or you cancel it
              </TooltipListItem>
              <TooltipListItem icon="zap" color={Colors.data.amber}>
                IOC - Fills what it can immediately, cancels the rest
              </TooltipListItem>
              <TooltipListItem icon="target" color={Colors.data.violet}>
                FOK - Must fill completely or gets cancelled entirely
              </TooltipListItem>
              <TooltipListItem icon="calendar" color={Colors.data.cyan}>
                GTD - Expires at end of trading day
              </TooltipListItem>
            </TooltipSection>
          </TooltipContainer>
        </HintIndicator>
      </View>
      <View style={styles.optionsRow}>
        {TIME_IN_FORCE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              value === option.value && styles.optionActive,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              size={Size.ExtraSmall}
              weight={value === option.value ? "semibold" : "regular"}
              style={value === option.value ? styles.optionTextActive : styles.optionText}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: Colors.background.raised,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionActive: {
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    borderColor: Colors.accent.primary,
  },
  optionText: {
    color: Colors.text.secondary,
  },
  optionTextActive: {
    color: Colors.accent.primary,
  },
});
