/**
 * SyncIndicator Component - Shows data sync status with arrows
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import type { SyncIndicatorProps } from "./types";

export function SyncIndicator({ syncStatus }: SyncIndicatorProps) {
  if (!syncStatus) return null;

  const totalAhead = syncStatus.predictionsAhead + syncStatus.preferencesAhead;
  const totalBehind = syncStatus.predictionsBehind + syncStatus.preferencesBehind;

  // Don't show if perfectly in sync
  if (totalAhead === 0 && totalBehind === 0) {
    return (
      <View style={styles.container}>
        <Icon name="check" size={Size.TwoXSmall} color={Colors.status.success} />
        <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
          synced
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {totalAhead > 0 && (
        <View style={styles.indicator}>
          <Icon name="arrow-up" size={Size.TwoXSmall} color={Colors.status.success} />
          <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
            {totalAhead}
          </Text>
        </View>
      )}
      {totalBehind > 0 && (
        <View style={styles.indicator}>
          <Icon name="arrow-down" size={Size.TwoXSmall} color={Colors.data.amber} />
          <Text size={Size.TwoXSmall} style={{ color: Colors.data.amber }}>
            {totalBehind}
          </Text>
        </View>
      )}
      {syncStatus.syncing && (
        <Icon name="refresh-cw" size={Size.TwoXSmall} color={Colors.data.amber} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
