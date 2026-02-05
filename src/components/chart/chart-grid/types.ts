/**
 * Types for chart grid components
 */

import type { Asset } from "../../../types/asset";
import type { ThemeColors } from "@wraith/ghost/context/ThemeContext";

export type { Asset, ThemeColors };

export type ChartGridProps = {
  assets: Asset[];
  loading?: boolean;
  searchQuery?: string;
  /** Card min width in pixels - controls card size via slider */
  cardSize?: number;
};

export type ChartCardProps = {
  asset: Asset;
  cardSize: number;
  themeColors: ThemeColors;
  searchQuery: string;
  volLabel: string;
};

export type LoadingCardProps = {
  cardSize: number;
  themeColors: ThemeColors;
};
