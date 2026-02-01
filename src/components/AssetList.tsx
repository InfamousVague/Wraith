import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { AssetRow } from "./AssetRow";
import type { Asset } from "../types/asset";

type AssetListProps = {
  searchQuery: string;
  filter: "all" | "gainers" | "losers";
};

// Mock data - will be replaced with CoinMarketCap API
const MOCK_ASSETS: Asset[] = [
  {
    id: 1,
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    price: 97432.15,
    change1h: 0.23,
    change24h: 2.45,
    change7d: 5.67,
    marketCap: 1920000000000,
    volume24h: 45600000000,
    circulatingSupply: 19700000,
    maxSupply: 21000000,
    sparkline: [96000, 96500, 97000, 96800, 97200, 97432],
  },
  {
    id: 2,
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    price: 3456.78,
    change1h: -0.12,
    change24h: 1.89,
    change7d: 8.23,
    marketCap: 415000000000,
    volume24h: 18900000000,
    circulatingSupply: 120000000,
    sparkline: [3400, 3420, 3450, 3440, 3460, 3456],
  },
  {
    id: 3,
    rank: 3,
    name: "Tether",
    symbol: "USDT",
    price: 1.0,
    change1h: 0.01,
    change24h: 0.02,
    change7d: -0.01,
    marketCap: 95000000000,
    volume24h: 78000000000,
    circulatingSupply: 95000000000,
    sparkline: [1, 1, 1, 1, 1, 1],
  },
  {
    id: 4,
    rank: 4,
    name: "BNB",
    symbol: "BNB",
    price: 623.45,
    change1h: 0.45,
    change24h: -1.23,
    change7d: 3.45,
    marketCap: 93000000000,
    volume24h: 1200000000,
    circulatingSupply: 149000000,
    maxSupply: 200000000,
    sparkline: [610, 620, 625, 618, 622, 623],
  },
  {
    id: 5,
    rank: 5,
    name: "Solana",
    symbol: "SOL",
    price: 198.34,
    change1h: 1.23,
    change24h: 5.67,
    change7d: 12.34,
    marketCap: 86000000000,
    volume24h: 4500000000,
    circulatingSupply: 433000000,
    sparkline: [180, 185, 190, 195, 197, 198],
  },
  {
    id: 6,
    rank: 6,
    name: "XRP",
    symbol: "XRP",
    price: 2.34,
    change1h: -0.34,
    change24h: -2.56,
    change7d: -5.12,
    marketCap: 82000000000,
    volume24h: 8900000000,
    circulatingSupply: 35000000000,
    maxSupply: 100000000000,
    sparkline: [2.5, 2.45, 2.4, 2.38, 2.35, 2.34],
  },
  {
    id: 7,
    rank: 7,
    name: "Cardano",
    symbol: "ADA",
    price: 1.12,
    change1h: 0.78,
    change24h: 4.23,
    change7d: 15.67,
    marketCap: 39000000000,
    volume24h: 1800000000,
    circulatingSupply: 35000000000,
    maxSupply: 45000000000,
    sparkline: [0.95, 1.0, 1.05, 1.08, 1.1, 1.12],
  },
  {
    id: 8,
    rank: 8,
    name: "Avalanche",
    symbol: "AVAX",
    price: 42.56,
    change1h: -0.56,
    change24h: -3.45,
    change7d: 2.34,
    marketCap: 17000000000,
    volume24h: 890000000,
    circulatingSupply: 394000000,
    maxSupply: 720000000,
    sparkline: [44, 43.5, 43, 42.8, 42.6, 42.56],
  },
];

export function AssetList({ searchQuery, filter }: AssetListProps) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    // Simulate API loading
    setLoading(true);
    const timer = setTimeout(() => {
      setAssets(MOCK_ASSETS);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    // Gainers/Losers filter
    const matchesFilter =
      filter === "all" ||
      (filter === "gainers" && asset.change24h > 0) ||
      (filter === "losers" && asset.change24h < 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.cell, styles.rankCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>#</Text>
        </View>
        <View style={[styles.cell, styles.nameCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Name</Text>
        </View>
        <View style={[styles.cell, styles.priceCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
        </View>
        <View style={[styles.cell, styles.changeCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>1h %</Text>
        </View>
        <View style={[styles.cell, styles.changeCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>24h %</Text>
        </View>
        <View style={[styles.cell, styles.changeCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>7d %</Text>
        </View>
        <View style={[styles.cell, styles.marketCapCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Market Cap</Text>
        </View>
        <View style={[styles.cell, styles.volumeCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Volume (24h)</Text>
        </View>
        <View style={[styles.cell, styles.chartCell]}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Last 7 Days</Text>
        </View>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={30} height={16} />
              <View style={styles.skeletonName}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <View>
                  <Skeleton width={80} height={14} />
                  <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
                </View>
              </View>
              <Skeleton width={100} height={16} />
              <Skeleton width={60} height={16} />
              <Skeleton width={60} height={16} />
              <Skeleton width={60} height={16} />
              <Skeleton width={100} height={16} />
              <Skeleton width={100} height={16} />
              <Skeleton width={120} height={40} />
            </View>
          ))}
        </View>
      )}

      {/* Asset list */}
      {!loading && (
        <View style={styles.list}>
          {filteredAssets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </View>
      )}

      {/* Empty state */}
      {!loading && filteredAssets.length === 0 && (
        <View style={styles.empty}>
          <Text appearance={TextAppearance.Muted}>No assets found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    backgroundColor: Colors.background.raised,
  },
  list: {
    gap: 0,
  },
  cell: {
    paddingHorizontal: 8,
  },
  rankCell: {
    width: 40,
  },
  nameCell: {
    width: 200,
  },
  priceCell: {
    width: 120,
  },
  changeCell: {
    width: 80,
  },
  marketCapCell: {
    width: 140,
  },
  volumeCell: {
    width: 140,
  },
  chartCell: {
    width: 140,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  skeletonName: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: 180,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
});
