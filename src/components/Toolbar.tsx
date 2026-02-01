import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon, Slider, SegmentedControl, type SegmentOption } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";

export type ViewMode = "list" | "charts";

type ToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Card size in pixels (min width) - only shown in charts mode */
  cardSize?: number;
  onCardSizeChange?: (size: number) => void;
};

const CARD_SIZE_MIN = 140;
const CARD_SIZE_MAX = 400;

const VIEW_OPTIONS: SegmentOption<ViewMode>[] = [
  { value: "list", label: "List", icon: "list" },
  { value: "charts", label: "Charts", icon: "grid" },
];

export function Toolbar({
  viewMode,
  onViewModeChange,
  cardSize = 220,
  onCardSizeChange,
}: ToolbarProps) {
  return (
    <View style={styles.container}>
      {/* Right aligned content */}
      <View style={styles.rightSection}>
        {/* Size slider (charts mode only) - to the left of toggle */}
        {viewMode === "charts" && (
          <View style={styles.sliderContainer}>
            <Icon name="grid" size={Size.ExtraSmall} appearance={TextAppearance.Muted} />
            <View style={styles.slider}>
              <Slider
                value={cardSize}
                min={CARD_SIZE_MIN}
                max={CARD_SIZE_MAX}
                step={10}
                size={Size.Small}
                onChange={onCardSizeChange}
              />
            </View>
            <Icon name="grid" size={Size.Small} appearance={TextAppearance.Muted} />
          </View>
        )}

        {/* View Toggle */}
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={onViewModeChange}
          size={Size.Medium}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    width: 120,
  },
});
