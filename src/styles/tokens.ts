/**
 * @file tokens.ts
 * @description Standardized design tokens for consistent styling across Wraith.
 *
 * These tokens map to Ghost's design system and provide numeric values
 * for use in StyleSheet.create() calls.
 *
 * ## Usage:
 * ```typescript
 * import { spacing, radii } from "../styles/tokens";
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: spacing.md,      // 16
 *     gap: spacing.sm,          // 12
 *     borderRadius: radii.md,   // 8
 *   },
 * });
 * ```
 */

/**
 * Spacing values in pixels.
 * Use these for padding, margin, and gap properties.
 *
 * Maps to Ghost's Spacing tokens (converted from rem to px):
 * - xxs: 4px  (0.25rem)
 * - xs:  8px  (0.5rem)
 * - sm:  12px (0.75rem)
 * - md:  16px (1rem) - default
 * - lg:  20px (1.25rem)
 * - xl:  24px (1.5rem)
 * - xxl: 32px (2rem)
 */
export const spacing = {
  /** 0px - no spacing */
  none: 0,
  /** 4px - minimal spacing (icons, tight lists) */
  xxs: 4,
  /** 8px - compact spacing (inline elements, small gaps) */
  xs: 8,
  /** 12px - standard small spacing (list items, card content) */
  sm: 12,
  /** 16px - default spacing (card padding, section gaps) */
  md: 16,
  /** 20px - comfortable spacing (larger cards, prominent sections) */
  lg: 20,
  /** 24px - generous spacing (major sections, headers) */
  xl: 24,
  /** 32px - maximum spacing (page sections, hero areas) */
  xxl: 32,
  /** 40px - extra large for special cases */
  xxxl: 40,
} as const;

/**
 * Border radius values in pixels.
 * Use these for borderRadius properties.
 *
 * Maps to Ghost's Radii tokens:
 * - none:    0px   - no rounding (tables, full-bleed)
 * - soft:    4px   - subtle rounding (tags, badges)
 * - sm:      6px   - small rounding (inputs, small cards)
 * - md:      8px   - standard rounding (cards, buttons) - default
 * - lg:      12px  - large rounding (modals, featured cards)
 * - xl:      16px  - extra large rounding (hero sections)
 * - pill:    9999  - pill/capsule shape (tags, pills)
 * - circle:  9999  - circle (same as pill for squares)
 */
export const radii = {
  /** 0px - no rounding */
  none: 0,
  /** 4px - subtle rounding (tags, small elements) */
  soft: 4,
  /** 6px - small rounding (inputs, compact cards) */
  sm: 6,
  /** 8px - standard rounding (cards, buttons) - DEFAULT */
  md: 8,
  /** 12px - large rounding (modals, featured elements) */
  lg: 12,
  /** 16px - extra large rounding (hero sections) */
  xl: 16,
  /** 9999px - pill shape (tags, chips) */
  pill: 9999,
  /** 9999px - circle shape (avatars when square) */
  circle: 9999,
  /** 9999px - full rounding (alias for circle) */
  full: 9999,
} as const;

/**
 * Common size presets for cards and containers.
 * These combine multiple tokens for consistent sizing.
 */
export const cardSizes = {
  /** Small card: 320x356px (metric cards) */
  small: { width: 320, height: 356 },
  /** Medium card: 400x400px */
  medium: { width: 400, height: 400 },
  /** Full width card */
  full: { width: "100%" as const },
} as const;

/**
 * Standard card padding based on size.
 */
export const cardPadding = {
  /** Compact: 12px */
  compact: spacing.sm,
  /** Standard: 16px */
  standard: spacing.md,
  /** Comfortable: 20px */
  comfortable: spacing.lg,
  /** Spacious: 24px */
  spacious: spacing.xl,
} as const;

/**
 * Gap presets for flex/grid layouts.
 */
export const gaps = {
  /** Tight: 4px (icon + text, dense lists) */
  tight: spacing.xxs,
  /** Compact: 8px (list items, button groups) */
  compact: spacing.xs,
  /** Standard: 12px (card content, form fields) */
  standard: spacing.sm,
  /** Comfortable: 16px (sections, card rows) */
  comfortable: spacing.md,
  /** Spacious: 24px (major sections) */
  spacious: spacing.xl,
} as const;

// Type exports for TypeScript
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type SpacingKey = keyof Spacing;
export type RadiiKey = keyof Radii;
