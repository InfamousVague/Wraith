import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, CardBorder, Text, Avatar, Badge } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

export function TrendingCoins() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  // Sort by 24h change to simulate "trending"
  const trending = [...assets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 5);

  return (
    <Card style={styles.container} border={CardBorder.Gradient}>
      <View style={styles.header}>
        <Text size={Size.Medium} weight="semibold">
          Trending
        </Text>
        <Badge label="Hot" variant="warning" size={Size.Small} />
      </View>

      <View style={styles.list}>
        {trending.map((coin, index) => {
          const isPositive = coin.change24h >= 0;
          return (
            <Pressable key={coin.id} style={styles.item}>
              <View style={styles.rank}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  #{index + 1}
                </Text>
              </View>
              <Avatar
                initials={coin.symbol.slice(0, 2)}
                size={Size.Small}
              />
              <View style={styles.coinInfo}>
                <Text size={Size.Small} weight="medium">
                  {coin.name}
                </Text>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  {coin.symbol}
                </Text>
              </View>
              <View style={styles.priceInfo}>
                <Text size={Size.Small} style={styles.price}>
                  ${coin.price >= 1 ? coin.price.toFixed(2) : coin.price.toFixed(4)}
                </Text>
                <Text
                  size={Size.ExtraSmall}
                  style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
                >
                  {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  rank: {
    width: 24,
  },
  coinInfo: {
    flex: 1,
    gap: 2,
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 2,
  },
  price: {
    fontFamily: "Inter, sans-serif",
  },
});
