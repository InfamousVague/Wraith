import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, CardBorder, CardGlow, Text, Avatar, Badge, ProgressBar } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { MiniChart } from "./MiniChart";
import type { Asset } from "../types/asset";

type CoinCardProps = {
  asset: Asset;
  variant?: "compact" | "detailed";
};

export function CoinCard({ asset, variant = "detailed" }: CoinCardProps) {
  const isPositive = asset.change24h >= 0;
  const glow = isPositive ? CardGlow.Green : CardGlow.Red;

  if (variant === "compact") {
    return (
      <Card style={styles.compactContainer} border={CardBorder.Gradient}>
        <View style={styles.compactHeader}>
          <Avatar initials={asset.symbol.slice(0, 2)} size={Size.Medium} />
          <View style={styles.compactInfo}>
            <Text size={Size.Small} weight="semibold">
              {asset.name}
            </Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              {asset.symbol}
            </Text>
          </View>
          <View style={styles.compactPrice}>
            <Text size={Size.Small} weight="medium" style={styles.price}>
              ${asset.price >= 1 ? asset.price.toFixed(2) : asset.price.toFixed(4)}
            </Text>
            <Text
              size={Size.ExtraSmall}
              style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
            >
              {isPositive ? "+" : ""}{asset.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container} border={CardBorder.Gradient} glow={glow}>
      <View style={styles.header}>
        <View style={styles.coinInfo}>
          <Avatar initials={asset.symbol.slice(0, 2)} size={Size.Large} />
          <View>
            <Text size={Size.Medium} weight="bold">
              {asset.name}
            </Text>
            <View style={styles.symbolRow}>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                {asset.symbol}
              </Text>
              <Badge label={`#${asset.rank}`} variant="default" size={Size.Small} />
            </View>
          </View>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.mainPrice}>
            ${asset.price >= 1000
              ? asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : asset.price >= 1
                ? asset.price.toFixed(2)
                : asset.price.toFixed(4)}
          </Text>
          <View style={styles.changeRow}>
            <Text
              size={Size.Small}
              weight="semibold"
              style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(asset.change24h).toFixed(2)}%
            </Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              24h
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartSection}>
        <MiniChart
          data={asset.sparkline}
          isPositive={isPositive}
          width={280}
          height={60}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            Market Cap
          </Text>
          <Text size={Size.Small} weight="medium" style={styles.statValue}>
            ${formatCompact(asset.marketCap)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            24h Volume
          </Text>
          <Text size={Size.Small} weight="medium" style={styles.statValue}>
            ${formatCompact(asset.volume24h)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            7d Change
          </Text>
          <Text
            size={Size.Small}
            weight="medium"
            style={{ color: asset.change7d >= 0 ? "#22c55e" : "#ef4444" }}
          >
            {asset.change7d >= 0 ? "+" : ""}{asset.change7d.toFixed(2)}%
          </Text>
        </View>
      </View>

      {asset.maxSupply && (
        <View style={styles.supplySection}>
          <View style={styles.supplyHeader}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Circulating Supply
            </Text>
            <Text size={Size.ExtraSmall}>
              {((asset.circulatingSupply / asset.maxSupply) * 100).toFixed(1)}%
            </Text>
          </View>
          <ProgressBar
            value={asset.circulatingSupply}
            max={asset.maxSupply}
            size={Size.Small}
            appearance={TextAppearance.Link}
            brightness={Brightness.Soft}
          />
        </View>
      )}
    </Card>
  );
}

function formatCompact(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(2);
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    minWidth: 320,
  },
  compactContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  coinInfo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  mainPrice: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter, sans-serif",
    color: "#ffffff",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  chartSection: {
    marginVertical: 16,
    alignItems: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  statItem: {
    gap: 4,
  },
  statValue: {
    fontFamily: "Inter, sans-serif",
  },
  supplySection: {
    marginTop: 16,
    gap: 8,
  },
  supplyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactPrice: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontFamily: "Inter, sans-serif",
  },
});
