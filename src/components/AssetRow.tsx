import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Currency, Icon, Avatar } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { formatCompactNumber } from "../utils/format";

type AssetRowProps = {
  asset: Asset;
};

function ChangePercent({ value }: { value: number }) {
  const isPositive = value >= 0;
  const appearance = isPositive ? TextAppearance.Success : TextAppearance.Danger;

  return (
    <View style={styles.change}>
      <Icon
        name={isPositive ? "arrow-up" : "arrow-down"}
        size={Size.TwoXSmall}
        appearance={appearance}
      />
      <Text size={Size.Small} appearance={appearance}>
        {Math.abs(value).toFixed(2)}%
      </Text>
    </View>
  );
}

export function AssetRow({ asset }: AssetRowProps) {
  return (
    <Pressable style={styles.container}>
      {/* Rank */}
      <View style={[styles.cell, styles.rankCell]}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {asset.rank}
        </Text>
      </View>

      {/* Name */}
      <View style={[styles.cell, styles.nameCell]}>
        <Avatar initials={asset.symbol.slice(0, 2)} size={Size.Medium} />
        <View>
          <Text size={Size.Small} weight="semibold">
            {asset.name}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {asset.symbol}
          </Text>
        </View>
      </View>

      {/* Price */}
      <View style={[styles.cell, styles.priceCell]}>
        <Currency
          value={asset.price}
          size={Size.Small}
          weight="medium"
          decimals={asset.price < 1 ? 4 : 2}
        />
      </View>

      {/* 1h Change */}
      <View style={[styles.cell, styles.changeCell]}>
        <ChangePercent value={asset.change1h} />
      </View>

      {/* 24h Change */}
      <View style={[styles.cell, styles.changeCell]}>
        <ChangePercent value={asset.change24h} />
      </View>

      {/* 7d Change */}
      <View style={[styles.cell, styles.changeCell]}>
        <ChangePercent value={asset.change7d} />
      </View>

      {/* Market Cap */}
      <View style={[styles.cell, styles.marketCapCell]}>
        <Text size={Size.Small}>
          ${formatCompactNumber(asset.marketCap)}
        </Text>
      </View>

      {/* Volume */}
      <View style={[styles.cell, styles.volumeCell]}>
        <Text size={Size.Small}>
          ${formatCompactNumber(asset.volume24h)}
        </Text>
      </View>

      {/* Mini Chart */}
      <View style={[styles.cell, styles.chartCell]}>
        <MiniChart
          data={asset.sparkline}
          isPositive={asset.change7d >= 0}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    cursor: "pointer",
  },
  cell: {
    paddingHorizontal: 8,
  },
  rankCell: {
    width: 40,
  },
  nameCell: {
    width: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceCell: {
    width: 120,
  },
  changeCell: {
    width: 80,
  },
  marketCapCell: {
    width: 140,
  },
  volumeCell: {
    width: 140,
  },
  chartCell: {
    width: 140,
  },
  change: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
