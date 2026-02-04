/**
 * Speed Selector Component
 *
 * A segmented control to select update speed levels.
 * Uses turtle (slow), scale (balanced), and rabbit (fast) icons.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, SegmentedControl } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import { usePerformance, SPEED_LEVELS, type SpeedLevel } from "../../../context/PerformanceContext";
import type { IconName } from "@wraith/ghost/components";

/**
 * Speed selector row for the Settings page.
 * Right-aligned like other settings controls.
 */
export function SpeedSelector() {
  const { speedLevel, setSpeedLevel } = usePerformance();

  const options = SPEED_LEVELS.map((level) => ({
    value: level.value,
    label: level.label,
    icon: level.icon as IconName,
  }));

  const currentLevel = SPEED_LEVELS.find((l) => l.value === speedLevel);

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text size={Size.Medium} weight="medium">
          Update Speed
        </Text>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {currentLevel?.description}
        </Text>
      </View>
      <SegmentedControl
        options={options}
        value={speedLevel}
        onChange={(value) => setSpeedLevel(value as SpeedLevel)}
        size={Size.Large}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  settingInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
});
