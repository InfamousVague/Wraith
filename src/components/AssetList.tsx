import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { Text, Skeleton, Card, Avatar, PercentChange, Currency } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Typography } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { HighlightedText } from "./HighlightedText";
import { useCryptoData } from "../hooks/useCryptoData";

type AssetListProps = {
  searchQuery: string;
  filter: "all" | "gainers" | "losers";
};

type AssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  searchQuery: string;
  onPress: (asset: Asset) => void;
};

function AssetRow({ asset, isLast, borderColor, searchQuery, onPress }: AssetRowProps) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      onPress={() => onPress(asset)}
      style={[
        styles.row,
        !isLast && [styles.rowBorder, { borderBottomColor: borderColor }],
      ]}
    >
      {/* Rank */}
      <View style={styles.rankCol}>
        <Text size={Size.Small} appearance={TextAppearance.Muted}>
          {asset.rank}
        </Text>
      </View>

      <View style={styles.assetInfo}>
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Medium}
        />
        <View style={styles.assetName}>
          <HighlightedText
            text={asset.name}
            highlight={searchQuery}
            style={{
              fontSize: 14,
              fontWeight: Typography.fontWeight.semibold as "600",
              color: themeColors.text.primary,
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          />
          <HighlightedText
            text={asset.symbol}
            highlight={searchQuery}
            style={{
              fontSize: 12,
              color: themeColors.text.muted,
            }}
          />
        </View>
      </View>

      <View style={styles.priceCol}>
        <Currency
          value={asset.price}
          size={Size.Small}
          weight="medium"
          decimals={asset.price < 1 ? 4 : 2}
        />
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change24h} size={Size.Small} />
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change7d} size={Size.Small} />
      </View>

      <View style={styles.marketCapCol}>
        <Currency
          value={asset.marketCap}
          size={Size.Small}
          compact
          decimals={1}
        />
      </View>

      <View style={styles.volumeCol}>
        <Currency
          value={asset.volume24h}
          size={Size.Small}
          compact
          decimals={1}
        />
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

function LoadingRow({ borderColor }: { borderColor: string }) {
  return (
    <View style={[styles.row, styles.rowBorder, { borderBottomColor: borderColor }]}>
      <View style={styles.rankCol}>
        <Skeleton width={24} height={14} />
      </View>
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
      <View style={styles.volumeCol}>
        <Skeleton width={70} height={14} />
      </View>
      <View style={styles.chartCol}>
        <Skeleton width={100} height={32} />
      </View>
    </View>
  );
}

export function AssetList({ searchQuery, filter }: AssetListProps) {
  const themeColors = useThemeColors();
  const navigate = useNavigate();
  const { assets, loading, loadingMore, hasMore, loadMore, search, error } = useCryptoData({
    limit: 20,
    useMock: false,
  });

  const handleAssetPress = useCallback((asset: Asset) => {
    navigate(`/asset/${asset.id}`);
  }, [navigate]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const searchQueryRef = useRef(searchQuery);

  // Keep refs in sync
  useEffect(() => {
    loadMoreCallbackRef.current = loadMore;
    hasMoreRef.current = hasMore;
    loadingMoreRef.current = loadingMore;
    searchQueryRef.current = searchQuery;
  }, [loadMore, hasMore, loadingMore, searchQuery]);

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

  // Callback ref for the load more trigger element
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (Platform.OS !== "web") return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current && !searchQueryRef.current) {
            loadMoreCallbackRef.current();
          }
        },
        { threshold: 0.1, rootMargin: "100px" }
      );
      observerRef.current.observe(node);
    }
  }, []);

  const borderColor = themeColors.border.subtle;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text size={Size.Large} weight="semibold">
          Cryptocurrency Prices
        </Text>
        <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
          {assets.length} assets • Live prices
        </Text>
      </View>

      <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
        <View style={styles.rankCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>#</Text>
        </View>
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
        <View style={styles.volumeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Volume 24h</Text>
        </View>
        <View style={styles.chartCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Last 7 Days</Text>
        </View>
      </View>

      {loading && (
        <View>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <LoadingRow key={i} borderColor={borderColor} />
          ))}
        </View>
      )}

      {!loading && (
        <View>
          {filteredAssets.map((asset, index) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              isLast={index === filteredAssets.length - 1 && !hasMore}
              borderColor={borderColor}
              searchQuery={searchQuery}
              onPress={handleAssetPress}
            />
          ))}

          {/* Load more trigger element with skeleton rows */}
          {hasMore && !searchQuery && Platform.OS === "web" && (
            <div ref={setLoadMoreRef}>
              {[1, 2, 3].map((i) => (
                <LoadingRow key={`trigger-${i}`} borderColor={borderColor} />
              ))}
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && !hasMore && (
            <View>
              {[1, 2, 3].map((i) => (
                <LoadingRow key={`loading-${i}`} borderColor={borderColor} />
              ))}
            </View>
          )}
        </View>
      )}

      {!loading && error && (
        <View style={styles.empty}>
          <Text appearance={TextAppearance.Muted}>
            Unable to connect to server. Please ensure Haunt is running.
          </Text>
        </View>
      )}

      {!loading && !error && filteredAssets.length === 0 && (
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
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rankCol: {
    width: 40,
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
    minWidth: 110,
  },
  volumeCol: {
    flex: 1,
    minWidth: 110,
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
