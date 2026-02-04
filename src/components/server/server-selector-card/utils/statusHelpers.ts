/**
 * Status helper functions for server selector card
 */

import { Colors } from "@wraith/ghost/tokens";
import type { ServerStatus } from "../../../context/ApiServerContext";

/** Get color for server status */
export function getStatusColor(status: ServerStatus): string {
  switch (status) {
    case "online":
      return Colors.status.success;
    case "offline":
      return Colors.status.danger;
    case "checking":
      return Colors.data.amber;
    default:
      return Colors.text.muted;
  }
}

/** Get color for latency value */
export function getLatencyColor(latencyMs: number | null): string {
  if (latencyMs === null) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

/** Get health color based on percentage */
export function getHealthColor(healthPercent: number): string {
  if (healthPercent >= 80) return Colors.status.success;
  if (healthPercent >= 50) return Colors.status.warning;
  return Colors.status.danger;
}
