/**
 * AggregatedOrderBook Component
 *
 * Displays aggregated order book depth from multiple exchanges.
 * Shows bids and asks with visual depth representation and depth chart.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Skeleton, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { spacing } from "../../../styles/tokens";
import { useOrderBook } from "../../../hooks/useOrderBook";
import { OrderBookRow } from "./OrderBookRow";
import { OrderBookHeader } from "./OrderBookHeader";
import { SpreadDisplay } from "./SpreadDisplay";
import { ExchangeBreakdown } from "./ExchangeBreakdown";
import type { AggregatedOrderBookProps } from "./types";

export function AggregatedOrderBook({ symbol, loading: externalLoading, onPriceSelect }: AggregatedOrderBookProps) {
  const { orderBook, loading: hookLoading, error } = useOrderBook(symbol, { depth: 20 });
  const loading = externalLoading || hookLoading;

  // Calculate display parameters
  const { priceDecimals, quantityDecimals, maxBidQty, maxAskQty, displayBids, displayAsks } = useMemo(() => {
    if (!orderBook) {
      return { priceDecimals: 2, quantityDecimals: 4, maxBidQty: 0, maxAskQty: 0, displayBids: [], displayAsks: [] };
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

    // Limit to 8 levels each for display
    const bids = orderBook.bids.slice(0, 8);
    const asks = orderBook.asks.slice(0, 8);

    const maxBid = Math.max(...bids.map((l) => l.totalQuantity), 0);
    const maxAsk = Math.max(...asks.map((l) => l.totalQuantity), 0);

    return {
      priceDecimals: priceDec,
      quantityDecimals: qtyDec,
      maxBidQty: maxBid,
      maxAskQty: maxAsk,
      displayBids: bids,
      displayAsks: asks,
    };
  }, [orderBook]);

  // Use the maximum of both sides for consistent bar scaling
  const maxQuantity = Math.max(maxBidQty, maxAskQty);

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Aggregated Book
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Skeleton width={200} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={200} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={160} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={200} height={20} borderRadius={4} />
        </View>
      </Card>
    );
  }

  if (error || !orderBook) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Aggregated Book
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

  if (orderBook.bids.length === 0 && orderBook.asks.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text size={Size.Small} weight="semibold">
            Aggregated Book
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text appearance={TextAppearance.Muted} size={Size.Small}>
            Order book is empty
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text size={Size.Small} weight="semibold">
          Aggregated Book
        </Text>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          {orderBook.symbol.toUpperCase()}
        </Text>
      </View>

      {/* Spread and Imbalance */}
      <SpreadDisplay orderBook={orderBook} />

      {/* Asks (reversed to show lowest ask at bottom) */}
      <View style={styles.bookSection}>
        <Text size={Size.TwoXSmall} style={styles.sectionLabel} appearance={TextAppearance.Muted}>
          ASKS
        </Text>
        <OrderBookHeader />
        <View style={styles.ordersContainer}>
          {[...displayAsks].reverse().map((level, index) => (
            <OrderBookRow
              key={`ask-${index}`}
              level={level}
              maxQuantity={maxQuantity}
              side="ask"
              priceDecimals={priceDecimals}
              quantityDecimals={quantityDecimals}
              onPriceSelect={onPriceSelect}
            />
          ))}
        </View>
      </View>

      {/* Mid Price */}
      <View style={styles.midPriceContainer}>
        <View style={styles.midPriceLine} />
        <Currency
          value={orderBook.midPrice}
          decimals={priceDecimals}
          size={Size.Small}
          weight="semibold"
          mono
        />
        <View style={styles.midPriceLine} />
      </View>

      {/* Bids */}
      <View style={styles.bookSection}>
        <Text size={Size.TwoXSmall} style={styles.sectionLabel} appearance={TextAppearance.Muted}>
          BIDS
        </Text>
        <OrderBookHeader />
        <View style={styles.ordersContainer}>
          {displayBids.map((level, index) => (
            <OrderBookRow
              key={`bid-${index}`}
              level={level}
              maxQuantity={maxQuantity}
              side="bid"
              priceDecimals={priceDecimals}
              quantityDecimals={quantityDecimals}
              onPriceSelect={onPriceSelect}
            />
          ))}
        </View>
      </View>

      {/* Exchange Breakdown */}
      <ExchangeBreakdown orderBook={orderBook} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookSection: {
    marginBottom: spacing.xxs,
  },
  sectionLabel: {
    marginBottom: spacing.xxs,
  },
  ordersContainer: {
    // Let content determine height
  },
  midPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  midPriceLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
