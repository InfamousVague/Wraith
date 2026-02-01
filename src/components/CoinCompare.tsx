import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, Text, Avatar, Badge } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

export function CoinCompare() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  // Compare BTC and ETH
  const btc = assets.find(a => a.symbol === "BTC");
  const eth = assets.find(a => a.symbol === "ETH");

  if (!btc || !eth) return null;

  const compareItems = [
    { label: "Price", btc: `$${btc.price.toLocaleString()}`, eth: `$${eth.price.toLocaleString()}` },
    { label: "24h Change", btc: btc.change24h, eth: eth.change24h, isPercent: true },
    { label: "7d Change", btc: btc.change7d, eth: eth.change7d, isPercent: true },
    { label: "Market Cap", btc: formatCompact(btc.marketCap), eth: formatCompact(eth.marketCap) },
    { label: "Volume 24h", btc: formatCompact(btc.volume24h), eth: formatCompact(eth.volume24h) },
  ];

  return (
    <Card style={styles.container} border={CardBorder.Gradient}>
      <Text size={Size.Medium} weight="semibold" style={styles.title}>
        Compare
      </Text>

      <View style={styles.header}>
        <View style={styles.coinHeader}>
          <Avatar initials="BT" size={Size.Medium} />
          <View>
            <Text size={Size.Small} weight="semibold">Bitcoin</Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>BTC</Text>
          </View>
        </View>
        <View style={styles.vs}>
          <Badge label="VS" variant="default" size={Size.Small} />
        </View>
        <View style={[styles.coinHeader, styles.coinHeaderRight]}>
          <View style={styles.rightAlign}>
            <Text size={Size.Small} weight="semibold">Ethereum</Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>ETH</Text>
          </View>
          <Avatar initials="ET" size={Size.Medium} />
        </View>
      </View>

      <View style={styles.compareList}>
        {compareItems.map((item, index) => (
          <View key={item.label} style={styles.compareRow}>
            <View style={styles.compareValue}>
              {item.isPercent ? (
                <Text
                  size={Size.Small}
                  weight="medium"
                  style={{ color: (item.btc as number) >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {(item.btc as number) >= 0 ? "+" : ""}{(item.btc as number).toFixed(2)}%
                </Text>
              ) : (
                <Text size={Size.Small} weight="medium" style={styles.value}>
                  {item.btc}
                </Text>
              )}
            </View>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.compareLabel}>
              {item.label}
            </Text>
            <View style={[styles.compareValue, styles.rightAlign]}>
              {item.isPercent ? (
                <Text
                  size={Size.Small}
                  weight="medium"
                  style={{ color: (item.eth as number) >= 0 ? "#22c55e" : "#ef4444" }}
                >
                  {(item.eth as number) >= 0 ? "+" : ""}{(item.eth as number).toFixed(2)}%
                </Text>
              ) : (
                <Text size={Size.Small} weight="medium" style={styles.value}>
                  {item.eth}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function formatCompact(num: number): string {
  if (num >= 1e12) return "$" + (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return "$" + (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return "$" + (num / 1e6).toFixed(2) + "M";
  return "$" + num.toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  coinHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  coinHeaderRight: {
    justifyContent: "flex-end",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  vs: {
    paddingHorizontal: 16,
  },
  compareList: {
    gap: 12,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  compareValue: {
    flex: 1,
  },
  compareLabel: {
    flex: 1,
    textAlign: "center",
  },
  value: {
    fontFamily: "Inter, sans-serif",
  },
});
