import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import { Card, Text, Avatar, PercentChange, Currency, Skeleton } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Typography } from "@wraith/ghost/tokens";
import { useThemeColors, type ThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { Asset } from "../types/asset";
import { MiniChart } from "./MiniChart";
import { HighlightedText } from "./HighlightedText";

type ChartGridProps = {
  assets: Asset[];
  loading?: boolean;
  searchQuery?: string;
  /** Card min width in pixels - controls card size via slider */
  cardSize?: number;
};

/** Calculate chart height based on card size */
function getChartHeight(cardSize: number): number {
  // Scale chart height proportionally: 140px -> 40px, 400px -> 120px
  return Math.round(40 + ((cardSize - 140) / (400 - 140)) * 80);
}

/** Determine if we should show compact view based on size */
function isCompactSize(cardSize: number): boolean {
  return cardSize < 180;
}

type ChartCardProps = {
  asset: Asset;
  cardSize: number;
  themeColors: ThemeColors;
  searchQuery: string;
  onPress: (asset: Asset) => void;
};

const ChartCard = React.memo(function ChartCard({ asset, cardSize, themeColors, searchQuery, onPress }: ChartCardProps) {
  const isPositive = asset.change24h >= 0;
  const chartHeight = getChartHeight(cardSize);
  const compact = isCompactSize(cardSize);

  return (
    <View style={styles.cardWrapper}>
      <Pressable style={styles.cardPressable} onPress={() => onPress(asset)}>
        <Card style={styles.chartCard}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.assetInfo}>
                <Avatar
                  uri={asset.image}
                  initials={asset.symbol.slice(0, 2)}
                  size={compact ? Size.Small : Size.Medium}
                />
                <View style={styles.assetName}>
                  <HighlightedText
                    text={asset.symbol}
                    highlight={searchQuery}
                    style={{
                      fontSize: compact ? 14 : 16,
                      fontWeight: Typography.fontWeight.semibold as "600",
                      color: themeColors.text.primary,
                    }}
                  />
                  {!compact && (
                    <HighlightedText
                      text={asset.name}
                      highlight={searchQuery}
                      style={{
                        fontSize: 14,
                        color: themeColors.text.muted,
                      }}
                    />
                  )}
                </View>
              </View>
              <View style={styles.priceInfo}>
                <Currency
                  value={asset.price}
                  size={compact ? Size.Small : Size.Medium}
                  weight="semibold"
                  decimals={asset.price < 1 ? 4 : 2}
                />
                <PercentChange
                  value={asset.change24h}
                  size={Size.Medium}
                />
              </View>
            </View>

            <View style={[styles.chartArea, { minHeight: chartHeight }]}>
              {asset.sparkline.length >= 2 ? (
                <MiniChart
                  data={asset.sparkline}
                  isPositive={isPositive}
                  width="100%"
                  height={chartHeight}
                />
              ) : (
                <View style={[styles.chartPlaceholder, { backgroundColor: themeColors.background.raised }]} />
              )}
            </View>

            {!compact && (
              <View style={[styles.cardFooter, { borderTopColor: themeColors.border.subtle }]}>
                <View style={styles.stat}>
                  <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                    Vol
                  </Text>
                  <Currency
                    value={asset.volume24h}
                    size={Size.Medium}
                    compact
                    decimals={1}
                  />
                </View>
                <View style={styles.stat}>
                  <Text size={Size.Medium} appearance={TextAppearance.Muted}>
                    7d
                  </Text>
                  <PercentChange
                    value={asset.change7d}
                    size={Size.Medium}
                  />
                </View>
              </View>
            )}
          </View>
        </Card>
      </Pressable>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.asset.id === nextProps.asset.id &&
    prevProps.asset.price === nextProps.asset.price &&
    prevProps.asset.change24h === nextProps.asset.change24h &&
    prevProps.asset.change7d === nextProps.asset.change7d &&
    prevProps.asset.sparkline === nextProps.asset.sparkline &&
    prevProps.cardSize === nextProps.cardSize &&
    prevProps.searchQuery === nextProps.searchQuery
  );
});

function LoadingCard({ cardSize, themeColors }: { cardSize: number; themeColors: ThemeColors }) {
  const chartHeight = getChartHeight(cardSize);
  const compact = isCompactSize(cardSize);

  return (
    <View style={styles.cardWrapper}>
      <Card style={styles.chartCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.assetInfo}>
              <Skeleton width={compact ? 32 : 40} height={compact ? 32 : 40} borderRadius={20} />
              <View style={styles.assetName}>
                <Skeleton width={50} height={16} />
                {!compact && <Skeleton width={70} height={14} style={{ marginTop: 4 }} />}
              </View>
            </View>
            <View style={styles.priceInfo}>
              <Skeleton width={60} height={16} />
              <Skeleton width={45} height={14} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={[styles.chartArea, { minHeight: chartHeight }]}>
            <Skeleton width="100%" height={chartHeight} />
          </View>
          {!compact && (
            <View style={[styles.cardFooter, { borderTopColor: themeColors.border.subtle }]}>
              <Skeleton width={60} height={14} />
              <Skeleton width={50} height={14} />
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

// Virtualization threshold - use virtualized grid when asset count exceeds this
const VIRTUALIZATION_THRESHOLD = 50;

export function ChartGrid({ assets, loading = false, searchQuery = "", cardSize = 220 }: ChartGridProps) {
  const themeColors = useThemeColors();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const handleAssetPress = useCallback((asset: Asset) => {
    navigate(`/asset/${asset.id}`);
  }, [navigate]);

  // Track container size for virtualization
  useEffect(() => {
    if (Platform.OS !== "web" || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Memoize filtered assets to prevent recalculation on every render
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // Calculate grid dimensions for virtualization
  const columnCount = useMemo(() => {
    if (containerSize.width === 0) return 1;
    return Math.max(1, Math.floor(containerSize.width / (cardSize + 8)));
  }, [containerSize.width, cardSize]);

  const rowCount = useMemo(() => {
    return Math.ceil(filteredAssets.length / columnCount);
  }, [filteredAssets.length, columnCount]);

  const cardHeight = useMemo(() => {
    const chartHeight = getChartHeight(cardSize);
    const compact = isCompactSize(cardSize);
    // Base padding + header + chart + footer
    return compact ? chartHeight + 80 : chartHeight + 140;
  }, [cardSize]);

  // Memoize grid style to prevent object recreation on every render
  const gridStyle = useMemo(() => Platform.OS === "web" ? {
    display: "grid" as any,
    gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
    gap: 8,
  } : {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  }, [cardSize]);

  // Use virtualization for large datasets on web
  const useVirtualization = Platform.OS === "web" &&
    filteredAssets.length > VIRTUALIZATION_THRESHOLD &&
    containerSize.width > 0;

  // Cell renderer for virtualized grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= filteredAssets.length) return null;

    const asset = filteredAssets[index];
    return (
      <div style={{ ...style, padding: 4 }}>
        <ChartCard
          asset={asset}
          cardSize={cardSize}
          themeColors={themeColors}
          searchQuery={searchQuery}
          onPress={handleAssetPress}
        />
      </div>
    );
  }, [filteredAssets, columnCount, cardSize, themeColors, searchQuery, handleAssetPress]);

  return (
    <View style={styles.container}>
      {/* Hide TradingView watermark via CSS */}
      {Platform.OS === "web" && (
        <style dangerouslySetInnerHTML={{ __html: `
          .tv-lightweight-charts { position: relative !important; }
          a[href*="tradingview"] { display: none !important; }
          div[style*="tradingview"] { display: none !important; }
        ` }} />
      )}

      {Platform.OS === "web" ? (
        <div ref={containerRef} style={{ flex: 1, minHeight: 400 }}>
          {loading ? (
            <View style={[styles.grid, gridStyle]}>
              {Array.from({ length: 20 }).map((_, i) => (
                <LoadingCard key={`loading-${i}`} cardSize={cardSize} themeColors={themeColors} />
              ))}
            </View>
          ) : useVirtualization ? (
            <Grid
              columnCount={columnCount}
              columnWidth={(containerSize.width - 8) / columnCount}
              height={Math.min(containerSize.height || 600, 800)}
              rowCount={rowCount}
              rowHeight={cardHeight + 8}
              width={containerSize.width}
              overscanRowCount={2}
            >
              {Cell}
            </Grid>
          ) : (
            <View style={[styles.grid, gridStyle]}>
              {filteredAssets.map((asset) => (
                <ChartCard
                  key={asset.id}
                  asset={asset}
                  cardSize={cardSize}
                  themeColors={themeColors}
                  searchQuery={searchQuery}
                  onPress={handleAssetPress}
                />
              ))}
            </View>
          )}
        </div>
      ) : (
        <View style={[styles.grid, gridStyle]}>
          {loading
            ? Array.from({ length: 20 }).map((_, i) => <LoadingCard key={`loading-${i}`} cardSize={cardSize} themeColors={themeColors} />)
            : filteredAssets.map((asset) => (
                <ChartCard
                  key={asset.id}
                  asset={asset}
                  cardSize={cardSize}
                  themeColors={themeColors}
                  searchQuery={searchQuery}
                  onPress={handleAssetPress}
                />
              ))}
        </View>
      )}

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
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardWrapper: {
    ...(Platform.OS !== "web" && {
      flexBasis: "20%",
      minWidth: 180,
      flexGrow: 1,
    }),
  },
  cardPressable: {
    flex: 1,
  },
  chartCard: {
    flex: 1,
    padding: 0,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  assetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  assetName: {
    gap: 1,
    flex: 1,
  },
  priceInfo: {
    alignItems: "flex-end",
    gap: 1,
  },
  chartArea: {
    flex: 1,
  },
  chartPlaceholder: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
});
