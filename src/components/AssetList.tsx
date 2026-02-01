import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Skeleton, Card, Avatar } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { formatCompactNumber } from "../utils/format";

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

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
}

function ChangeValue({ value }: { value: number }) {
  const isPositive = value >= 0;
  const color = isPositive ? "#22c55e" : "#ef4444";
  const prefix = isPositive ? "+" : "";

  return (
    <Text
      size={Size.Small}
      style={{ color, fontFamily: "Inter, sans-serif", fontWeight: "500" }}
    >
      {prefix}{value.toFixed(2)}%
    </Text>
  );
}

function AssetRow({ asset, isLast }: { asset: Asset; isLast: boolean }) {
  return (
    <Pressable
      style={[
        styles.row,
        !isLast && styles.rowBorder,
      ]}
    >
      <View style={styles.assetInfo}>
        <Avatar
          initials={asset.symbol.slice(0, 2)}
          size={Size.Medium}
        />
        <View style={styles.assetName}>
          <Text size={Size.Small} weight="semibold" style={styles.name}>
            {asset.name}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {asset.symbol}
          </Text>
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text size={Size.Small} weight="medium" style={styles.price}>
          ${formatPrice(asset.price)}
        </Text>
      </View>

      <View style={styles.changeCol}>
        <ChangeValue value={asset.change24h} />
      </View>

      <View style={styles.changeCol}>
        <ChangeValue value={asset.change7d} />
      </View>

      <View style={styles.marketCapCol}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          ${formatCompactNumber(asset.marketCap)}
        </Text>
      </View>

      <View style={styles.chartCol}>
        <MiniChart
          data={asset.sparkline}
          isPositive={asset.change7d >= 0}
          width={100}
          height={32}
        />
      </View>
    </Pressable>
  );
}

function LoadingRow() {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <View style={styles.assetInfo}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.assetName}>
          <Skeleton width={80} height={14} />
          <Skeleton width={40} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.priceCol}>
        <Skeleton width={80} height={14} />
      </View>
      <View style={styles.changeCol}>
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.changeCol}>
        <Skeleton width={50} height={14} />
      </View>
      <View style={styles.marketCapCol}>
        <Skeleton width={70} height={14} />
      </View>
      <View style={styles.chartCol}>
        <Skeleton width={100} height={32} />
      </View>
    </View>
  );
}

export function AssetList({ searchQuery, filter }: AssetListProps) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setAssets(MOCK_ASSETS);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchQuery === "" ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "gainers" && asset.change24h > 0) ||
      (filter === "losers" && asset.change24h < 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Large} weight="semibold">
          Cryptocurrency Prices
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          Live prices updated every minute
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <View style={styles.assetInfo}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Asset</Text>
        </View>
        <View style={styles.priceCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Price</Text>
        </View>
        <View style={styles.changeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>24h</Text>
        </View>
        <View style={styles.changeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>7d</Text>
        </View>
        <View style={styles.marketCapCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Market Cap</Text>
        </View>
        <View style={styles.chartCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Chart</Text>
        </View>
      </View>

      {loading && (
        <View>
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingRow key={i} />
          ))}
        </View>
      )}

      {!loading && (
        <View>
          {filteredAssets.map((asset, index) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              isLast={index === filteredAssets.length - 1}
            />
          ))}
        </View>
      )}

      {!loading && filteredAssets.length === 0 && (
        <View style={styles.empty}>
          <Text appearance={TextAppearance.Muted}>No assets found</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: "hidden",
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    gap: 4,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
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
  name: {
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  priceCol: {
    flex: 1,
    minWidth: 100,
  },
  price: {
    fontFamily: "Inter, sans-serif",
  },
  changeCol: {
    flex: 1,
    minWidth: 80,
  },
  marketCapCol: {
    flex: 1,
    minWidth: 100,
  },
  chartCol: {
    width: 100,
    alignItems: "flex-end",
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
});
