/**
 * @file OrderBookPanel.tsx
 * @description Order book panel for the trade sandbox with click-to-fill functionality.
 *
 * Wraps the existing AggregatedOrderBook component and adds:
 * - Click on price level to fill order form
 * - Optimized display for trading interface
 */

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useOrderBook } from "../../../hooks/useOrderBook";
import type { OrderBookPanelProps, PriceLevel } from "./types";

export function OrderBookPanel({
  symbol,
  onPriceSelect,
  loading: externalLoading,
}: OrderBookPanelProps) {
  const { orderBook, loading: hookLoading, error } = useOrderBook(symbol, { depth: 15 });
  const loading = externalLoading || hookLoading;

  // Calculate display parameters
  const { displayBids, displayAsks, maxTotal, spread, spreadPercent, priceDecimals, quantityDecimals } = useMemo(() => {
    if (!orderBook) {
      return {
        displayBids: [],
        displayAsks: [],
        maxTotal: 0,
        spread: 0,
        spreadPercent: 0,
        priceDecimals: 2,
        quantityDecimals: 4,
      };
    }

    // Determine price decimals based on price magnitude
    const midPrice = orderBook.midPrice;
    let priceDec = 2;
    if (midPrice > 10000) priceDec = 0;
    else if (midPrice > 100) priceDec = 2;
    else if (midPrice > 1) priceDec = 4;
    else priceDec = 6;

    // Determine quantity decimals
    const avgQty = (orderBook.bidTotal + orderBook.askTotal) / (orderBook.bids.length + orderBook.asks.length || 1);
    let qtyDec = 4;
    if (avgQty > 1000) qtyDec = 2;
    else if (avgQty > 1) qtyDec = 4;
    else qtyDec = 6;

    // Limit to 10 levels each side
    const bids = orderBook.bids.slice(0, 10);
    const asks = orderBook.asks.slice(0, 10).reverse(); // Reverse to show lowest ask first

    // Calculate cumulative totals
    let bidCumulative = 0;
    const bidsWithTotal: PriceLevel[] = bids.map((level) => {
      bidCumulative += level.totalQuantity;
      return {
        price: level.price,
        quantity: level.totalQuantity,
        total: bidCumulative,
      };
    });

    let askCumulative = 0;
    const asksWithTotal: PriceLevel[] = asks.map((level) => {
      askCumulative += level.totalQuantity;
      return {
        price: level.price,
        quantity: level.totalQuantity,
        total: askCumulative,
      };
    });

    const maxBidTotal = bidCumulative;
    const maxAskTotal = askCumulative;
    const maxTotalValue = Math.max(maxBidTotal, maxAskTotal);

    // Calculate spread
    const bestBid = bids[0]?.price || 0;
    const bestAsk = orderBook.asks[0]?.price || 0;
    const spreadValue = bestAsk - bestBid;
    const spreadPct = bestBid > 0 ? (spreadValue / bestBid) * 100 : 0;

    return {
      displayBids: bidsWithTotal,
      displayAsks: asksWithTotal.reverse(), // Reverse back to show highest ask at top
      maxTotal: maxTotalValue,
      spread: spreadValue,
      spreadPercent: spreadPct,
      priceDecimals: priceDec,
      quantityDecimals: qtyDec,
    };
  }, [orderBook]);

  const handlePriceClick = useCallback(
    (price: number, side: "bid" | "ask") => {
      if (onPriceSelect) {
        onPriceSelect(price, side);
      }
    },
    [onPriceSelect]
  );

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Order Book
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} width="100%" height={20} style={{ marginBottom: 4 }} />
          ))}
        </View>
      </Card>
    );
  }

  if (error || !orderBook) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Order Book
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text appearance={TextAppearance.Muted} size={Size.Small}>
            {error || "No order book data available"}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text size={Size.Small} weight="semibold">
          Order Book
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {symbol}
        </Text>
      </View>

      {/* Column Headers */}
      <View style={styles.columnHeaders}>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.priceHeader}>
          Price
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.quantityHeader}>
          Size
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.totalHeader}>
          Total
        </Text>
      </View>

      {/* Asks (sells) - reversed so lowest ask is at bottom near spread */}
      <View style={styles.levels}>
        {displayAsks.map((level, index) => (
          <PriceLevelRow
            key={`ask-${level.price}`}
            level={level}
            maxTotal={maxTotal}
            side="ask"
            priceDecimals={priceDecimals}
            quantityDecimals={quantityDecimals}
            onClick={handlePriceClick}
          />
        ))}
      </View>

      {/* Spread Display */}
      <View style={styles.spreadContainer}>
        <Text size={Size.Small} style={styles.spreadPrice}>
          ${orderBook.midPrice.toLocaleString(undefined, { maximumFractionDigits: priceDecimals })}
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          Spread: ${spread.toFixed(priceDecimals)} ({spreadPercent.toFixed(3)}%)
        </Text>
      </View>

      {/* Bids (buys) */}
      <View style={styles.levels}>
        {displayBids.map((level, index) => (
          <PriceLevelRow
            key={`bid-${level.price}`}
            level={level}
            maxTotal={maxTotal}
            side="bid"
            priceDecimals={priceDecimals}
            quantityDecimals={quantityDecimals}
            onClick={handlePriceClick}
          />
        ))}
      </View>
    </Card>
  );
}

interface PriceLevelRowProps {
  level: PriceLevel;
  maxTotal: number;
  side: "bid" | "ask";
  priceDecimals: number;
  quantityDecimals: number;
  onClick?: (price: number, side: "bid" | "ask") => void;
}

function PriceLevelRow({
  level,
  maxTotal,
  side,
  priceDecimals,
  quantityDecimals,
  onClick,
}: PriceLevelRowProps) {
  const depthPercent = maxTotal > 0 ? (level.total / maxTotal) * 100 : 0;
  const barColor = side === "bid" ? Colors.status.successDim || "rgba(47, 213, 117, 0.15)" : Colors.status.dangerDim || "rgba(255, 92, 122, 0.15)";
  const textColor = side === "bid" ? Colors.status.success : Colors.status.danger;

  const depthBarStyle = side === "bid"
    ? { left: 0, right: undefined }
    : { right: 0, left: undefined };

  return (
    <Pressable
      style={styles.levelRow}
      onPress={() => onClick?.(level.price, side)}
    >
      {/* Depth bar background */}
      <View
        style={[
          styles.depthBar,
          {
            width: `${depthPercent}%`,
            backgroundColor: barColor,
          },
          depthBarStyle,
        ]}
      />

      {/* Content */}
      <Text size={Size.ExtraSmall} style={[styles.priceCell, { color: textColor }]}>
        {level.price.toLocaleString(undefined, { minimumFractionDigits: priceDecimals, maximumFractionDigits: priceDecimals })}
      </Text>
      <Text size={Size.ExtraSmall} style={styles.quantityCell}>
        {level.quantity.toLocaleString(undefined, { maximumFractionDigits: quantityDecimals })}
      </Text>
      <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.totalCell}>
        {level.total.toLocaleString(undefined, { maximumFractionDigits: quantityDecimals })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  columnHeaders: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  priceHeader: {
    flex: 1,
  },
  quantityHeader: {
    flex: 1,
    textAlign: "right",
  },
  totalHeader: {
    flex: 1,
    textAlign: "right",
  },
  levels: {
    flex: 1,
  },
  levelRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    position: "relative",
  },
  depthBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  priceCell: {
    flex: 1,
    zIndex: 1,
    fontWeight: "500",
  },
  quantityCell: {
    flex: 1,
    textAlign: "right",
    zIndex: 1,
  },
  totalCell: {
    flex: 1,
    textAlign: "right",
    zIndex: 1,
  },
  spreadContainer: {
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.raised,
  },
  spreadPrice: {
    fontWeight: "700",
  },
  loadingContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
});
