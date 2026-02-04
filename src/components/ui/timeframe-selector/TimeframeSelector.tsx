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
import { spacing, radii } from "../../../styles/tokens";
import { TRADING_TIMEFRAMES, type TradingTimeframe } from "../../../types/signals";
import {
  HintIndicator,
  TooltipContainer,
  TooltipSection,
  TooltipText,
  TooltipMetric,
  TooltipDivider,
  TooltipHighlight,
} from "../hint-indicator";
import { useBreakpoint } from "../../../hooks/useBreakpoint";

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
  const { isMobile } = useBreakpoint();

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
          icon="?"
          color={Colors.accent.primary}
          priority={10}
          width={400}
          inline
        >
          <TooltipContainer>
            <TooltipText>
              Select your trading timeframe to optimize how signals are weighted for your strategy.
            </TooltipText>
            <TooltipSection title="Timeframe Styles">
              <TooltipMetric label="Scalper" value="5-15 min charts, fast signals" valueColor={Colors.status.danger} />
              <TooltipMetric label="Day Trader" value="1-4 hour charts, intraday moves" valueColor={Colors.data.amber} />
              <TooltipMetric label="Swing" value="Daily charts, multi-day positions" valueColor={Colors.data.cyan} />
              <TooltipMetric label="Investor" value="Weekly charts, long-term trends" valueColor={Colors.status.success} />
            </TooltipSection>
            <TooltipDivider />
            <TooltipHighlight color={Colors.data.blue} icon="info">
              This affects how the composite signal score is calculated
            </TooltipHighlight>
          </TooltipContainer>
        </HintIndicator>
      </View>
      {!isMobile && (
        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.subtitle}
        >
          {t("timeframe.subtitle")}
        </Text>
      )}
      <View style={[styles.options, isMobile && styles.optionsMobile]}>
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
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  options: {
    flexDirection: "row",
    gap: 14,
  },
  optionsMobile: {
    flexDirection: "column",
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  description: {
    marginTop: spacing.sm,
  },
});
