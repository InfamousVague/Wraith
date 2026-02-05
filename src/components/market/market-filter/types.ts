/**
 * Types for market filter components
 */

import type { IconName } from "@wraith/ghost/components";
import type { AssetType } from "../../../services/haunt";

export type { AssetType, IconName };

export type MarketFilterProps = {
  value: AssetType;
  onChange: (type: AssetType) => void;
};

export type MarketOption = {
  value: AssetType;
  icon: IconName;
  labelKey: string;
};
