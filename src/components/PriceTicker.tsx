import React, { useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Currency, PercentChange, Skeleton } from "@wraith/ghost/components";
import { Size, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useCryptoData } from "../hooks/useCryptoData";

// Edge fade gradient component for web - static style, no hooks needed
function EdgeFade({ side, color }: { side: "left" | "right"; color: string }) {
  // Platform check must be after hooks, or we use no hooks at all
  if (Platform.OS !== "web") return null;

  const gradientDirection = side === "left" ? "to right" : "to left";

  // Inline style - no useMemo to avoid hooks order issues
  const style: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: 60,
    background: `linear-gradient(${gradientDirection}, ${color} 0%, ${color}dd 30%, transparent 100%)`,
    pointerEvents: "none",
    zIndex: 10,
  };

  return <div style={style} />;
}

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
        brightness={Brightness.Soft}
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
      <Skeleton width={36} height={16} borderRadius={4} />
      <Skeleton width={90} height={16} borderRadius={4} />
      <Skeleton width={56} height={14} borderRadius={4} />
    </View>
  );
}

export function PriceTicker() {
  const { assets, loading, error } = useCryptoData({ limit: 20, useMock: false });
  // Show loading state when there's an error (no data to display)
  const showLoading = loading || (error !== null && assets.length === 0);
  const themeColors = useThemeColors();

  // IMPORTANT: All hooks must be called before any conditional returns!
  // Memoize duplicated items for seamless loop effect
  const tickerItems = useMemo(() => [...assets, ...assets], [assets]);

  // Loading items array (static, no memo needed)
  const loadingItems = Array.from({ length: 20 });

  // Show loading skeletons while data loads or on error (still scrolling)
  if (showLoading) {
    if (Platform.OS === "web") {
      return (
        <View style={[styles.container, { borderTopColor: themeColors.border.subtle, borderBottomColor: themeColors.border.subtle }]}>
          <EdgeFade side="left" color={themeColors.background.canvas} />
          <EdgeFade side="right" color={themeColors.background.canvas} />
          <div className="ticker-track">
            {loadingItems.map((_, i) => (
              <LoadingTickerItem key={`loading-${i}`} />
            ))}
          </div>
        </View>
      );
    }

    return (
      <View style={[styles.container, { borderTopColor: themeColors.border.subtle, borderBottomColor: themeColors.border.subtle }]}>
        <View style={styles.loadingTrack}>
          {loadingItems.slice(0, 10).map((_, i) => (
            <LoadingTickerItem key={`loading-${i}`} />
          ))}
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { borderTopColor: themeColors.border.subtle, borderBottomColor: themeColors.border.subtle }]}>
        <EdgeFade side="left" color={themeColors.background.canvas} />
        <EdgeFade side="right" color={themeColors.background.canvas} />
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
    <View style={[styles.container, { borderTopColor: themeColors.border.subtle, borderBottomColor: themeColors.border.subtle }]}>
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
    paddingVertical: 12,
    overflow: "hidden",
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
    paddingHorizontal: 4,
  },
  symbol: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
});
