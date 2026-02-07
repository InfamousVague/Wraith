/**
 * @file AssetInfoCard.tsx
 * @description Floating bottom-left card showing asset icon, name, price, and 24h change.
 * Used in the Tap Trading overlay instead of BalancePill.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar, PercentChange, Currency, Card, CardBorder, CardVariant } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape } from "@wraith/ghost/enums";

import { spacing } from "../../styles/tokens";
import type { Asset } from "../../types/asset";

type AssetInfoCardProps = {
  asset: Asset | null;
  /** Override price with real-time value from WebSocket */
  livePrice?: number;
};

export function AssetInfoCard({ asset, livePrice }: AssetInfoCardProps) {
  if (!asset) return null;

  const displayPrice = livePrice ?? asset.price;

  return (
    <Card
      variant={CardVariant.Surface}
      border={CardBorder.Solid}
      shape={Shape.Rounded}
      padding={spacing.xs}
      style={styles.card}
    >
      <View style={styles.row}>
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Medium}
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text size={Size.Large} weight="bold" numberOfLines={1}>
              {asset.name}
            </Text>
            <Text size={Size.Medium} weight="semibold" style={{ opacity: 0.5 }}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    // @ts-ignore - web-only property
    pointerEvents: "auto",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
