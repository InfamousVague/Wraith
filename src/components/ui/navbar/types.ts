/**
 * Types for navbar components
 */

import type { AssetType } from "../../services/haunt";

export type { AssetType };

export type NavbarProps = {
  assetType?: AssetType;
  onAssetTypeChange?: (type: AssetType) => void;
};
