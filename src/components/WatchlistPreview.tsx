import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, CardBorder, Text, Avatar, Button, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { MiniChart } from "./MiniChart";
import { useCryptoData } from "../hooks/useCryptoData";

export function WatchlistPreview() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  // Take first 4 as "watchlist" items
  const watchlistItems = assets.slice(0, 4);

  return (
    <Card style={styles.container} border={CardBorder.Gradient}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="star" size={Size.Small} appearance={TextAppearance.Warning} />
          <Text size={Size.Medium} weight="semibold">
            My Watchlist
          </Text>
        </View>
        <Button size={Size.Small} variant="ghost">
          View All →
        </Button>
      </View>

      <View style={styles.list}>
        {watchlistItems.map((coin) => {
          const isPositive = coin.change24h >= 0;
          return (
            <Pressable key={coin.id} style={styles.item}>
              <Avatar initials={coin.symbol.slice(0, 2)} size={Size.Medium} />
              <View style={styles.coinInfo}>
                <Text size={Size.Small} weight="semibold">
                  {coin.name}
                </Text>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                  {coin.symbol}
                </Text>
              </View>
              <View style={styles.chartContainer}>
                <MiniChart
                  data={coin.sparkline}
                  isPositive={isPositive}
                  width={60}
                  height={24}
                />
              </View>
              <View style={styles.priceInfo}>
                <Text size={Size.Small} weight="medium" style={styles.price}>
                  ${coin.price >= 1 ? coin.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
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

      <View style={styles.footer}>
        <Button size={Size.Small} variant="secondary" style={styles.addButton}>
          + Add to Watchlist
        </Button>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  list: {
    gap: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  coinInfo: {
    flex: 1,
    gap: 2,
  },
  chartContainer: {
    width: 60,
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 80,
  },
  price: {
    fontFamily: "Inter, sans-serif",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
  },
});
