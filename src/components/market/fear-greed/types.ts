/**
 * Types for Fear & Greed card components
 */

import type { TextAppearance } from "@wraith/ghost/enums";

export type FearGreedCardProps = {
  value?: number;
  loading?: boolean;
  timestamp?: string;
};

export type FearGreedStatus = {
  labelKey: string;
  circleLabelKey: string;
  appearance: TextAppearance;
};
