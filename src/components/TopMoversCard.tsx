import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Card, Text, Currency, PercentChange, AnimatedNumber, SegmentedControl, Avatar, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Brightness } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { hauntClient, type Mover, type MoverTimeframe } from "../services/haunt";
import { useHauntSocket, type PriceUpdate } from "../hooks/useHauntSocket";

// CMC ID mapping for common symbols (for avatar images)
const SYMBOL_TO_CMC_ID: Record<string, number> = {
  // Top 50 by market cap
  BTC: 1,
  ETH: 1027,
  USDT: 825,
  BNB: 1839,
  SOL: 5426,
  XRP: 52,
  USDC: 3408,
  ADA: 2010,
  DOGE: 74,
  AVAX: 5805,
  TRX: 1958,
  DOT: 6636,
  LINK: 1975,
  TON: 11419,
  MATIC: 3890,
  SHIB: 5994,
  LTC: 2,
  BCH: 1831,
  DAI: 4943,
  ATOM: 3794,
  UNI: 7083,
  XLM: 512,
  NEAR: 6535,
  APT: 21794,
  OKB: 3897,
  ICP: 8916,
  FIL: 2280,
  HBAR: 4642,
  ARB: 11841,
  VET: 3077,
  MKR: 1518,
  OP: 11840,
  INJ: 7226,
  IMX: 10603,
  GRT: 6719,
  RUNE: 4157,
  THETA: 2416,
  FTM: 3513,
  ALGO: 4030,
  SAND: 6210,
  MANA: 1966,
  AAVE: 7278,
  XTZ: 2011,
  FLOW: 4558,
  AXS: 6783,
  EOS: 1765,
  SNX: 2586,
  EGLD: 6892,
  NEO: 1376,
  KAVA: 4846,
  // Privacy coins
  XMR: 328,
  ZEC: 1437,
  DASH: 131,
  // DeFi
  CRV: 6538,
  COMP: 5692,
  SUSHI: 6758,
  YFI: 5864,
  "1INCH": 8104,
  BAL: 5728,
  LDO: 8000,
  RPL: 2943,
  CAKE: 7186,
  // Layer 2 / Scaling
  LRC: 1934,
  ZK: 24091,
  STRK: 22691,
  METIS: 9640,
  BOBA: 14556,
  // Gaming / Metaverse
  ENJ: 2130,
  GALA: 7080,
  ILV: 8719,
  WAXP: 2300,
  ROSE: 7653,
  GMT: 18069,
  PRIME: 23711,
  // Infrastructure
  FET: 3773,
  RNDR: 5690,
  AR: 5632,
  STORJ: 1772,
  OCEAN: 3911,
  AGIX: 2424,
  // Exchange tokens
  CRO: 3635,
  KCS: 2087,
  GT: 4269,
  HT: 2502,
  LEO: 3957,
  // Meme coins
  PEPE: 24478,
  FLOKI: 10804,
  BONK: 23095,
  WIF: 28752,
  // Others
  QNT: 3155,
  IOTA: 1720,
  XDC: 2634,
  KSM: 5034,
  ZIL: 2469,
  ONE: 3945,
  CELO: 5567,
  SUI: 20947,
  SEI: 23149,
  TIA: 22861,
  PYTH: 28177,
  JTO: 28541,
  JUP: 29210,
  WLD: 13502,
  BLUR: 23121,
  DYDX: 11156,
  GMX: 11857,
  ONDO: 21159,
  CFX: 7334,
  ORDI: 25028,
  STX: 4847,
  KLAY: 4256,
};

function getAssetImage(symbol: string): string {
  const id = SYMBOL_TO_CMC_ID[symbol.toUpperCase()];
  if (id) {
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
  }
  return "";
}

// Time range options
const TIMEFRAME_OPTIONS: { value: MoverTimeframe; label: string }[] = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "24h", label: "24H" },
];

type MoverRowProps = {
  mover: Mover;
  rank: number;
};

const MoverRow = React.memo(function MoverRow({ mover, rank }: MoverRowProps) {
  const imageUrl = getAssetImage(mover.symbol);

  return (
    <View style={styles.moverRow}>
      <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted} style={styles.rank}>
        {rank}
      </Text>
      <Avatar
        uri={imageUrl}
        initials={mover.symbol.slice(0, 2)}
        size={Size.Small}
      />
      <View style={styles.moverInfo}>
        <Text size={Size.ExtraSmall} weight="medium">
          {mover.symbol}
        </Text>
        <Currency
          value={mover.price}
          size={Size.TwoXSmall}
          appearance={TextAppearance.Muted}
          compact
          decimals={mover.price >= 1 ? 2 : 6}
          mono
          animate
        />
      </View>
      <PercentChange
        value={mover.changePercent}
        size={Size.Small}
        showArrow
      />
    </View>
  );
});

type TopMoversCardProps = {
  loading?: boolean;
  pollInterval?: number;
};

export function TopMoversCard({
  loading = false,
  pollInterval = 5000,
}: TopMoversCardProps) {
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
      const response = await hauntClient.getMovers(timeframe, 10);
      setGainers(response.data?.gainers || []);
      setLosers(response.data?.losers || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

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
            TOP MOVERS
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
          <Pressable
            style={[
              styles.toggleButton,
              showGainers && styles.toggleButtonActive,
              showGainers && { backgroundColor: "rgba(34, 197, 94, 0.1)" },
            ]}
            onPress={() => setShowGainers(true)}
          >
            <Icon
              name="trending-up"
              size={Size.ExtraSmall}
              color={showGainers ? "#22C55E" : themeColors.text.muted}
            />
            <Text
              size={Size.ExtraSmall}
              weight={showGainers ? "semibold" : "regular"}
              appearance={showGainers ? TextAppearance.Success : TextAppearance.Muted}
              brightness={showGainers ? Brightness.Soft : Brightness.None}
            >
              Gainers
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              !showGainers && styles.toggleButtonActive,
              !showGainers && { backgroundColor: "rgba(239, 68, 68, 0.1)" },
            ]}
            onPress={() => setShowGainers(false)}
          >
            <Icon
              name="trending-down"
              size={Size.ExtraSmall}
              color={!showGainers ? "#EF4444" : themeColors.text.muted}
            />
            <Text
              size={Size.ExtraSmall}
              weight={!showGainers ? "semibold" : "regular"}
              appearance={!showGainers ? TextAppearance.Danger : TextAppearance.Muted}
              brightness={!showGainers ? Brightness.Soft : Brightness.None}
            >
              Losers
            </Text>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {error ? (
          <View style={styles.emptyState}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              Unable to load movers
            </Text>
          </View>
        ) : movers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
              {showGainers ? "No gainers" : "No losers"} in this timeframe
            </Text>
            <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
              Try a different time range
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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  toggleButtonActive: {
    borderWidth: 0,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  moverList: {
    gap: 8,
  },
  moverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  rank: {
    width: 16,
    textAlign: "center",
  },
  moverInfo: {
    flex: 1,
    gap: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
});
