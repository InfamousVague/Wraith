/**
 * Types for peer status components
 */

import type { PeerStatus } from "../../hooks/useHauntSocket";

export type PeerRowProps = {
  peer: PeerStatus;
};

export type PeerStatusCardProps = {
  loading?: boolean;
};
