/**
 * AdvancedChart module exports
 */

// Main component - re-export from parent for now (will be moved here)
export { AdvancedChart } from "../AdvancedChart";

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
