import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Currency, PercentChange } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";

function TickerItem({ symbol, price, change }: {
  symbol: string;
  price: number;
  change: number;
}) {
  return (
    <View style={styles.tickerItem}>
      <Text size={Size.Small} weight="semibold" style={styles.symbol}>
        {symbol}
      </Text>
      <Currency
        value={price}
        currency="USD"
        decimals={price >= 1 ? 2 : 4}
        size={Size.Small}
        weight="medium"
      />
      <PercentChange
        value={change}
        size={Size.ExtraSmall}
        weight="medium"
      />
    </View>
  );
}

export function PriceTicker() {
  const { assets } = useCryptoData({ limit: 20, useMock: true });

  // Duplicate items for seamless loop effect
  const tickerItems = [...assets, ...assets];

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <div className="ticker-track">
          {tickerItems.map((asset, index) => (
            <TickerItem
              key={`${asset.id}-${index}`}
              symbol={asset.symbol}
              price={asset.price}
              change={asset.change24h}
            />
          ))}
        </div>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scrollContent}>
        {assets.map((asset) => (
          <TickerItem
            key={asset.id}
            symbol={asset.symbol}
            price={asset.price}
            change={asset.change24h}
          />
        ))}
      </View>
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
    overflow: "hidden",
  },
  scrollContent: {
    flexDirection: "row",
    gap: 32,
    paddingHorizontal: 16,
  },
  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  symbol: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
});
