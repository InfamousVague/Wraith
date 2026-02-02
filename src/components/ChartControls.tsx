import React from "react";
import { View, StyleSheet } from "react-native";
import { SegmentedControl } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";

export type TimeRange = "1H" | "4H" | "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
export type ChartType = "line" | "area" | "candle";

type ChartControlsProps = {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
};

const TIME_RANGE_OPTIONS = [
  { value: "1H" as const, label: "1H" },
  { value: "4H" as const, label: "4H" },
  { value: "1D" as const, label: "1D" },
  { value: "1W" as const, label: "1W" },
  { value: "1M" as const, label: "1M" },
  { value: "3M" as const, label: "3M" },
  { value: "1Y" as const, label: "1Y" },
  { value: "ALL" as const, label: "ALL" },
];

const CHART_TYPE_OPTIONS = [
  { value: "line" as const, label: "Line" },
  { value: "area" as const, label: "Area" },
  { value: "candle" as const, label: "Candle" },
];

export function ChartControls({
  timeRange,
  onTimeRangeChange,
  chartType,
  onChartTypeChange,
}: ChartControlsProps) {
  return (
    <View style={styles.container}>
      <SegmentedControl
        options={TIME_RANGE_OPTIONS}
        value={timeRange}
        onChange={onTimeRangeChange}
        size={Size.Medium}
      />
      <SegmentedControl
        options={CHART_TYPE_OPTIONS}
        value={chartType}
        onChange={onChartTypeChange}
        size={Size.Medium}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
});
