/**
 * OrderBookRow Component - Individual order book price level row
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Number } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { radii } from "../../../styles/tokens";
import type { OrderBookRowProps } from "./types";

export function OrderBookRow({ level, maxQuantity, side, priceDecimals, quantityDecimals }: OrderBookRowProps) {
  const fillPercent = maxQuantity > 0 ? (level.totalQuantity / maxQuantity) * 100 : 0;
  const isBid = side === "bid";
  // Use bright colors instead of dim
  const barColor = isBid ? Colors.status.success : Colors.status.danger;
  const priceColor = isBid ? Colors.status.success : Colors.status.danger;

  return (
    <View style={styles.row}>
      {/* Depth bar - always from left side */}
      <View
        style={[
          styles.depthBar,
          {
            width: `${Math.min(fillPercent, 100)}%`,
            backgroundColor: barColor,
            opacity: 0.25,
          },
        ]}
      />
      {/* Price - using Number component */}
      <View style={styles.priceCell}>
        <Number
          value={level.price}
          format={{ decimals: priceDecimals, separator: "," }}
          size={Size.TwoXSmall}
          style={{ color: priceColor }}
          mono
        />
      </View>
      {/* Quantity - using Number component */}
      <View style={styles.quantityCell}>
        <Number
          value={level.totalQuantity}
          format={{ decimals: quantityDecimals, separator: "," }}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
          mono
        />
      </View>
      {/* Exchange count indicator */}
      <View style={styles.exchangeIndicator}>
        <Number
          value={Object.keys(level.exchanges).length}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    position: "relative",
  },
  depthBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 2,
  },
  priceCell: {
    flex: 1,
    zIndex: 1,
  },
  quantityCell: {
    flex: 1,
    alignItems: "flex-end",
    zIndex: 1,
  },
  exchangeIndicator: {
    width: 24,
    alignItems: "center",
    zIndex: 1,
  },
});
