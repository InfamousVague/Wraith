/**
 * MobileAssetRow Component - Compact mobile row for asset display
 */

import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Link } from "react-router-dom";
import { Text, Avatar, PercentChange, Currency, Button } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import { MiniChart } from "../../chart/mini-chart";
import type { MobileAssetRowProps } from "./types";

export const MobileAssetRow = React.memo(function MobileAssetRow({
  asset,
  isLast,
  borderColor,
  onTradePress,
}: MobileAssetRowProps) {
  const handleTradeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTradePress?.(asset.symbol);
  }, [asset.symbol, onTradePress]);
  return (
    <Link
      to={`/asset/${asset.id}`}
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        paddingLeft: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
        borderBottomColor: isLast ? "transparent" : borderColor,
        minHeight: 56,
        gap: 8,
      }}
    >
      <View style={styles.mobileRowLeft}>
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Small}
        />
        <View style={styles.mobileRowText}>
          <Text size={Size.Small} weight="semibold">{asset.symbol}</Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} numberOfLines={1}>
            {asset.name}
          </Text>
        </View>
      </View>
      <View style={styles.mobileRowRight}>
        <MiniChart
          data={asset.sparkline}
          isPositive={asset.change7d >= 0}
          width={56}
          height={36}
        />
        {onTradePress && (
          <Button
            label="Trade"
            appearance={Appearance.Secondary}
            size={Size.ExtraSmall}
            onPress={handleTradeClick as () => void}
          />
        )}
        <View style={styles.mobileRowPriceStack}>
          <Currency
            value={asset.price}
            size={Size.Small}
            weight="medium"
            decimals={asset.price < 1 ? 4 : 2}
            mono
          />
          <PercentChange value={asset.change24h} size={Size.ExtraSmall} />
        </View>
      </View>
    </Link>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.onTradePress === nextProps.onTradePress
  );
});

const styles = StyleSheet.create({
  mobileRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  mobileRowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  mobileRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  mobileRowPriceStack: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 70,
  },
});
