/**
 * @file AssetInfoCard.tsx
 * @description Floating bottom-left card showing asset icon, name, price, and 24h change.
 * Used in the Tap Trading overlay instead of BalancePill.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar, PercentChange, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../styles/tokens";
import type { Asset } from "../../types/asset";

type AssetInfoCardProps = {
  asset: Asset | null;
  /** Override price with real-time value from WebSocket */
  livePrice?: number;
};

export function AssetInfoCard({ asset, livePrice }: AssetInfoCardProps) {
  const themeColors = useThemeColors();

  if (!asset) return null;

  const displayPrice = livePrice ?? asset.price;

  return (
    <View style={[styles.card, { borderColor: themeColors.border.subtle }]}>
      <Avatar
        uri={asset.image}
        initials={asset.symbol.slice(0, 2)}
        size={Size.Medium}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text size={Size.Medium} weight="bold" numberOfLines={1}>
            {asset.name}
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            {asset.symbol}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Currency
            value={displayPrice}
            size={Size.Medium}
            weight="semibold"
            decimals={displayPrice < 1 ? 6 : 2}
          />
          <PercentChange value={asset.change24h} size={Size.Small} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: Colors.background.surface,
    borderRadius: 14,
    borderWidth: 1,
    // @ts-ignore - web-only property
    pointerEvents: "auto",
  },
  info: {
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
