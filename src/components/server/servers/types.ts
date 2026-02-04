/**
 * Types for server-related components
 */

import type { ApiServer, ServerStatus } from "../../context/ApiServerContext";
import type { PeerStatus, SyncStatus } from "../../services/haunt";

export type { ApiServer, ServerStatus, PeerStatus, SyncStatus };

export type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (id: string) => void;
  peerStatus?: PeerStatus;
  showPingIndicator?: boolean;
};

export type SyncIndicatorProps = {
  syncStatus?: SyncStatus;
};

export type FastestServerCardProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: () => void;
};
