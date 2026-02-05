/**
 * ExchangeBreakdown Component - Shows exchange sources for order book
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing, radii } from "../../../styles/tokens";
import type { ExchangeBreakdownProps } from "./types";

export function ExchangeBreakdown({ orderBook }: ExchangeBreakdownProps) {
  if (orderBook.exchanges.length === 0) return null;

  return (
    <View style={styles.exchangeBreakdown}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.exchangeLabel}>
        Sources ({orderBook.exchangeCount})
      </Text>
      <View style={styles.exchangeTags}>
        {orderBook.exchanges.map((exchange: string) => (
          <View key={exchange} style={styles.exchangeTag}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {exchange}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exchangeBreakdown: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  exchangeLabel: {
    marginBottom: spacing.sm,
  },
  exchangeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  exchangeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: radii.soft,
    marginRight: spacing.xxs,
    marginBottom: spacing.xxs,
  },
});
