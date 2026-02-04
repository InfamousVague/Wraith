/**
 * ChartGrid Component
 *
 * @fileoverview Responsive grid of asset cards with mini charts, supporting
 * virtualization for large datasets and responsive card sizing.
 *
 * @description
 * Features:
 * - **Responsive Grid**: CSS grid auto-fill layout adapts to container width
 * - **Virtualized Rendering**: Uses react-window for 50+ assets to maintain performance
 * - **Adjustable Card Size**: Slider-controlled card width (140-400px) with proportional chart height
 * - **Compact Mode**: Simplified card layout when cardSize < 180px
 * - **Search Highlighting**: HighlightedText shows search query matches in name/symbol
 * - **Loading Skeletons**: Shows 20 placeholder cards while data loads
 *
 * @example
 * <ChartGrid
 *   assets={filteredAssets}
 *   loading={isLoading}
 *   searchQuery={query}
 *   cardSize={220}
 * />
 *
 * @exports ChartGrid - Main grid component
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { FixedSizeGrid as Grid } from "react-window";
import { Text } from "@wraith/ghost/components";
import { TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing } from "../../../styles/tokens";
import { ChartCard } from "./ChartCard";
import { LoadingCard } from "./LoadingCard";
import { getChartHeight, isCompactSize, VIRTUALIZATION_THRESHOLD } from "./utils/chartHelpers";
import type { ChartGridProps } from "./types";

export function ChartGrid({ assets, loading = false, searchQuery = "", cardSize = 220 }: ChartGridProps) {
  const { t } = useTranslation("dashboard");
  const themeColors = useThemeColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  const volLabel = t("chartGrid.vol");

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
          volLabel={volLabel}
        />
      </div>
    );
  }, [filteredAssets, columnCount, cardSize, themeColors, searchQuery, volLabel]);

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
                  volLabel={volLabel}
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
                  volLabel={volLabel}
                />
              ))}
        </View>
      )}

      {!loading && filteredAssets.length === 0 && (
        <View style={styles.empty}>
          <Text appearance={TextAppearance.Muted}>{t("chartGrid.noAssets")}</Text>
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
  empty: {
    padding: spacing.xxxl,
    alignItems: "center",
  },
});
