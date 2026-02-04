/**
 * Stat row component for API stats display
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import type { StatRowProps } from "./types";

export const StatRow = React.memo(function StatRow({ icon, label, value, color }: StatRowProps) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabel}>
        <Icon name={icon as any} size={Size.Small} color={color || themeColors.text.muted} />
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {label}
        </Text>
      </View>
      <View style={styles.statValue}>{value}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
});
