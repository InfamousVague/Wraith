import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { Card, Text, Currency, PercentChange, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { useHauntSocket, type PriceUpdate, type PriceSourceId } from "../hooks/useHauntSocket";

// Pool of reusable Animated.Value objects to prevent memory leaks
const animatedValuePool: Animated.Value[] = [];
const MAX_POOL_SIZE = 50;

function getAnimatedValue(): Animated.Value {
  if (animatedValuePool.length > 0) {
    const value = animatedValuePool.pop()!;
    value.setValue(1);
    return value;
  }
  return new Animated.Value(1);
}

function releaseAnimatedValue(value: Animated.Value): void {
  value.stopAnimation();
  if (animatedValuePool.length < MAX_POOL_SIZE) {
    animatedValuePool.push(value);
  }
}

// Map symbol to name for display
const SYMBOL_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  bnb: "BNB",
  sol: "Solana",
  xrp: "XRP",
  doge: "Dogecoin",
  ada: "Cardano",
  avax: "Avalanche",
  dot: "Polkadot",
  link: "Chainlink",
  matic: "Polygon",
  shib: "Shiba Inu",
  ltc: "Litecoin",
  trx: "Tron",
  atom: "Cosmos",
  uni: "Uniswap",
  xlm: "Stellar",
  bch: "Bitcoin Cash",
  near: "NEAR",
  apt: "Aptos",
};

type FeedEvent = {
  id: string;
  symbol: string;
  name: string;
  action: "rose" | "dropped";
  price: number;
  previousPrice?: number;
  percentChange?: number;
  source?: PriceSourceId;
  timestamp: Date;
  opacity: Animated.Value;
};

type StatsData = {
  tps: number;
  uptimeSecs: number;
  activeSymbols: number;
  onlineSources: number;
  totalSources: number;
};

// Format source name for display
function formatSource(source?: PriceSourceId): string {
  if (!source) return "";
  const sourceNames: Record<PriceSourceId, string> = {
    binance: "Binance",
    coinbase: "Coinbase",
    coinmarketcap: "CMC",
    coingecko: "CoinGecko",
    cryptocompare: "CryptoCompare",
    kraken: "Kraken",
    kucoin: "KuCoin",
    okx: "OKX",
    huobi: "Huobi",
  };
  return sourceNames[source] || source;
}

// Format seconds to human-readable uptime
function formatUptime(secs: number): string {
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

type PriceFeedCardProps = {
  maxEvents?: number;
  eventLifetime?: number; // ms before event starts fading
  loading?: boolean;
};

export function PriceFeedCard({
  maxEvents = 15,
  eventLifetime = 30000, // 30 seconds
  loading = false,
}: PriceFeedCardProps) {
  const { connected, onPriceUpdate, subscribe, updateCount } = useHauntSocket();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const eventsRef = useRef<FeedEvent[]>([]);
  const themeColors = useThemeColors();

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/market/stats");
      if (response.ok) {
        const json = await response.json();
        setStats(json.data || null);
      }
    } catch {
      // Silently fail - stats are optional
    }
  }, []);

  // Poll stats every 2 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Memoize top assets to prevent recreation
  const topAssets = useMemo(() => Object.keys(SYMBOL_NAMES), []);

  // Subscribe to top assets when connected
  useEffect(() => {
    if (connected) {
      subscribe(topAssets);
    }
  }, [connected, subscribe, topAssets]);

  // Handle price updates - using pooled Animated.Value to prevent memory leaks
  const handlePriceUpdate = useCallback(
    (update: PriceUpdate) => {
      const symbol = update.symbol.toLowerCase();
      const name = SYMBOL_NAMES[symbol] || update.symbol.toUpperCase();

      // Determine if price went up or down
      let action: "rose" | "dropped" = "rose";
      let percentChange = update.change24h;

      if (update.previousPrice !== undefined && update.previousPrice > 0) {
        const priceDiff = update.price - update.previousPrice;
        action = priceDiff >= 0 ? "rose" : "dropped";
        // Calculate instant change if no 24h change provided
        if (percentChange === undefined) {
          percentChange = (priceDiff / update.previousPrice) * 100;
        }
      } else if (update.change24h !== undefined) {
        action = update.change24h >= 0 ? "rose" : "dropped";
      }

      const newEvent: FeedEvent = {
        id: `${symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        name,
        action,
        price: update.price,
        previousPrice: update.previousPrice,
        percentChange,
        source: update.source,
        timestamp: new Date(update.timestamp),
        opacity: getAnimatedValue(), // Use pooled value instead of creating new
      };

      setEvents((prev) => {
        // Release Animated.Value back to pool for events being removed
        const eventsToRemove = prev.slice(maxEvents - 1);
        eventsToRemove.forEach((e) => releaseAnimatedValue(e.opacity));

        const updated = [newEvent, ...prev].slice(0, maxEvents);
        eventsRef.current = updated;
        return updated;
      });
    },
    [maxEvents]
  );

  // Register for price updates
  useEffect(() => {
    return onPriceUpdate(handlePriceUpdate);
  }, [onPriceUpdate, handlePriceUpdate]);

  // Fade out and cleanup old events
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setEvents((prev) => {
        let hasChanges = false;
        const updated: FeedEvent[] = [];

        for (const event of prev) {
          const age = now - event.timestamp.getTime();

          if (age >= eventLifetime + 10000) {
            // Event expired - release animation back to pool and don't include
            releaseAnimatedValue(event.opacity);
            hasChanges = true;
            continue;
          }

          if (age > eventLifetime) {
            // Start fading out
            const fadeProgress = Math.min((age - eventLifetime) / 10000, 1);
            event.opacity.setValue(1 - fadeProgress * 0.7); // Fade to 0.3 min opacity
          }

          updated.push(event);
        }

        if (!hasChanges && updated.length === prev.length) {
          return prev; // No changes, don't trigger re-render
        }

        eventsRef.current = updated;
        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [eventLifetime]);

  // Cleanup all animations on unmount - release back to pool
  useEffect(() => {
    return () => {
      eventsRef.current.forEach((e) => releaseAnimatedValue(e.opacity));
    };
  }, []);

  return (
    <Card style={styles.card} loading={loading}>
      <View style={styles.content}>
        {/* Header with Updates Tracked + Live badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                UPDATES TRACKED
              </Text>
              <View style={[styles.connectionDot, { backgroundColor: connected ? "#22c55e" : "#ef4444" }]} />
            </View>
            <AnimatedNumber
              value={updateCount}
              decimals={0}
              separator=","
              size={Size.TwoXLarge}
              weight="bold"
              appearance={TextAppearance.Link}
              animate
              animationDuration={200}
            />
          </View>
          <View style={styles.tpsBadge}>
            <AnimatedNumber
              value={stats?.tps || 0}
              decimals={1}
              size={Size.Small}
              weight="semibold"
              appearance={TextAppearance.Muted}
              animate
              animationDuration={200}
            />
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              /sec
            </Text>
          </View>
        </View>

        {/* Metrics row - fixed width columns for alignment */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Uptime
            </Text>
            <Text size={Size.Small} weight="semibold">
              {formatUptime(stats?.uptimeSecs || 0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Symbols
            </Text>
            <AnimatedNumber
              value={stats?.activeSymbols || 0}
              decimals={0}
              separator=","
              size={Size.Small}
              weight="semibold"
              animate
              animationDuration={200}
            />
          </View>
          <View style={styles.metricItem}>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Sources
            </Text>
            <View style={styles.metricValue}>
              <AnimatedNumber
                value={stats?.onlineSources || 0}
                decimals={0}
                size={Size.Small}
                weight="semibold"
                animate
                animationDuration={200}
              />
              <Text size={Size.Small} weight="semibold" appearance={TextAppearance.Muted}>
                /{stats?.totalSources || 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                {connected ? "Waiting for updates..." : "Connecting..."}
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <FeedEventLine key={event.id} event={event} />
            ))
          )}
        </ScrollView>
      </View>
    </Card>
  );
}

type FeedEventLineProps = {
  event: FeedEvent;
};

const FeedEventLine = memo(function FeedEventLine({ event }: FeedEventLineProps) {
  const sourceName = formatSource(event.source);

  return (
    <Animated.View
      style={[
        styles.eventLine,
        { opacity: event.opacity },
      ]}
    >
      <Text size={Size.ExtraSmall} weight="medium" style={styles.eventSymbol}>
        {event.symbol.toUpperCase()}
      </Text>

      <Currency
        value={event.price}
        size={Size.ExtraSmall}
        weight="medium"
        compact
        decimals={event.price >= 1 ? 2 : 6}
        mono
      />

      {event.percentChange !== undefined && Math.abs(event.percentChange) >= 0.01 ? (
        <PercentChange
          value={event.percentChange}
          size={Size.TwoXSmall}
          showArrow={false}
        />
      ) : null}

      {sourceName ? (
        <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.eventSource}>
          via {sourceName}
        </Text>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 356,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tpsBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 16,
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  eventLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  eventSymbol: {
    width: 40,
  },
  eventSource: {
    marginLeft: "auto",
  },
});
