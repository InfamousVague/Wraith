/**
 * @file PriceTicker.tsx
 * @description Scrolling horizontal price ticker showing live crypto prices.
 *
 * ## Features:
 * - Seamless infinite scroll animation (CSS-based on web)
 * - Edge fade gradients for visual polish
 * - Loading skeleton state during data fetch
 * - Memoized items to prevent unnecessary re-renders
 * - Duplicate items for seamless loop effect
 *
 * ## Props:
 * None - fetches data internally via useCryptoData hook
 *
 * ## Platform Handling:
 * - Web: CSS animation for ticker-track, linear-gradient edge fades
 * - Native: Static ScrollView (no animation)
 */
import React, { useMemo } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { Text, Currency, PercentChange, Skeleton } from "@wraith/ghost/components";
import { Size, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import { useCryptoData } from "../../../hooks/useCryptoData";

// Edge fade gradient component for web - static style, no hooks needed
function EdgeFade({ side, color }: { side: "left" | "right"; color: string }) {
  if (Platform.OS !== "web") return null;

  const gradientDirection = side === "left" ? "to right" : "to left";

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

// Get consistent decimal places for price display
function getDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 2;
  if (price >= 0.01) return 4;
  return 6;
}

// Web-specific clickable ticker item using native HTML events
const WebTickerItem = React.memo(function WebTickerItem({ id, symbol, price, change, onPress }: {
  id: string;
  symbol: string;
  price: number;
  change: number;
  onPress: (id: string) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPress(id);
  };

  const decimals = getDecimals(price);

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flexShrink: 0,
        paddingLeft: spacing.xs,
        paddingRight: spacing.xs,
        paddingTop: spacing.xxs,
        paddingBottom: spacing.xxs,
        borderRadius: 4,
        cursor: "pointer",
      }}
      className="ticker-item"
    >
      <Text size={Size.Small} weight="semibold" style={styles.symbol}>
        {symbol}
      </Text>
      <span style={{ minWidth: 85, textAlign: "right", display: "inline-block" }}>
        <Currency
          value={price}
          currency="USD"
          decimals={decimals}
          size={Size.Small}
          weight="medium"
          brightness={Brightness.Soft}
          mono
        />
      </span>
      <PercentChange
        value={change}
        size={Size.ExtraSmall}
        weight="medium"
        mono
      />
    </div>
  );
});

// Native ticker item using Pressable
const NativeTickerItem = React.memo(function NativeTickerItem({ id, symbol, price, change, onPress }: {
  id: string;
  symbol: string;
  price: number;
  change: number;
  onPress: (id: string) => void;
}) {
  const decimals = getDecimals(price);

  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.tickerItem,
        pressed && styles.tickerItemPressed,
      ]}
    >
      <Text size={Size.Small} weight="semibold" style={styles.symbol}>
        {symbol}
      </Text>
      <View style={styles.priceContainer}>
        <Currency
          value={price}
          currency="USD"
          decimals={decimals}
          size={Size.Small}
          weight="medium"
          brightness={Brightness.Soft}
          mono
        />
      </View>
      <PercentChange
        value={change}
        size={Size.ExtraSmall}
        weight="medium"
        mono
      />
    </Pressable>
  );
});

function LoadingTickerItem() {
  return (
    <View style={styles.tickerItem}>
      <Skeleton width={36} height={16} borderRadius={4} />
      <Skeleton width={90} height={16} borderRadius={4} />
      <Skeleton width={56} height={14} borderRadius={4} />
    </View>
  );
}

// Static loading items - created once
const LOADING_ITEMS = Array.from({ length: 10 });

export const PriceTicker = React.memo(function PriceTicker() {
  const { assets, loading, error } = useCryptoData({ limit: 20, useMock: false });
  const showLoading = loading || (error !== null && assets.length === 0);
  const themeColors = useThemeColors();
  const navigate = useNavigate();

  // Navigate to asset detail page
  const handleAssetPress = (id: string) => {
    navigate(`/asset/${id}`);
  };

  // Memoize container style
  const containerStyle = useMemo(() => [
    styles.container,
    { borderTopColor: themeColors.border.subtle, borderBottomColor: themeColors.border.subtle }
  ], [themeColors.border.subtle]);

  // Memoize duplicated items for seamless loop effect - only duplicate once
  const tickerItems = useMemo(() => [...assets, ...assets], [assets]);

  // Show loading skeletons while data loads or on error
  if (showLoading) {
    if (Platform.OS === "web") {
      return (
        <View style={containerStyle}>
          <EdgeFade side="left" color={themeColors.background.canvas} />
          <EdgeFade side="right" color={themeColors.background.canvas} />
          <div className="ticker-track">
            {LOADING_ITEMS.map((_, i) => (
              <LoadingTickerItem key={`loading-${i}`} />
            ))}
          </div>
        </View>
      );
    }

    return (
      <View style={containerStyle}>
        <View style={styles.loadingTrack}>
          {LOADING_ITEMS.map((_, i) => (
            <LoadingTickerItem key={`loading-${i}`} />
          ))}
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={containerStyle}>
        <EdgeFade side="left" color={themeColors.background.canvas} />
        <EdgeFade side="right" color={themeColors.background.canvas} />
        <div className="ticker-track">
          {tickerItems.map((asset, index) => (
            <WebTickerItem
              key={`${asset.id}-${index}`}
              id={asset.id}
              symbol={asset.symbol}
              price={asset.price}
              change={asset.change24h}
              onPress={handleAssetPress}
            />
          ))}
        </div>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={styles.scrollContent}>
        {assets.map((asset) => (
          <NativeTickerItem
            key={asset.id}
            id={asset.id}
            symbol={asset.symbol}
            price={asset.price}
            change={asset.change24h}
            onPress={handleAssetPress}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    overflow: "hidden",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  loadingTrack: {
    flexDirection: "row",
    gap: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    flexDirection: "row",
    gap: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: 4,
    cursor: "pointer",
  },
  tickerItemPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  priceContainer: {
    minWidth: 85,
    alignItems: "flex-end",
  },
  symbol: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
});
