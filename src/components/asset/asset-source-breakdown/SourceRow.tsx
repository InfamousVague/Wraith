/**
 * SourceRow Component - Individual exchange source row with progress bar
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, ProgressBar, AnimatedNumber, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import type { SourceRowProps } from "./types";
import { getExchangeConfig } from "./utils/exchangeConfig";

export const SourceRow = React.memo(function SourceRow({ source, maxCount }: SourceRowProps) {
  const themeColors = useThemeColors();
  const config = getExchangeConfig(source.source);

  // Calculate progress as percentage of max updates (0-100)
  const progressValue = maxCount > 0 ? (source.updateCount / maxCount) * 100 : 0;

  // Use muted color when offline
  const dotColor = source.online ? config.color : themeColors.text.muted;
  const barColor = source.online ? config.color : themeColors.text.muted;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.sourceInfo}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <Text
            size={Size.ExtraSmall}
            weight="medium"
            appearance={source.online ? undefined : TextAppearance.Muted}
          >
            {config.name}
          </Text>
          {!source.online && (
            <View style={styles.offlineBadge}>
              <Icon name="skull" size={Size.TwoXSmall} color={Colors.status.danger} />
            </View>
          )}
        </View>
        <View style={styles.countInfo}>
          <AnimatedNumber
            value={source.updateCount}
            decimals={0}
            separator=","
            size={Size.Small}
            appearance={TextAppearance.Muted}
            animate
            animationDuration={200}
          />
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {" "}({(source.updatePercent ?? 0).toFixed(1)}%)
          </Text>
        </View>
      </View>
      <ProgressBar
        value={progressValue}
        max={100}
        size={Size.ExtraSmall}
        color={barColor}
        brightness={source.online ? Brightness.Soft : Brightness.None}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  countInfo: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  colorDot: {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: radii.soft,
  },
  offlineBadge: {
    marginLeft: spacing.xxs,
  },
});
