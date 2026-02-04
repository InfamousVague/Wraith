/**
 * @file AssetList.tsx
 * @description Virtualized asset list with responsive mobile/desktop layouts.
 *
 * ## Features:
 * - Desktop: Full table view with columns (rank, asset, price, trade signal, 24h, 7d, market cap, volume, sparkline)
 * - Mobile: Compact card rows with avatar, symbol, price, sparkline
 * - IntersectionObserver-based infinite scroll loading
 * - Client-side search filtering with highlighted matches
 * - Market status filtering (show/hide offline markets)
 * - Custom React.memo comparators for optimized re-renders
 *
 * ## Props:
 * - `filters`: FilterState object with sort, filter, and asset type settings
 * - `fullBleed`: Optional edge-to-edge cards on mobile
 *
 * ## Data Flow:
 * - Uses `useCryptoData` hook for data fetching and pagination
 * - Local search state filters via hook's `search` method
 * - Market status checked via `getMarketStatus` utility
 */
import React, { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Text, Skeleton, Card, Avatar, PercentChange, Currency, Tag, Input, Button } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { Typography, Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import type { Asset } from "../../../types/asset";
import { MiniChart } from "../../chart/mini-chart";
import { HighlightedText } from "../../ui/highlighted-text";
import { useCryptoData } from "../../../hooks/useCryptoData";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import type { FilterState } from "../../ui/toolbar";
import { getMarketStatus } from "../../../utils/marketHours";

type AssetListProps = {
  filters: FilterState;
  /** Edge-to-edge cards on mobile */
  fullBleed?: boolean;
};

type AssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  searchQuery: string;
  onTradePress?: (symbol: string) => void;
};

const AssetRow = React.memo(function AssetRow({ asset, isLast, borderColor, searchQuery, onTradePress }: AssetRowProps) {
  const themeColors = useThemeColors();

  const handleTradeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTradePress?.(asset.symbol);
  }, [asset.symbol, onTradePress]);

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
        {onTradePress ? (
          <Button
            label="Trade"
            appearance={Appearance.Secondary}
            size={Size.Small}
            onPress={handleTradeClick as () => void}
          />
        ) : asset.tradeDirection ? (
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
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.onTradePress === nextProps.onTradePress
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

function MobileLoadingRow({ borderColor }: { borderColor: string }) {
  return (
    <View style={[styles.mobileRow, { borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
      <View style={styles.mobileRowLeft}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={{ gap: 4 }}>
          <Skeleton width={50} height={14} />
          <Skeleton width={35} height={12} />
        </View>
      </View>
      <View style={styles.mobileRowRight}>
        <Skeleton width={56} height={36} />
        <View style={styles.mobileRowPriceStack}>
          <Skeleton width={60} height={14} />
          <Skeleton width={45} height={14} />
        </View>
      </View>
    </View>
  );
}

type MobileAssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  onTradePress?: (symbol: string) => void;
};

const MobileAssetRow = React.memo(function MobileAssetRow({ asset, isLast, borderColor, onTradePress }: MobileAssetRowProps) {
  const handleTradeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTradePress?.(asset.symbol);
  }, [asset.symbol, onTradePress]);

  return (
    <Link
      to={`/asset/${asset.id}`}
      style={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        paddingLeft: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomStyle: "solid",
        borderBottomColor: isLast ? "transparent" : borderColor,
        minHeight: 56,
        gap: 8,
      }}
    >
      <View style={styles.mobileRowLeft}>
        <Avatar
          uri={asset.image}
          initials={asset.symbol.slice(0, 2)}
          size={Size.Small}
        />
        <View style={styles.mobileRowText}>
          <Text size={Size.Small} weight="semibold">{asset.symbol}</Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} numberOfLines={1}>
            {asset.name}
          </Text>
        </View>
      </View>
      <View style={styles.mobileRowRight}>
        <MiniChart
          data={asset.sparkline}
          isPositive={asset.change7d >= 0}
          width={56}
          height={36}
        />
        {onTradePress && (
          <Button
            label="Trade"
            appearance={Appearance.Secondary}
            size={Size.ExtraSmall}
            onPress={handleTradeClick as () => void}
          />
        )}
        <View style={styles.mobileRowPriceStack}>
          <Currency
            value={asset.price}
            size={Size.Small}
            weight="medium"
            decimals={asset.price < 1 ? 4 : 2}
            mono
          />
          <PercentChange value={asset.change24h} size={Size.ExtraSmall} />
        </View>
      </View>
    </Link>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.onTradePress === nextProps.onTradePress
  );
});

export function AssetList({ filters, fullBleed = false }: AssetListProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const themeColors = useThemeColors();
  const { isMobile } = useBreakpoint();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { assets, loading, loadingMore, hasMore, loadMore, search, error } = useCryptoData({
    limit: 20,
    useMock: false,
    sort: filters.sort,
    sortDir: filters.sortDir,
    filter: filters.filter,
    assetType: filters.assetType,
  });

  // Handle trade button press - navigate to trade page
  const handleTradePress = useCallback((symbol: string) => {
    navigate("/trade");
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

  // Mobile view - simplified card rows
  if (isMobile) {
    return (
      <Card style={styles.container} fullBleed={fullBleed}>
        <View style={[styles.header, styles.headerMobile]}>
          <Text size={Size.Large} weight="semibold">
            {t("dashboard:assetList.title")}
          </Text>
          <div data-sherpa="asset-search">
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("dashboard:assetList.searchPlaceholder")}
              leadingIcon="search"
              size={Size.Small}
              shape={Shape.Rounded}
              style={styles.searchInputMobile}
            />
          </div>
        </View>

        {loading && (
          <View>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <MobileLoadingRow key={i} borderColor={borderColor} />
            ))}
          </View>
        )}

        {!loading && (
          <View>
            {filteredAssets.map((asset, index) => (
              <MobileAssetRow
                key={asset.id}
                asset={asset}
                isLast={index === filteredAssets.length - 1 && !hasMore}
                borderColor={borderColor}
                onTradePress={handleTradePress}
              />
            ))}

            {hasMore && !searchQuery && Platform.OS === "web" && (
              <div ref={setLoadMoreRef}>
                {[1, 2, 3].map((i) => (
                  <MobileLoadingRow key={`trigger-${i}`} borderColor={borderColor} />
                ))}
              </div>
            )}
          </View>
        )}

        {!loading && error && (
          <View style={styles.empty}>
            <Text appearance={TextAppearance.Muted}>
              {t("common:errors.unableToConnect")}
            </Text>
          </View>
        )}

        {!loading && !error && filteredAssets.length === 0 && (
          <View style={styles.empty}>
            <Text appearance={TextAppearance.Muted}>{t("common:empty.noAssets")}</Text>
          </View>
        )}
      </Card>
    );
  }

  // Desktop view - full table
  return (
    <Card style={styles.container} fullBleed={fullBleed}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text size={Size.Large} weight="semibold">
            {t("dashboard:assetList.title")}
          </Text>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
            {t("dashboard:assetList.subtitle", { count: assets.length })}
          </Text>
        </View>
        <div data-sherpa="asset-search">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("dashboard:assetList.searchPlaceholder")}
            leadingIcon="search"
            size={Size.Small}
            shape={Shape.Rounded}
            style={styles.searchInput}
          />
        </div>
      </View>

      <View style={[styles.tableHeader, { borderBottomColor: borderColor }]} data-testid="asset-table-header">
        <View style={styles.rankCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.rank")}</Text>
        </View>
        <View style={styles.assetInfo}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.asset")}</Text>
        </View>
        <View style={styles.priceCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.price")}</Text>
        </View>
        <View style={styles.tradeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.trade")}</Text>
        </View>
        <View style={styles.changeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.change24h")}</Text>
        </View>
        <View style={styles.changeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.change7d")}</Text>
        </View>
        <View style={styles.marketCapCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.marketCap")}</Text>
        </View>
        <View style={styles.volumeCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.volume24h")}</Text>
        </View>
        <View style={styles.chartCol}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>{t("dashboard:assetList.columns.pulse")}</Text>
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
              onTradePress={handleTradePress}
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
            {t("common:errors.unableToConnect")}
          </Text>
        </View>
      )}

      {!loading && !error && filteredAssets.length === 0 && (
        <View style={styles.empty}>
          <Text appearance={TextAppearance.Muted}>{t("common:empty.noAssets")}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.none,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerLeft: {
    gap: spacing.xxs,
  },
  searchInput: {
    minWidth: 240,
  },
  searchInputMobile: {
    width: "100%",
  },
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    minHeight: 64,
  },
  mobileRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  mobileRowText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  mobileRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  mobileRowPriceStack: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 70,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    gap: spacing.sm,
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
    width: 80,
    alignItems: "center",
    justifyContent: "center",
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
    padding: spacing.xxxl,
    alignItems: "center",
  },
});
