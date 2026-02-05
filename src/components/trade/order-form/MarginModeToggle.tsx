/**
 * @file MarginModeToggle.tsx
 * @description Toggle between Isolated and Cross margin modes.
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
  TooltipText,
  TooltipListItem,
} from "../../ui/hint-indicator";
import type { MarginMode } from "./types";

interface MarginModeToggleProps {
  value: MarginMode;
  onChange: (mode: MarginMode) => void;
}

export function MarginModeToggle({ value, onChange }: MarginModeToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          Margin Mode
        </Text>
        <HintIndicator
          id="margin-mode-hint"
          title="Margin Mode"
          icon="i"
          color={Colors.accent.primary}
          priority={55}
          width={320}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Choose how margin is allocated for your position.
            </TooltipText>
            <TooltipListItem icon="box" color={Colors.data.emerald}>
              Isolated - Position has dedicated margin, limits loss to that margin
            </TooltipListItem>
            <TooltipListItem icon="layers" color={Colors.data.amber}>
              Cross - All positions share account margin, higher liquidation risk
            </TooltipListItem>
          </TooltipContainer>
        </HintIndicator>
      </View>
      <View style={styles.toggleRow}>
        <Pressable
          style={[
            styles.option,
            value === "isolated" && styles.optionActive,
          ]}
          onPress={() => onChange("isolated")}
        >
          <Text
            size={Size.ExtraSmall}
            weight={value === "isolated" ? "semibold" : "regular"}
            style={value === "isolated" ? styles.textActive : styles.text}
          >
            Isolated
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.option,
            value === "cross" && styles.optionActive,
          ]}
          onPress={() => onChange("cross")}
        >
          <Text
            size={Size.ExtraSmall}
            weight={value === "cross" ? "semibold" : "regular"}
            style={value === "cross" ? styles.textActive : styles.text}
          >
            Cross
          </Text>
        </Pressable>
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
  toggleRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
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
  text: {
    color: Colors.text.secondary,
  },
  textActive: {
    color: Colors.accent.primary,
  },
});
