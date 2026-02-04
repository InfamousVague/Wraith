/**
 * Constants for prediction history
 */

import type { FilterTabConfig } from "./types";

/** Filter tabs configuration */
export const FILTER_TABS: FilterTabConfig[] = [
  { key: "all", label: "All" },
  { key: "validated", label: "Validated" },
  { key: "pending", label: "Pending" },
];

/** Maximum number of predictions to display */
export const MAX_PREDICTIONS_DISPLAY = 20;
