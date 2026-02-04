/**
 * Toolbar constants
 */

import type { SortDirection } from "./types";

/** Minimum card size in pixels */
export const CARD_SIZE_MIN = 140;

/** Maximum card size in pixels */
export const CARD_SIZE_MAX = 400;

/** Sort direction option shape for segmented control */
type SortDirOption = {
  value: SortDirection;
  label: string;
  icon: string;
};

/** Sort direction options for segmented control */
export const SORT_DIR_OPTIONS: SortDirOption[] = [
  { value: "desc", label: "DESC", icon: "arrow-down" },
  { value: "asc", label: "ASC", icon: "arrow-up" },
];
