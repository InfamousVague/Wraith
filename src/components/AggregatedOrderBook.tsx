/**
 * AggregatedOrderBook Component
 *
 * Displays aggregated order book depth from multiple exchanges.
 * Shows bids and asks with visual depth representation and depth chart.
 */

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Skeleton, Number, Currency } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useOrderBook } from "../hooks/useOrderBook";
import type { AggregatedOrderBook as OrderBookType, AggregatedLevel } from "../types/orderbook";
import { getImbalanceColor, getImbalanceLabel } from "../types/orderbook";

type AggregatedOrderBookProps = {
  symbol: string | undefined;
  loading?: boolean;
};

type OrderBookRowProps = {
  level: AggregatedLevel;
  maxQuantity: number;
  side: "bid" | "ask";
  priceDecimals: number;
  quantityDecimals: number;
};

function OrderBookRow({ level, maxQuantity, side, priceDecimals, quantityDecimals }: OrderBookRowProps) {
  const fillPercent = maxQuantity > 0 ? (level.totalQuantity / maxQuantity) * 100 : 0;
  const isBid = side === "bid";
  // Use bright colors instead of dim
  const barColor = isBid ? Colors.status.success : Colors.status.danger;
  const priceColor = isBid ? Colors.status.success : Colors.status.danger;

  return (
    <View style={styles.row}>
      {/* Depth bar - always from left side */}
      <View
        style={[
          styles.depthBar,
          {
            width: `${Math.min(fillPercent, 100)}%`,
            backgroundColor: barColor,
            opacity: 0.25,
          },
        ]}
      />
      {/* Price - using Number component */}
      <View style={styles.priceCell}>
        <Number
          value={level.price}
          format={{ decimals: priceDecimals, separator: "," }}
          size={Size.TwoXSmall}
          style={{ color: priceColor }}
          mono
        />
      </View>
      {/* Quantity - using Number component */}
      <View style={styles.quantityCell}>
        <Number
          value={level.totalQuantity}
          format={{ decimals: quantityDecimals, separator: "," }}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
          mono
        />
      </View>
      {/* Exchange count indicator */}
      <View style={styles.exchangeIndicator}>
        <Number
          value={Object.keys(level.exchanges).length}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
        />
      </View>
    </View>
  );
}

function OrderBookHeader() {
  return (
    <View style={styles.headerRow}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerPrice}>
        Price
      </Text>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerQuantity}>
        Quantity
      </Text>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.headerExchanges}>
        Ex
      </Text>
    </View>
  );
}

function SpreadDisplay({ orderBook }: { orderBook: OrderBookType }) {
  const imbalanceColor = getImbalanceColor(orderBook.imbalance);
  const imbalanceLabel = getImbalanceLabel(orderBook.imbalance);

  return (
    <View style={styles.spreadContainer}>
      <View style={styles.spreadRow}>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          Spread
        </Text>
        <Number
          value={orderBook.spreadPct * 100}
          format={{ decimals: 3, suffix: "%" }}
          size={Size.TwoXSmall}
          mono
        />
      </View>
      <View style={styles.spreadRow}>
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
          Imbalance
        </Text>
        <Number
          value={orderBook.imbalance * 100}
          format={{ decimals: 1, suffix: "%" }}
          size={Size.TwoXSmall}
          style={{ color: imbalanceColor }}
          mono
        />
      </View>
      <View style={styles.imbalanceBarContainer}>
        <View style={styles.imbalanceBar}>
          <View
            style={[
              styles.imbalanceFill,
              {
                width: `${50 + orderBook.imbalance * 50}%`,
                backgroundColor: imbalanceColor,
              },
            ]}
          />
        </View>
        <View style={styles.imbalanceCenterContainer}>
          <View style={styles.imbalanceCenter} />
        </View>
      </View>
      <Text size={Size.TwoXSmall} style={{ color: imbalanceColor, textAlign: "center" }}>
        {imbalanceLabel}
      </Text>
    </View>
  );
}

function ExchangeBreakdown({ orderBook }: { orderBook: OrderBookType }) {
  if (orderBook.exchanges.length === 0) return null;

  return (
    <View style={styles.exchangeBreakdown}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.exchangeLabel}>
        Sources ({orderBook.exchangeCount})
      </Text>
      <View style={styles.exchangeTags}>
        {orderBook.exchanges.map((exchange) => (
          <View key={exchange} style={styles.exchangeTag}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {exchange}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AggregatedOrderBook({ symbol, loading: externalLoading }: AggregatedOrderBookProps) {
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
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  spreadContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    marginBottom: 12,
  },
  spreadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  imbalanceBarContainer: {
    marginTop: 4,
    marginBottom: 2,
    position: "relative",
  },
  imbalanceBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  imbalanceFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  imbalanceCenterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -2,
    bottom: -2,
    alignItems: "center",
    justifyContent: "center",
  },
  imbalanceCenter: {
    width: 2,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  bookSection: {
    marginBottom: 4,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerPrice: {
    flex: 1,
  },
  headerQuantity: {
    flex: 1,
    textAlign: "right",
  },
  headerExchanges: {
    width: 24,
    textAlign: "center",
  },
  ordersContainer: {
    // Removed flex: 1 to let content determine height
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    position: "relative",
  },
  depthBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0, // Always from left side
    borderRadius: 2,
  },
  priceCell: {
    flex: 1,
    zIndex: 1,
  },
  quantityCell: {
    flex: 1,
    alignItems: "flex-end",
    zIndex: 1,
  },
  exchangeIndicator: {
    width: 24,
    alignItems: "center",
    zIndex: 1,
  },
  midPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  midPriceLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  exchangeBreakdown: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  exchangeLabel: {
    marginBottom: 6,
  },
  exchangeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  exchangeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
});
