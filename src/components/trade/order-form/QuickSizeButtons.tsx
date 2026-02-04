/**
 * @file QuickSizeButtons.tsx
 * @description Quick size buttons for 25%/50%/75%/100% of available margin.
 */

import React, { useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { QuickSizeButtonsProps } from "./types";

const QUICK_SIZE_OPTIONS = [
  { percent: 25, label: "25%" },
  { percent: 50, label: "50%" },
  { percent: 75, label: "75%" },
  { percent: 100, label: "100%" },
];

export function QuickSizeButtons({
  availableMargin,
  currentPrice,
  leverage,
  onSizeSelect,
}: QuickSizeButtonsProps) {
  const handlePress = useCallback(
    (percent: number) => {
      if (!currentPrice || currentPrice === 0) return;

      // Calculate max position value based on margin and leverage
      const maxPositionValue = availableMargin * leverage;

      // Calculate the position value for this percentage
      const positionValue = (maxPositionValue * percent) / 100;

      // Convert to asset quantity
      const size = positionValue / currentPrice;

      onSizeSelect(size);
    },
    [availableMargin, currentPrice, leverage, onSizeSelect]
  );

  const isDisabled = !currentPrice || currentPrice === 0;

  return (
    <View style={styles.container}>
      {QUICK_SIZE_OPTIONS.map((option) => (
        <Pressable
          key={option.percent}
          style={[
            styles.button,
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={() => handlePress(option.percent)}
          disabled={isDisabled}
        >
          <Text
            size={Size.ExtraSmall}
            style={[
              styles.buttonText,
              isDisabled && styles.buttonTextDisabled,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: radii.soft,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.raised,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  buttonTextDisabled: {
    color: Colors.text.muted,
  },
});
