/**
 * Sherpa Hint System
 *
 * A hint-based onboarding system using hotspots and pulse indicators.
 */

// Types
export type {
  SherpaHint,
  SherpaHintGroup,
  SherpaPlacement,
  SherpaIndicatorStyle,
  SherpaHotspotIcon,
  SherpaProgress,
  SherpaState,
  SherpaContextValue,
} from "./types";

// Context & Hook
export { SherpaProvider, useSherpa } from "./SherpaContext";

// Components
export { SherpaHint } from "./SherpaHint";

// Hints
export { homeHints, homeHintGroup, HOME_HINTS_ID } from "./hints/homeHints";
