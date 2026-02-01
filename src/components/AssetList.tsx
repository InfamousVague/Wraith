import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, Skeleton, Card, Avatar } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { formatCompactNumber } from "../utils/format";
import { useCryptoData } from "../hooks/useCryptoData";

type AssetListProps = {
  searchQuery: string;
  filter: "all" | "gainers" | "losers";
};

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
  const { assets, loading, error, search } = useCryptoData({
    limit: 100,
    useMock: true, // Set to false when API key is configured
  });

  const filteredAssets = useMemo(() => {
    // First apply search
    const searchResults = searchQuery ? search(searchQuery) : assets;

    // Then apply filter
    return searchResults.filter((asset) => {
      if (filter === "all") return true;
      if (filter === "gainers") return asset.change24h > 0;
      if (filter === "losers") return asset.change24h < 0;
      return true;
    });
  }, [assets, searchQuery, filter, search]);

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
