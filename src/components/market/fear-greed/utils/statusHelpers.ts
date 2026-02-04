/**
 * Fear & Greed status helper utilities
 */

import { TextAppearance } from "@wraith/ghost/enums";
import type { FearGreedStatus } from "../types";

/**
 * Get the translation keys and appearance for a fear/greed value.
 *
 * Score ranges:
 * - 0-12: Extreme Fear (Panic) - Danger
 * - 13-25: Extreme Fear (Fearful) - Danger
 * - 26-37: Fear (Anxious) - Warning
 * - 38-45: Fear (Cautious) - Warning
 * - 46-55: Neutral (Balanced) - Muted
 * - 56-65: Greed (Optimistic) - Success
 * - 66-75: Greed (Greedy) - Success
 * - 76-87: Extreme Greed (Euphoric) - Success
 * - 88-100: Extreme Greed (Manic) - Success
 *
 * @param value - Fear & Greed index value (0-100)
 * @returns Status object with translation keys and appearance
 */
export function getFearGreedStatus(value: number): FearGreedStatus {
  if (value <= 12) {
    return { labelKey: "extremeFear", circleLabelKey: "panic", appearance: TextAppearance.Danger };
  }
  if (value <= 25) {
    return { labelKey: "extremeFear", circleLabelKey: "fearful", appearance: TextAppearance.Danger };
  }
  if (value <= 37) {
    return { labelKey: "fear", circleLabelKey: "anxious", appearance: TextAppearance.Warning };
  }
  if (value <= 45) {
    return { labelKey: "fear", circleLabelKey: "cautious", appearance: TextAppearance.Warning };
  }
  if (value <= 55) {
    return { labelKey: "neutral", circleLabelKey: "balanced", appearance: TextAppearance.Muted };
  }
  if (value <= 65) {
    return { labelKey: "greed", circleLabelKey: "optimistic", appearance: TextAppearance.Success };
  }
  if (value <= 75) {
    return { labelKey: "greed", circleLabelKey: "greedy", appearance: TextAppearance.Success };
  }
  if (value <= 87) {
    return { labelKey: "extremeGreed", circleLabelKey: "euphoric", appearance: TextAppearance.Success };
  }
  return { labelKey: "extremeGreed", circleLabelKey: "manic", appearance: TextAppearance.Success };
}
