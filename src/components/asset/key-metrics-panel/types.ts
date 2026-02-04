import type { Asset } from "../../../types/asset";
import type { SignalDirection, SymbolSignals } from "../../../types/signals";
import type { RegionDominance } from "../../../services/haunt";

export type KeyMetricsPanelProps = {
  asset: Asset | null;
  signals: SymbolSignals | null;
  loading?: boolean;
};

export type MetricItem = {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  icon: string;
  color?: string;
  progress?: number; // 0-100 for visual gauge
  direction?: SignalDirection;
};

export type ExchangeDominanceData = {
  regions: RegionDominance[];
  loading: boolean;
  error: string | null;
};
