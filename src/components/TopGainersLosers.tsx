import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardBorder, CardGlow, Text, Avatar, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

function GainerLoserItem({ symbol, name, price, change, isGainer }: {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isGainer: boolean;
}) {
  return (
    <View style={styles.item}>
      <Avatar initials={symbol.slice(0, 2)} size={Size.Small} />
      <View style={styles.coinInfo}>
        <Text size={Size.Small} weight="medium">
          {symbol}
        </Text>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.changeInfo}>
        <Icon
          name={isGainer ? "arrow-up" : "arrow-down"}
          size={Size.TwoXSmall}
          appearance={isGainer ? TextAppearance.Success : TextAppearance.Danger}
        />
        <Text
          size={Size.Small}
          weight="semibold"
          style={{ color: isGainer ? "#22c55e" : "#ef4444" }}
        >
          {Math.abs(change).toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

export function TopGainersLosers() {
  const { assets } = useCryptoData({ limit: 10, useMock: true });

  const gainers = [...assets]
    .filter(a => a.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, 3);

  const losers = [...assets]
    .filter(a => a.change24h < 0)
    .sort((a, b) => a.change24h - b.change24h)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Card style={styles.card} border={CardBorder.Gradient} glow={CardGlow.Green}>
        <View style={styles.header}>
          <Icon name="arrow-up" size={Size.Small} appearance={TextAppearance.Success} />
          <Text size={Size.Small} weight="semibold">
            Top Gainers
          </Text>
        </View>
        <View style={styles.list}>
          {gainers.map((coin) => (
            <GainerLoserItem
              key={coin.id}
              symbol={coin.symbol}
              name={coin.name}
              price={coin.price}
              change={coin.change24h}
              isGainer={true}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card} border={CardBorder.Gradient} glow={CardGlow.Red}>
        <View style={styles.header}>
          <Icon name="arrow-down" size={Size.Small} appearance={TextAppearance.Danger} />
          <Text size={Size.Small} weight="semibold">
            Top Losers
          </Text>
        </View>
        <View style={styles.list}>
          {losers.map((coin) => (
            <GainerLoserItem
              key={coin.id}
              symbol={coin.symbol}
              name={coin.name}
              price={coin.price}
              change={coin.change24h}
              isGainer={false}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 16,
  },
  card: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinInfo: {
    flex: 1,
    gap: 2,
  },
  changeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
