/**
 * Status helper functions for server selector
 */

import { Colors } from "@wraith/ghost/tokens";

/** Get color for latency value */
export function getLatencyColor(latency: number | null): string {
  if (latency === null) return Colors.data.slate;
  if (latency < 50) return Colors.status.success;
  if (latency < 150) return Colors.status.warning;
  if (latency < 300) return Colors.data.amber;
  return Colors.status.danger;
}

/** Get color for server status */
export function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return Colors.status.success;
    case "checking":
      return Colors.status.warning;
    case "offline":
    default:
      return Colors.status.danger;
  }
}
