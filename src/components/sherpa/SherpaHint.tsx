/**
 * Sherpa Hint Component
 *
 * A positioned indicator (hotspot/pulse) that shows a popup when clicked.
 * Once dismissed, the hint is marked as viewed and won't show again.
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Text, Button, Icon } from "@wraith/ghost/components";
import { PulseIndicator, HotspotIndicator, BeaconIndicator } from "@wraith/ghost/components";
import { Size, TextAppearance, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useSherpa } from "./SherpaContext";
import type { SherpaHint as SherpaHintType } from "./types";

type SherpaHintProps = {
  hint: SherpaHintType;
};

type Position = {
  indicatorTop: number;
  indicatorLeft: number;
  popupTop: number;
  popupLeft: number;
};

const POPUP_WIDTH = 260;
const POPUP_MARGIN = 8;
const INDICATOR_SIZE = 24;
const INDICATOR_OFFSET = 4; // How far inside the corner

export function SherpaHint({ hint }: SherpaHintProps) {
  const { state, showHint, dismissHint } = useSherpa();
  const [position, setPosition] = useState<Position | null>(null);

  const isActive = state.activeHintId === hint.id;

  // Find target element and calculate position
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const updatePosition = () => {
      const element = document.querySelector(hint.target);
      if (!element) {
        setPosition(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Determine indicator corner based on available space
      // Default to top-right, but use top-left if too close to right edge
      const useLeftSide = rect.right > windowWidth - 50;

      // Position indicator at the corner of the target
      let indicatorTop = rect.top + INDICATOR_OFFSET;
      let indicatorLeft: number;

      if (useLeftSide) {
        // Top-left corner
        indicatorLeft = rect.left + INDICATOR_OFFSET;
      } else {
        // Top-right corner
        indicatorLeft = rect.right - INDICATOR_SIZE - INDICATOR_OFFSET;
      }

      // Clamp indicator to viewport
      indicatorTop = Math.max(INDICATOR_OFFSET, Math.min(indicatorTop, windowHeight - INDICATOR_SIZE - INDICATOR_OFFSET));
      indicatorLeft = Math.max(INDICATOR_OFFSET, Math.min(indicatorLeft, windowWidth - INDICATOR_SIZE - INDICATOR_OFFSET));

      // Position popup below the indicator, aligned to the indicator's edge
      let popupTop = indicatorTop + INDICATOR_SIZE + POPUP_MARGIN;
      let popupLeft: number;

      if (useLeftSide) {
        // Align popup's left edge with indicator
        popupLeft = indicatorLeft;
      } else {
        // Align popup's right edge with indicator
        popupLeft = indicatorLeft + INDICATOR_SIZE - POPUP_WIDTH;
      }

      // Clamp popup to viewport
      popupLeft = Math.max(POPUP_MARGIN, Math.min(popupLeft, windowWidth - POPUP_WIDTH - POPUP_MARGIN));

      // If popup would go below viewport, put it above the indicator
      if (popupTop + 180 > windowHeight) {
        popupTop = indicatorTop - 180 - POPUP_MARGIN;
      }
      popupTop = Math.max(POPUP_MARGIN, popupTop);

      setPosition({
        indicatorTop,
        indicatorLeft,
        popupTop,
        popupLeft,
      });
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [hint.target]);

  // Don't render if disabled or no position
  if (!state.hintsEnabled || !position || Platform.OS !== "web") {
    return null;
  }

  const handleIndicatorPress = () => {
    showHint(hint.id);
  };

  const handleDismiss = () => {
    dismissHint();
  };

  const indicatorStyle = hint.indicatorStyle || "hotspot";
  const color = hint.color || Colors.accent.primary;

  return (
    <>
      {/* Indicator */}
      <div
        onClick={handleIndicatorPress}
        style={{
          position: "fixed",
          top: position.indicatorTop,
          left: position.indicatorLeft,
          zIndex: 9998,
          cursor: "pointer",
        }}
      >
        <View pointerEvents="none">
          {indicatorStyle === "hotspot" && (
            <HotspotIndicator
              size={Size.Small}
              color={color}
              icon={hint.hotspotIcon || "!"}
              active={!isActive}
            />
          )}
          {indicatorStyle === "pulse" && (
            <PulseIndicator size={Size.Small} color={color} active={!isActive} />
          )}
          {indicatorStyle === "beacon" && (
            <BeaconIndicator size={Size.Small} color={color} rings={2} active={!isActive} />
          )}
        </View>
      </div>

      {/* Backdrop when popup is active */}
      {isActive && (
        <div
          onClick={handleDismiss}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 9999,
          }}
        />
      )}

      {/* Popup */}
      {isActive && (
        <div
          style={{
            position: "fixed",
            top: position.popupTop,
            left: position.popupLeft,
            width: POPUP_WIDTH,
            backgroundColor: Colors.background.overlay,
            borderRadius: 10,
            border: `1px solid ${Colors.border.strong}`,
            padding: 14,
            zIndex: 10000,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* Close button */}
          <Pressable onPress={handleDismiss} style={styles.closeButton}>
            <Icon name="x" size={Size.Small} color={Colors.text.muted} />
          </Pressable>

          {/* Content */}
          <View style={styles.content}>
            <Text size={Size.Small} weight="semibold" style={styles.title}>
              {hint.title}
            </Text>
            <Text size={Size.ExtraSmall} appearance={TextAppearance.Secondary} style={styles.description}>
              {hint.content}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Got it"
              appearance={Appearance.Primary}
              size={Size.Small}
              onPress={handleDismiss}
            />
          </View>
        </div>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  content: {
    marginBottom: 12,
    paddingRight: 20,
  },
  title: {
    marginBottom: 6,
    color: Colors.text.primary,
  },
  description: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
