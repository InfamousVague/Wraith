/**
 * AdvancedChart module exports
 */

// Main component
export { AdvancedChart } from "./AdvancedChart";

// Types
export type {
  TimeRange,
  ChartType,
  Indicator,
  AdvancedChartProps,
  ChartDataPoint,
  OHLCData,
  CrosshairData,
  ChartTypeOption,
  TimeRangeOption,
  IndicatorConfig,
} from "./types";

// Components
export { ChartLegend } from "./ChartLegend";
export { ChartSettingsButton, DEFAULT_CHART_SETTINGS } from "./ChartSettings";
export type { ChartSettings, CrosshairMode } from "./ChartSettings";

// Utils
export {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  type BollingerBandsResult,
} from "./utils/chartIndicators";

export {
  generateOHLCData,
  generateLineData,
} from "./utils/dataGenerators";

export {
  CHART_TYPE_OPTIONS,
  TIME_RANGE_OPTIONS,
  INDICATORS,
  API_RANGE_MAP,
  getPointCountForRange,
  getIntervalSecondsForRange,
  removeWatermark,
} from "./utils/chartConfig";

// Styles
export { styles as advancedChartStyles } from "./styles";
