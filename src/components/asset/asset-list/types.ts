/**
 * Types for AssetList component
 */

import type { Asset } from "../../../types/asset";
import type { FilterState } from "../../ui/toolbar/types";

export type AssetListProps = {
  filters: FilterState;
  /** Edge-to-edge cards on mobile */
  fullBleed?: boolean;
};

export type AssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  searchQuery: string;
  onTradePress?: (symbol: string) => void;
};

export type MobileAssetRowProps = {
  asset: Asset;
  isLast: boolean;
  borderColor: string;
  onTradePress?: (symbol: string) => void;
};

export type LoadingRowProps = {
  borderColor: string;
};
