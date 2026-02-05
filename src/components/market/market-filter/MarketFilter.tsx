/**
 * @file MarketFilter.tsx
 * @description Market type filter buttons for switching between crypto/stocks/all.
 *
 * ## Features:
 * - Toggle between "All", "Crypto", and "Stocks" asset types
 * - Visual indication of selected filter (colored border and background)
 * - Icon + text labels for each option
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";
import { MARKET_OPTIONS } from "./constants";
import type { MarketFilterProps } from "./types";

export function MarketFilter({ value, onChange }: MarketFilterProps) {
  const { t } = useTranslation("navigation");
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      {MARKET_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            testID={`market-filter-${option.value}`}
            style={[
              styles.button,
              {
                backgroundColor: isActive
                  ? themeColors.accent.secondary
                  : "transparent",
                borderColor: isActive
                  ? themeColors.accent.primary
                  : themeColors.border.subtle,
              },
            ]}
            onPress={() => onChange(option.value)}
          >
            <Icon
              name={option.icon}
              size={Size.Small}
              appearance={isActive ? TextAppearance.Primary : TextAppearance.Muted}
            />
            <Text
              size={Size.Small}
              appearance={isActive ? TextAppearance.Primary : TextAppearance.Muted}
              weight={isActive ? "medium" : "regular"}
            >
              {t(`marketFilterOptions.${option.labelKey}` as any)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
