import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icon, type IconName } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { AssetType } from "../services/haunt";

type MarketFilterProps = {
  value: AssetType;
  onChange: (type: AssetType) => void;
};

type MarketOption = {
  value: AssetType;
  icon: IconName;
  labelKey: string;
};

const MARKET_OPTIONS: MarketOption[] = [
  { value: "all", icon: "layers", labelKey: "all" },
  { value: "crypto", icon: "coins", labelKey: "crypto" },
  { value: "stock", icon: "building-2", labelKey: "stocks" },
];

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
              {t(`marketFilterOptions.${option.labelKey}`)}
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
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
