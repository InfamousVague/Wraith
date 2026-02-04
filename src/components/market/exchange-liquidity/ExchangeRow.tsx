/**
 * ExchangeRow Component
 *
 * Memoized row showing exchange name, update count, percentage, and progress bar.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { EXCHANGE_CONFIG, DEFAULT_EXCHANGE_CONFIG } from "./constants";
import type { ExchangeRowProps } from "./types";

export const ExchangeRow = React.memo(function ExchangeRow({
  exchange,
  maxCount,
}: ExchangeRowProps) {
  const themeColors = useThemeColors();
  const config =
    EXCHANGE_CONFIG[exchange.source.toLowerCase()] || {
      ...DEFAULT_EXCHANGE_CONFIG,
      name: exchange.source,
    };

  // Calculate progress as percentage of max updates (0-100)
  const progressValue = maxCount > 0 ? (exchange.updateCount / maxCount) * 100 : 0;

  // Use muted color when offline
  const dotColor = exchange.online ? config.color : themeColors.text.muted;
  const barColor = exchange.online ? config.color : themeColors.text.muted;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.exchangeInfo}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <Text
            size={Size.ExtraSmall}
            weight="medium"
            appearance={exchange.online ? undefined : TextAppearance.Muted}
          >
            {config.name}
          </Text>
          {!exchange.online && (
            <View style={styles.offlineBadge}>
              <Icon name="skull" size={Size.TwoXSmall} color={Colors.status.danger} />
            </View>
          )}
        </View>
        <View style={styles.countInfo}>
          <AnimatedNumber
            value={exchange.updateCount}
            decimals={0}
            separator=","
            size={Size.Small}
            appearance={exchange.online ? TextAppearance.Primary : TextAppearance.Muted}
            brightness={exchange.online ? Brightness.Soft : Brightness.None}
            animate
            animationDuration={200}
          />
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            {" "}
            ({(exchange.updatePercent ?? 0).toFixed(1)}%)
          </Text>
        </View>
      </View>
      <ProgressBar
        value={progressValue}
        max={100}
        size={Size.ExtraSmall}
        color={barColor}
        brightness={exchange.online ? Brightness.Soft : Brightness.None}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exchangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  countInfo: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.soft,
  },
  offlineBadge: {
    marginLeft: spacing.xxs,
  },
});
