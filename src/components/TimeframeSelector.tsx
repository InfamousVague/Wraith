/**
 * TimeframeSelector Component
 *
 * Selector for trading timeframe modes.
 */

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { TRADING_TIMEFRAMES, type TradingTimeframe } from "../types/signals";
import { HintIndicator } from "./HintIndicator";

type TimeframeSelectorProps = {
  value: TradingTimeframe;
  onChange: (timeframe: TradingTimeframe) => void;
};

export function TimeframeSelector({
  value,
  onChange,
}: TimeframeSelectorProps) {
  const { t } = useTranslation("components");
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text
          size={Size.Medium}
          appearance={TextAppearance.Muted}
          style={styles.label}
        >
          {t("timeframe.title")}
        </Text>
        <HintIndicator
          id="trading-style-hint"
          title={t("timeframe.hint.title")}
          content={t("timeframe.hint.content")}
          icon="?"
          color={Colors.accent.primary}
          priority={10}
          inline
        />
      </View>
      <Text
        size={Size.Small}
        appearance={TextAppearance.Muted}
        style={styles.subtitle}
      >
        {t("timeframe.subtitle")}
      </Text>
      <View style={styles.options}>
        {TRADING_TIMEFRAMES.map((tf) => {
          const isSelected = value === tf.value;
          return (
            <Pressable
              key={tf.value}
              onPress={() => onChange(tf.value)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? themeColors.accent.primary + "20"
                    : themeColors.background.raised,
                  borderColor: isSelected
                    ? themeColors.accent.primary
                    : themeColors.border.subtle,
                },
              ]}
            >
              <Text
                size={Size.Medium}
                weight={isSelected ? "semibold" : "regular"}
                style={{
                  color: isSelected
                    ? themeColors.accent.primary
                    : themeColors.text.primary,
                }}
              >
                {tf.label}
              </Text>
              <Text
                size={Size.Small}
                appearance={TextAppearance.Muted}
                style={styles.description}
              >
                {tf.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  options: {
    flexDirection: "row",
    gap: 14,
  },
  option: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  description: {
    marginTop: 6,
  },
});
