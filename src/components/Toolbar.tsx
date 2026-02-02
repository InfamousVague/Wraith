import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Icon,
  Slider,
  SegmentedControl,
  Select,
  FilterChip,
  Toggle,
  type SegmentOption,
  type SelectOption,
} from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import type { SortField, SortDirection, ListingFilter, AssetType } from "../services/haunt";

export type ViewMode = "list" | "charts";

export type FilterState = {
  sort: SortField;
  sortDir: SortDirection;
  filter: ListingFilter;
  assetType: AssetType;
  /** Show assets from closed/offline markets (stocks after hours) */
  showOfflineMarkets: boolean;
};

type ToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Card size in pixels (min width) - only shown in charts mode */
  cardSize?: number;
  onCardSizeChange?: (size: number) => void;
  /** Filter state */
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

const CARD_SIZE_MIN = 140;
const CARD_SIZE_MAX = 400;

const VIEW_OPTIONS: SegmentOption<ViewMode>[] = [
  { value: "list", label: "List", icon: "list" },
  { value: "charts", label: "Charts", icon: "grid" },
];

const SORT_OPTIONS: SelectOption<SortField>[] = [
  { value: "market_cap", label: "Market Cap" },
  { value: "price", label: "Price" },
  { value: "volume_24h", label: "Volume 24h" },
  { value: "percent_change_1h", label: "Change 1h" },
  { value: "percent_change_24h", label: "Change 24h" },
  { value: "percent_change_7d", label: "Change 7d" },
  { value: "name", label: "Name" },
];

const FILTER_OPTIONS: { value: ListingFilter; label: string; icon?: string }[] = [
  { value: "all", label: "All" },
  { value: "gainers", label: "Gainers" },
  { value: "losers", label: "Losers" },
  { value: "most_volatile", label: "Volatile" },
  { value: "top_volume", label: "Top Volume" },
];

const ASSET_TYPE_OPTIONS: SelectOption<AssetType>[] = [
  { value: "all", label: "All Assets" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stocks" },
];

const SORT_DIR_OPTIONS: SegmentOption<SortDirection>[] = [
  { value: "desc", label: "DESC", icon: "arrow-down" },
  { value: "asc", label: "ASC", icon: "arrow-up" },
];

export function Toolbar({
  viewMode,
  onViewModeChange,
  cardSize = 220,
  onCardSizeChange,
  filters,
  onFiltersChange,
}: ToolbarProps) {
  const handleSortChange = (sort: SortField) => {
    onFiltersChange({ ...filters, sort });
  };

  const handleSortDirChange = (sortDir: SortDirection) => {
    onFiltersChange({ ...filters, sortDir });
  };

  const handleFilterChange = (filter: ListingFilter) => {
    onFiltersChange({ ...filters, filter });
  };

  const handleAssetTypeChange = (assetType: AssetType) => {
    onFiltersChange({ ...filters, assetType });
  };

  const handleShowOfflineChange = (showOfflineMarkets: boolean) => {
    onFiltersChange({ ...filters, showOfflineMarkets });
  };

  return (
    <View style={styles.container}>
      {/* Left section - Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.leftSection}
      >
        {/* Sort dropdown */}
        <View style={styles.sortGroup}>
          <Select
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={handleSortChange}
            size={Size.Medium}
            placeholder="Sort by"
            icon="arrow-up-down"
            style={styles.sortSelect}
          />
          <SegmentedControl
            options={SORT_DIR_OPTIONS}
            value={filters.sortDir}
            onChange={handleSortDirChange}
            size={Size.Medium}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Filter chips */}
        <View style={styles.filterGroup}>
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={filters.filter === opt.value}
              onPress={() => handleFilterChange(opt.value)}
              size={Size.Medium}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Asset type dropdown */}
        <Select
          options={ASSET_TYPE_OPTIONS}
          value={filters.assetType}
          onChange={handleAssetTypeChange}
          size={Size.Medium}
          placeholder="Asset Type"
          style={styles.assetTypeSelect}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Show Offline Markets toggle */}
        <Toggle
          value={filters.showOfflineMarkets}
          onValueChange={handleShowOfflineChange}
          leftIcon="clock"
          rightIcon="moon"
          size={Size.Medium}
        />
      </ScrollView>

      {/* Right section - View controls */}
      <View style={styles.rightSection}>
        {/* Size slider (charts mode only) */}
        {viewMode === "charts" && (
          <View style={styles.sliderContainer}>
            <Icon name="grid" size={Size.Small} appearance={TextAppearance.Muted} />
            <View style={styles.slider}>
              <Slider
                value={cardSize}
                min={CARD_SIZE_MIN}
                max={CARD_SIZE_MAX}
                step={10}
                size={Size.Medium}
                onChange={onCardSizeChange}
              />
            </View>
            <Icon name="grid" size={Size.Medium} appearance={TextAppearance.Muted} />
          </View>
        )}

        {/* View Toggle */}
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
          size={Size.Medium}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 16,
  },
  sortGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortSelect: {
    minWidth: 130,
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assetTypeSelect: {
    minWidth: 120,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    width: 120,
  },
});
