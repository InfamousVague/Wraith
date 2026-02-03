/**
 * Styles for AdvancedChart component
 */

import { StyleSheet } from "react-native";
import { Colors } from "@wraith/ghost/tokens";

export const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
    flex: 1, // Fill available space
    display: "flex",
    flexDirection: "column",
  },
  cardMobile: {
    padding: 0,
    gap: 8,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 12,
  },
  controlsContainerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  leftControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightControlsMobile: {
    width: "100%",
    justifyContent: "center",
  },
  indicatorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.overlay.white.light,
  },
  chartContainer: {
    flex: 1, // Fill remaining space in card
    width: "100%",
    minHeight: 200, // Minimum chart height
    borderRadius: 8,
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.overlay.white.subtle,
    borderRadius: 8,
  },
  indicatorLegend: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 8,
  },
  legendTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seedingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  seedingBannerMobile: {
    marginHorizontal: 12,
    borderRadius: 6,
  },
  seedingHeartbeat: {
    marginRight: 8,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
});
