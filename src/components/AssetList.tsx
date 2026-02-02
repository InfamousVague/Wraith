import React, { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Link } from "react-router-dom";
import { Text, Skeleton, Card, Avatar, PercentChange, Currency, Tag, Input } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape } from "@wraith/ghost/enums";
import { Typography, Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { HighlightedText } from "./HighlightedText";
import { useCryptoData } from "../hooks/useCryptoData";
import type { FilterState } from "./Toolbar";
import { getMarketStatus } from "../utils/marketHours";

type AssetListProps = {
  filters: FilterState;
};

type AssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  searchQuery: string;
};

const AssetRow = React.memo(function AssetRow({ asset, isLast, borderColor, searchQuery }: AssetRowProps) {
  const themeColors = useThemeColors();

  return (
    <Link
      to={`/asset/${asset.id}`}
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
        borderBottomColor: isLast ? "transparent" : borderColor,
      }}
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
          size={Size.Medium}
          weight="medium"
          decimals={asset.price < 1 ? 6 : 2}
          animate
          mono
        />
      </View>

      <View style={styles.tradeCol}>
        {asset.tradeDirection ? (
          <Tag
            direction={asset.tradeDirection}
            label={asset.tradeDirection === "up" ? "BUY" : "SELL"}
            size={Size.TwoXSmall}
          />
        ) : (
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>—</Text>
        )}
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change24h} size={Size.Medium} />
      </View>

      <View style={styles.changeCol}>
        <PercentChange value={asset.change7d} size={Size.Medium} />
      </View>

      <View style={styles.marketCapCol}>
        <Currency
          value={asset.marketCap}
          size={Size.Medium}
          compact
          decimals={2}
          mono
        />
      </View>

      <View style={styles.volumeCol}>
        <Currency
          value={asset.volume24h}
          size={Size.Medium}
          compact
          decimals={2}
          mono
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
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparator - only re-render if these specific values change
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.volume24h === nextProps.asset.volume24h &&
    prevProps.asset.marketCap === nextProps.asset.marketCap &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.asset.tradeDirection === nextProps.asset.tradeDirection &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});

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
      <View style={styles.tradeCol}>
        <Skeleton width={36} height={18} borderRadius={4} />
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

export function AssetList({ filters }: AssetListProps) {
  const themeColors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState("");
  const { assets, loading, loadingMore, hasMore, loadMore, search, error } = useCryptoData({
    limit: 20,
    useMock: false,
    sort: filters.sort,
    sortDir: filters.sortDir,
    filter: filters.filter,
    assetType: filters.assetType,
  });

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

  // Apply search filter and market status filter
  const filteredAssets = useMemo(() => {
    let result = searchQuery ? search(searchQuery) : assets;

    // Filter out assets from closed markets if showOfflineMarkets is false
    if (!filters.showOfflineMarkets) {
      result = result.filter((asset) => {
        const marketStatus = getMarketStatus(asset.assetType);
        // Show assets that are 24/7 or have open markets
        return marketStatus === "24/7" || marketStatus === "open";
      });
    }

    return result;
  }, [assets, searchQuery, search, filters.showOfflineMarkets]);

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
        <View style={styles.headerLeft}>
          <Text size={Size.Large} weight="semibold">
            Asset Prices
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {assets.length} assets • Live prices
          </Text>
        </View>
        <div data-sherpa="asset-search">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search assets..."
            leadingIcon="search"
            size={Size.Small}
            shape={Shape.Rounded}
            style={styles.searchInput}
          />
        </div>
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
        <View style={styles.tradeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Trade</Text>
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
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>Pulse</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    gap: 4,
  },
  searchInput: {
    minWidth: 240,
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
  tradeCol: {
    width: 70,
    alignItems: "center",
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
