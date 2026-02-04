/**
 * OrderBookHeader Component - Column headers for order book
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";

export function OrderBookHeader() {
  return (
    <View style={styles.headerRow}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerPrice}>
        Price
      </Text>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerQuantity}>
        Quantity
      </Text>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerExchanges}>
        Ex
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerPrice: {
    flex: 1,
  },
  headerQuantity: {
    flex: 1,
    textAlign: "right",
  },
  headerExchanges: {
    width: 24,
    textAlign: "center",
  },
});
