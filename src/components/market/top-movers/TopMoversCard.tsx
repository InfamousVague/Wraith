/**
 * TopMoversCard Component
 *
 * @fileoverview Displays top gaining and losing assets across configurable
 * timeframes with real-time price updates via WebSocket.
 *
 * @description
 * Features:
 * - **Timeframe Selection**: 5m, 15m, 1H, 4H, 24H options
 * - **Gainers/Losers Toggle**: Switch between top gainers and losers
 * - **Real-time Updates**: WebSocket subscription for live prices
 * - **Asset Images**: CMC ID mapping for avatar images (130+ coins)
 * - **Ranked List**: Shows rank, symbol, price, and percent change
 *
 * Data flow:
 * 1. Fetches movers from `/api/market/movers` endpoint
 * 2. Subscribes to WebSocket for all displayed symbols
 * 3. Updates prices in real-time without re-fetching
 * 4. Auto-refreshes full list at configurable poll interval
 *
 * @example
 * <TopMoversCard
 *   timeframe="1h"
 *   pollInterval={5000}
 *   assetType="crypto"
 * />
 *
 * @exports TopMoversCard - Main component
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, SegmentedControl, Button } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance, Shape } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import { hauntClient, type Mover, type MoverTimeframe, type AssetType } from "../../../services/haunt";
import { useHauntSocket, type PriceUpdate } from "../../../hooks/useHauntSocket";
import { MoverRow } from "./MoverRow";
import { TIMEFRAME_OPTIONS } from "./utils/timeframeOptions";
import type { TopMoversCardProps } from "./types";

export function TopMoversCard({
  loading = false,
  pollInterval = 5000,
  assetType = "all",
}: TopMoversCardProps) {
  const { t } = useTranslation("components");
  const [timeframe, setTimeframe] = useState<MoverTimeframe>("1h");
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGainers, setShowGainers] = useState(true);
  const themeColors = useThemeColors();

  // WebSocket for real-time price updates
  const { connected, subscribe, onPriceUpdate } = useHauntSocket();

  const fetchMovers = useCallback(async () => {
    try {
      const response = await hauntClient.getMovers(timeframe, 10, assetType);
      setGainers(response.data?.gainers || []);
      setLosers(response.data?.losers || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, assetType]);

  useEffect(() => {
    setIsLoading(true);
    fetchMovers();
    const interval = setInterval(fetchMovers, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMovers, pollInterval]);

  // Get all symbols from gainers and losers for WebSocket subscription
  const moverSymbols = useMemo(() => {
    const symbols = new Set<string>();
    gainers.forEach((m) => symbols.add(m.symbol.toLowerCase()));
    losers.forEach((m) => symbols.add(m.symbol.toLowerCase()));
    return Array.from(symbols);
  }, [gainers, losers]);

  // Subscribe to WebSocket for mover symbols
  useEffect(() => {
    if (connected && moverSymbols.length > 0) {
      subscribe(moverSymbols);
    }
  }, [connected, moverSymbols, subscribe]);

  // Handle real-time price updates
  useEffect(() => {
    const unsubscribe = onPriceUpdate((update: PriceUpdate) => {
      const symbol = update.symbol.toUpperCase();

      // Update gainers
      setGainers((prev) => {
        const index = prev.findIndex((m) => m.symbol === symbol);
        if (index === -1) return prev;
        const newGainers = [...prev];
        newGainers[index] = { ...prev[index], price: update.price };
        return newGainers;
      });

      // Update losers
      setLosers((prev) => {
        const index = prev.findIndex((m) => m.symbol === symbol);
        if (index === -1) return prev;
        const newLosers = [...prev];
        newLosers[index] = { ...prev[index], price: update.price };
        return newLosers;
      });
    });

    return unsubscribe;
  }, [onPriceUpdate]);

  const movers = showGainers ? gainers : losers;
  const showLoading = loading || isLoading;

  return (
    <Card style={styles.card} loading={showLoading}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {t("topMovers.title")}
          </Text>
          <SegmentedControl
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={setTimeframe}
            size={Size.TwoXSmall}
          />
        </View>

        {/* Toggle between gainers and losers */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleButtonWrapper}>
            <Button
              label={t("topMovers.gainers")}
              iconLeft="trending-up"
              appearance={showGainers ? Appearance.Success : Appearance.Ghost}
              backgroundOpacity={showGainers ? 0.15 : undefined}
              size={Size.ExtraSmall}
              shape={Shape.Rounded}
              onPress={() => setShowGainers(true)}
            />
          </View>
          <View style={styles.toggleButtonWrapper}>
            <Button
              label={t("topMovers.losers")}
              iconLeft="trending-down"
              appearance={!showGainers ? Appearance.Danger : Appearance.Ghost}
              backgroundOpacity={!showGainers ? 0.15 : undefined}
              size={Size.ExtraSmall}
              shape={Shape.Rounded}
              onPress={() => setShowGainers(false)}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.emptyState}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              {t("topMovers.unableToLoad")}
            </Text>
          </View>
        ) : movers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              {showGainers ? t("topMovers.noGainers") : t("topMovers.noLosers")}
            </Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              {t("topMovers.tryDifferent")}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.moverList}
          >
            {movers.map((mover, index) => (
              <MoverRow key={mover.symbol} mover={mover} rank={index + 1} />
            ))}
          </ScrollView>
        )}
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
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  toggleButtonWrapper: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  moverList: {
    gap: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xxs,
  },
});
