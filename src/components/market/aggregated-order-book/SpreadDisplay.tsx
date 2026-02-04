/**
 * SpreadDisplay Component - Shows spread and imbalance metrics
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Number } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import { getImbalanceColor, getImbalanceLabel } from "../../../types/orderbook";
import type { SpreadDisplayProps } from "./types";

export function SpreadDisplay({ orderBook }: SpreadDisplayProps) {
  const imbalanceColor = getImbalanceColor(orderBook.imbalance);
  const imbalanceLabel = getImbalanceLabel(orderBook.imbalance);

  return (
    <View style={styles.spreadContainer}>
      <View style={styles.spreadRow}>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          Spread
        </Text>
        <Number
          value={orderBook.spreadPct * 100}
          format={{ decimals: 3, suffix: "%" }}
          size={Size.TwoXSmall}
          mono
        />
      </View>
      <View style={styles.spreadRow}>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          Imbalance
        </Text>
        <Number
          value={orderBook.imbalance * 100}
          format={{ decimals: 1, suffix: "%" }}
          size={Size.TwoXSmall}
          style={{ color: imbalanceColor }}
          mono
        />
      </View>
      <View style={styles.imbalanceBarContainer}>
        <View style={styles.imbalanceBar}>
          <View
            style={[
              styles.imbalanceFill,
              {
                width: `${50 + orderBook.imbalance * 50}%`,
                backgroundColor: imbalanceColor,
              },
            ]}
          />
        </View>
        <View style={styles.imbalanceCenterContainer}>
          <View style={styles.imbalanceCenter} />
        </View>
      </View>
      <Text size={Size.TwoXSmall} style={{ color: imbalanceColor, textAlign: "center" }}>
        {imbalanceLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spreadContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  spreadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxs,
  },
  imbalanceBarContainer: {
    marginTop: spacing.xxs,
    marginBottom: 2,
    position: "relative",
  },
  imbalanceBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  imbalanceFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  imbalanceCenterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -2,
    bottom: -2,
    alignItems: "center",
    justifyContent: "center",
  },
  imbalanceCenter: {
    width: 2,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
});
