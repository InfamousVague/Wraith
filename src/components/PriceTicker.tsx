import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

function TickerItem({ name, symbol, price, change }: {
  name: string;
  symbol: string;
  price: number;
  change: number;
}) {
  const isPositive = change >= 0;

  return (
    <View style={styles.tickerItem}>
      <Text size={Size.Small} weight="semibold" style={styles.symbol}>
        {symbol}
      </Text>
      <Text size={Size.Small} style={styles.price}>
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
      <Text
        size={Size.ExtraSmall}
        style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
      >
        {isPositive ? "+" : ""}{change.toFixed(2)}%
      </Text>
    </View>
  );
}

export function PriceTicker() {
  const { assets } = useCryptoData({ limit: 20, useMock: true });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {assets.map((asset) => (
          <TickerItem
            key={asset.id}
            name={asset.name}
            symbol={asset.symbol}
            price={asset.price}
            change={asset.change24h}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  scrollContent: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 16,
  },
  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbol: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  price: {
    fontFamily: "Inter, sans-serif",
  },
});
