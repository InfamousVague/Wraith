/**
 * Types for top movers components
 */

import type { Mover, MoverTimeframe, AssetType } from "../../../services/haunt";

export type { Mover, MoverTimeframe, AssetType };

export type TopMoversCardProps = {
  loading?: boolean;
  pollInterval?: number;
  /** Asset type filter - when "all", includes stocks in top movers */
  assetType?: AssetType;
};

export type MoverRowProps = {
  mover: Mover;
  rank: number;
};

export type TimeframeOption = {
  value: MoverTimeframe;
  label: string;
};
