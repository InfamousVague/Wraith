/**
 * PriceFeedCard Component
 *
 * @fileoverview Live price update feed showing real-time cryptocurrency price
 * changes from WebSocket with animated entries and statistics.
 *
 * @description
 * Features:
 * - **Live Price Feed**: Scrolling list of price updates via WebSocket
 * - **Animated Entries**: Fade-out animation for aging events using pooled Animated.Value
 * - **Statistics Display**: Updates tracked, TPS, uptime, symbols, and sources count
 * - **Connection Status**: Visual indicator for WebSocket connection state
 * - **Source Attribution**: Shows which exchange sourced each update
 *
 * Performance optimizations:
 * - `animatedValuePool`: Reusable Animated.Value objects to prevent memory leaks
 * - Memoized sub-components prevent unnecessary re-renders
 * - Event cleanup releases animations back to pool
 *
 * @example
 * <PriceFeedCard maxEvents={20} eventLifetime={30000} />
 *
 * @exports PriceFeedCard - Main component
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, AnimatedNumber } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing, radii } from "../../../styles/tokens";
import { useHauntSocket, type PriceUpdate } from "../../../hooks/useHauntSocket";
import { FeedEventLine } from "./FeedEventLine";
import { getAnimatedValue, releaseAnimatedValue } from "./utils/animationPool";
import { formatUptime, SYMBOL_NAMES } from "./utils/formatters";
import type { FeedEvent, StatsData, PriceFeedCardProps } from "./types";

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
              <View style={[styles.connectionDot, { backgroundColor: connected ? Colors.status.success : Colors.status.danger }]} />
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

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 356,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    gap: spacing.md,
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
    marginBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xxs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
});
