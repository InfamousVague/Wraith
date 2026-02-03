/**
 * ChartLegend Component
 *
 * @fileoverview Displays price, change, high, low, and volume values
 * at the current crosshair position or as default stats.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Currency, PercentChange } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import type { CrosshairData } from "./types";

type ChartLegendProps = CrosshairData;

export function ChartLegend({
  price,
  change,
  high,
  low,
  volume,
}: ChartLegendProps) {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
        {price !== undefined ? (
          <Currency value={price} size={Size.Medium} weight="semibold" decimals={price < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Change</Text>
        {change !== undefined && Number.isFinite(change) ? (
          <PercentChange value={change} size={Size.Medium} weight="semibold" />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>High</Text>
        {high !== undefined ? (
          <Currency value={high} size={Size.Medium} weight="semibold" decimals={high < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      <View style={styles.legendItem}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Low</Text>
        {low !== undefined ? (
          <Currency value={low} size={Size.Medium} weight="semibold" decimals={low < 1 ? 6 : 2} mono />
        ) : (
          <Text size={Size.Medium} weight="semibold">—</Text>
        )}
      </View>
      {volume !== undefined && (
        <View style={styles.legendItem}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Volume</Text>
          <Currency value={volume} size={Size.Medium} weight="semibold" compact mono />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  legendItem: {
    gap: 2,
  },
});
