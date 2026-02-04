/**
 * Types for heartbeat chart components
 */

import type { ViewStyle } from "react-native";

export type HeartbeatChartProps = {
  /** Color for the heartbeat line */
  color?: string;
  /** Height of the chart */
  height?: number;
  /** Width of the chart */
  width?: number | "100%";
  /** Optional banner text to overlay */
  bannerText?: string;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Additional style overrides */
  style?: ViewStyle;
};
