/**
 * Sherpa Hint System Types
 *
 * A hint-based onboarding system using hotspots and pulse indicators.
 */

/** Placement options for hint popups */
export type SherpaPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right";

/** Indicator style for the hint */
export type SherpaIndicatorStyle = "hotspot" | "pulse" | "beacon";

/** Icon type for hotspot indicators */
export type SherpaHotspotIcon = "!" | "?" | "i" | "new";

/** A single hint definition */
export type SherpaHint = {
  /** Unique identifier for this hint */
  id: string;
  /** Title shown in the popup */
  title: string;
  /** Content/description shown in the popup */
  content: string;
  /** CSS selector for the target element */
  target: string;
  /** Placement of the popup relative to target */
  placement?: SherpaPlacement;
  /** Indicator style to use */
  indicatorStyle?: SherpaIndicatorStyle;
  /** Icon for hotspot style */
  hotspotIcon?: SherpaHotspotIcon;
  /** Color override for the indicator */
  color?: string;
  /** Category/group for organization */
  category?: string;
};

/** A collection of hints for a page/feature */
export type SherpaHintGroup = {
  /** Unique identifier for the group */
  id: string;
  /** Name of the hint group */
  name: string;
  /** Hints in this group */
  hints: SherpaHint[];
};

/** State of hint viewing progress */
export type SherpaProgress = {
  /** IDs of hints that have been viewed/dismissed */
  viewedHints: string[];
  /** Timestamp of last update */
  lastUpdated: number;
};

/** Context state */
export type SherpaState = {
  /** Current progress */
  progress: SherpaProgress;
  /** Whether hints are globally enabled */
  hintsEnabled: boolean;
  /** Currently active popup hint ID (if any) */
  activeHintId: string | null;
};

/** Context value */
export type SherpaContextValue = {
  /** Current state */
  state: SherpaState;
  /** Show a hint popup */
  showHint: (hintId: string) => void;
  /** Dismiss/hide the current popup */
  dismissHint: () => void;
  /** Mark a hint as viewed (won't show indicator again) */
  markHintViewed: (hintId: string) => void;
  /** Check if a hint has been viewed */
  isHintViewed: (hintId: string) => boolean;
  /** Reset a hint to show again */
  resetHint: (hintId: string) => void;
  /** Reset all hints */
  resetAllHints: () => void;
  /** Toggle hints on/off globally */
  setHintsEnabled: (enabled: boolean) => void;
};
