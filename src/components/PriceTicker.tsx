import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Currency, PercentChange, Skeleton } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { useCryptoData } from "../hooks/useCryptoData";
import { useTheme } from "../context/ThemeContext";

const themes = {
  dark: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "rgba(255, 255, 255, 0.06)",
  },
  light: {
    background: "rgba(0, 0, 0, 0.02)",
    border: "rgba(0, 0, 0, 0.06)",
  },
};

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

function LoadingTickerItem() {
  return (
    <View style={styles.tickerItem}>
      <Skeleton width={40} height={14} borderRadius={4} />
      <Skeleton width={80} height={14} borderRadius={4} />
      <Skeleton width={50} height={12} borderRadius={4} />
    </View>
  );
}

export function PriceTicker() {
  const { assets, loading } = useCryptoData({ limit: 20, useMock: true });
  const { isDark } = useTheme();
  const colors = isDark ? themes.dark : themes.light;

  // Show loading skeletons while data loads
  if (loading || assets.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.loadingTrack}>
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingTickerItem key={i} />
          ))}
        </View>
      </View>
    );
  }

  // Duplicate items for seamless loop effect
  const tickerItems = [...assets, ...assets];

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  loadingTrack: {
    flexDirection: "row",
    gap: 32,
    paddingHorizontal: 16,
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
