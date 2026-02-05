/**
 * Utility functions for server components
 */

import { Colors } from "@wraith/ghost/tokens";
import type { ServerStatus, PeerStatus } from "./types";

/**
 * Get color based on server/peer status
 */
export function getStatusColor(status: ServerStatus | PeerStatus["status"]): string {
  switch (status) {
    case "online":
    case "connected":
      return Colors.status.success;
    case "offline":
    case "failed":
      return Colors.status.danger;
    case "checking":
    case "connecting":
      return Colors.data.amber;
    case "disconnected":
    default:
      return Colors.text.muted;
  }
}

/**
 * Get color based on latency value
 */
export function getLatencyColor(latencyMs: number | null | undefined): string {
  if (latencyMs === null || latencyMs === undefined) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

/**
 * Get icon name based on peer connection status
 */
export function getStatusIcon(status: PeerStatus["status"]): string {
  switch (status) {
    case "connected":
      return "check-circle";
    case "connecting":
      return "loader";
    case "disconnected":
      return "minus-circle";
    case "failed":
      return "x-circle";
    default:
      return "circle";
  }
}

/**
 * Threshold for removing offline servers from list (5 minutes)
 */
export const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
