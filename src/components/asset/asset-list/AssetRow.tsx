/**
 * AssetRow Component - Desktop table row for asset display
 */

import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Link } from "react-router-dom";
import { Text, Avatar, PercentChange, Currency, Tag, Button } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Typography } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { MiniChart } from "../../chart/mini-chart";
import { HighlightedText } from "../../ui/highlighted-text";
import type { AssetRowProps } from "./types";

export const AssetRow = React.memo(function AssetRow({
  asset,
  isLast,
  borderColor,
  searchQuery,
  onTradePress,
}: AssetRowProps) {
  const themeColors = useThemeColors();

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
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
        borderBottomColor: isLast ? "transparent" : borderColor,
      }}
    >
      {/* Rank */}
      <View style={styles.rankCol}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {asset.rank}
        </Text>
      </View>

      <View style={styles.assetInfo}>
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Medium}
        />
        <View style={styles.assetName}>
          <HighlightedText
            text={asset.name}
            highlight={searchQuery}
            style={{
              fontSize: 14,
              fontWeight: Typography.fontWeight.semibold as "600",
              color: themeColors.text.primary,
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          />
          <HighlightedText
            text={asset.symbol}
            highlight={searchQuery}
            style={{
              fontSize: 12,
              color: themeColors.text.muted,
            }}
          />
        </View>
      </View>

      <View style={styles.priceCol}>
        <Currency
          value={asset.price}
          size={Size.Medium}
          weight="medium"
          decimals={asset.price < 1 ? 6 : 2}
          animate
          mono
        />
      </View>

      <View style={styles.tradeCol}>
        {onTradePress ? (
          <Button
            label="Trade"
            appearance={Appearance.Secondary}
            size={Size.Small}
            onPress={handleTradeClick as () => void}
          />
        ) : asset.tradeDirection ? (
          <Tag
            direction={asset.tradeDirection}
            label={asset.tradeDirection === "up" ? "BUY" : "SELL"}
            size={Size.TwoXSmall}
          />
        ) : (
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>—</Text>
        )}
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change24h} size={Size.Medium} />
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change7d} size={Size.Medium} />
      </View>

      <View style={styles.marketCapCol}>
        <Currency
          value={asset.marketCap}
          size={Size.Medium}
          compact
          decimals={2}
          mono
        />
      </View>

      <View style={styles.volumeCol}>
        <Currency
          value={asset.volume24h}
          size={Size.Medium}
          compact
          decimals={2}
          mono
        />
      </View>

      <View style={styles.chartCol}>
        <MiniChart
          data={asset.sparkline}
          isPositive={asset.change7d >= 0}
          width={100}
          height={32}
        />
      </View>
    </Link>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.volume24h === nextProps.asset.volume24h &&
    prevProps.asset.marketCap === nextProps.asset.marketCap &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.asset.tradeDirection === nextProps.asset.tradeDirection &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.onTradePress === nextProps.onTradePress
  );
});

const styles = StyleSheet.create({
  rankCol: {
    width: 40,
  },
  assetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 2,
    minWidth: 180,
  },
  assetName: {
    gap: 2,
  },
  priceCol: {
    flex: 1,
    minWidth: 100,
  },
  tradeCol: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  changeCol: {
    flex: 1,
    minWidth: 80,
  },
  marketCapCol: {
    flex: 1,
    minWidth: 110,
  },
  volumeCol: {
    flex: 1,
    minWidth: 110,
  },
  chartCol: {
    width: 100,
    alignItems: "flex-end",
  },
});
