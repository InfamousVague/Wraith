/**
 * Types for toolbar components
 */

import type { SortField, SortDirection, ListingFilter, AssetType } from "../../services/haunt";

export type { SortField, SortDirection, ListingFilter, AssetType };

export type ViewMode = "list" | "charts";

export type FilterState = {
  sort: SortField;
  sortDir: SortDirection;
  filter: ListingFilter;
  assetType: AssetType;
  /** Show assets from closed/offline markets (stocks after hours) */
  showOfflineMarkets: boolean;
};

export type ToolbarProps = {
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
