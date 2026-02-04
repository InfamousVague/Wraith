/**
 * Types for hint indicator components
 */

export type InfoIndicatorProps = {
  color: string;
  icon: "!" | "?" | "i";
  active: boolean;
  opacity: number;
};

export type HintIndicatorProps = {
  /** Unique ID for this hint */
  id: string;
  /** Tooltip title */
  title: string;
  /** Tooltip content (plain text) */
  content?: string;
  /** Rich content (React elements) - takes precedence over content string */
  children?: React.ReactNode;
  /** Priority in the hint queue (lower = shown first) */
  priority?: number;
  /** Hotspot icon */
  icon?: "!" | "?" | "i";
  /** Color when active */
  color?: string;
  /** If true, renders inline instead of absolute positioned (for placing next to headings) */
  inline?: boolean;
  /** Width of the popup in pixels (default: 320) */
  width?: number;
};
