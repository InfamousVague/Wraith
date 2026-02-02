import React from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Slider,
  SegmentedControl,
  Select,
  FilterChip,
  Toggle,
  type SegmentOption,
  type SelectOption,
  type FilterChipAppearance,
} from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
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
  /** Show compact mode for mobile - only essential controls */
  compact?: boolean;
};

const CARD_SIZE_MIN = 140;
const CARD_SIZE_MAX = 400;

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
  compact = false,
}: ToolbarProps) {
  const { t } = useTranslation("dashboard");
  const themeColors = useThemeColors();

  const VIEW_OPTIONS: SegmentOption<ViewMode>[] = [
    { value: "list", label: t("toolbar.viewOptions.list"), icon: "list" },
    { value: "charts", label: t("toolbar.viewOptions.charts"), icon: "grid" },
  ];

  const SORT_OPTIONS: SelectOption<SortField>[] = [
    { value: "market_cap", label: t("toolbar.sortOptions.marketCap") },
    { value: "price", label: t("toolbar.sortOptions.price") },
    { value: "volume_24h", label: t("toolbar.sortOptions.volume24h") },
    { value: "percent_change_1h", label: t("toolbar.sortOptions.change1h") },
    { value: "percent_change_24h", label: t("toolbar.sortOptions.change24h") },
    { value: "percent_change_7d", label: t("toolbar.sortOptions.change7d") },
    { value: "name", label: t("toolbar.sortOptions.name") },
  ];

  const FILTER_OPTIONS: { value: ListingFilter; label: string; appearance?: FilterChipAppearance }[] = [
    { value: "all", label: t("toolbar.filterOptions.all") },
    { value: "gainers", label: t("toolbar.filterOptions.gainers"), appearance: "success" },
    { value: "losers", label: t("toolbar.filterOptions.losers"), appearance: "danger" },
    { value: "most_volatile", label: t("toolbar.filterOptions.volatile"), appearance: "warning" },
    { value: "top_volume", label: t("toolbar.filterOptions.topVolume"), appearance: "info" },
  ];

  const ASSET_TYPE_OPTIONS: SelectOption<AssetType>[] = [
    { value: "all", label: t("toolbar.assetType.all") },
    { value: "crypto", label: t("toolbar.assetType.crypto") },
    { value: "stock", label: t("toolbar.assetType.stocks") },
  ];

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

  // Compact mode for mobile - horizontally scrolling toolbar
  if (compact) {
    const scrollContent = (
      <View style={styles.compactScrollContent}>
        {/* Sort controls */}
        <View style={styles.compactGroup}>
          <Select
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={handleSortChange}
            size={Size.Small}
            icon="arrow-up-down"
            style={styles.compactSortSelect}
          />
          <SegmentedControl
            options={SORT_DIR_OPTIONS}
            value={filters.sortDir}
            onChange={handleSortDirChange}
            size={Size.Medium}
          />
        </View>

        {/* Divider */}
        <View style={[styles.compactDivider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Filter chips */}
        <View style={styles.compactGroup} data-testid="toolbar-filter-chips">
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={filters.filter === opt.value}
              onPress={() => handleFilterChange(opt.value)}
              size={Size.Small}
              appearance={opt.appearance}
              data-testid={`filter-chip-${opt.value}`}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.compactDivider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Offline markets toggle */}
        <Toggle
          value={filters.showOfflineMarkets}
          onValueChange={handleShowOfflineChange}
          leftIcon="clock"
          rightIcon="moon"
          size={Size.Medium}
        />

        {/* Divider */}
        <View style={[styles.compactDivider, { backgroundColor: themeColors.border.subtle }]} />

        {/* View toggle (List/Charts) */}
        <div data-sherpa="view-toggle">
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={onViewModeChange}
            size={Size.Medium}
          />
        </div>
      </View>
    );

    return (
      <View style={[styles.compactWrapper, { borderBottomColor: themeColors.border.subtle }]}>
        {Platform.OS === "web" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="hide-scrollbar"
          >
            {scrollContent}
          </div>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.compactScrollView}
            contentContainerStyle={styles.compactScrollContent}
          >
            {scrollContent}
          </ScrollView>
        )}
      </View>
    );
  }

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
            placeholder={t("toolbar.sortBy")}
            icon="arrow-up-down"
            style={styles.sortSelect}
          />
          <SegmentedControl
            options={SORT_DIR_OPTIONS}
            value={filters.sortDir}
            onChange={handleSortDirChange}
            size={Size.Large}
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Filter chips */}
        <View style={styles.filterGroup}>
          {FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              selected={filters.filter === opt.value}
              onPress={() => handleFilterChange(opt.value)}
              size={Size.Medium}
              appearance={opt.appearance}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Asset type dropdown */}
        <Select
          options={ASSET_TYPE_OPTIONS}
          value={filters.assetType}
          onChange={handleAssetTypeChange}
          size={Size.Medium}
          placeholder={t("toolbar.assetTypePlaceholder")}
          style={styles.assetTypeSelect}
        />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: themeColors.border.subtle }]} />

        {/* Show Offline Markets toggle */}
        <Toggle
          value={filters.showOfflineMarkets}
          onValueChange={handleShowOfflineChange}
          leftIcon="clock"
          rightIcon="moon"
          size={Size.Large}
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
        <div data-sherpa="view-toggle">
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={onViewModeChange}
            size={Size.Large}
          />
        </div>
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
  compactWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  compactScrollView: {
    flex: 1,
  },
  compactScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingLeft: 16,
    paddingRight: 12,
  },
  compactGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  compactDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  compactViewToggle: {
    paddingRight: 12,
    paddingLeft: 8,
    flexShrink: 0,
    borderLeftWidth: 1,
  },
  compactSortSelect: {
    minWidth: 110,
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
