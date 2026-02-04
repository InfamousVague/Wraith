/**
 * Status helper functions for server mesh
 */

import { Colors } from "@wraith/ghost/tokens";
import type { PeerStatus } from "../../../hooks/useHauntSocket";

/** Get color for latency value */
export function getLatencyColor(latencyMs: number | undefined): string {
  if (latencyMs === undefined) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

/** Get color for peer status */
export function getStatusColor(status: PeerStatus["status"]): string {
  switch (status) {
    case "connected":
      return Colors.status.success;
    case "connecting":
      return Colors.data.amber;
    case "disconnected":
      return Colors.text.muted;
    case "failed":
      return Colors.status.danger;
    default:
      return Colors.text.muted;
  }
}

/** Get icon name for peer status */
export function getStatusIcon(status: PeerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "check-circle";
    case "connecting":
      return "loader";
    case "disconnected":
      return "circle";
    case "failed":
      return "x-circle";
    default:
      return "circle";
  }
}
