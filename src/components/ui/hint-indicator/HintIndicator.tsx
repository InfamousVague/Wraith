/**
 * Hint Indicator Component
 *
 * A help icon that shows a tooltip popup when clicked.
 * - Desktop: Positioned popup that stays within viewport with scrolling support
 * - Mobile: Slide-up bottom sheet modal
 * - Always visible on components
 * - Pulses when "active" (new/unviewed) - only one pulses at a time
 * - After viewing, becomes muted but remains visible
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { View, Platform, ScrollView, Animated, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icon } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useHints } from "../../../context/HintContext";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { InfoIndicator } from "./InfoIndicator";
import { DEFAULT_POPUP_WIDTH } from "./constants";
import type { HintIndicatorProps } from "./types";

const MOBILE_SHEET_MAX_HEIGHT = 0.85; // 85% of viewport height
const DESKTOP_POPUP_MAX_HEIGHT = 500;
const DESKTOP_POPUP_PADDING = 20;

export function HintIndicator({
  id,
  title,
  content,
  children,
  priority = 100,
  icon = "i",
  color = Colors.accent.primary,
  inline = false,
  width = DEFAULT_POPUP_WIDTH,
}: HintIndicatorProps) {
  const popupWidth = width;
  const { t } = useTranslation("common");
  const { registerHint, unregisterHint, dismissHint, isActive, isViewed } = useHints();
  const { isMobile, height: viewportHeight } = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const active = isActive(id);
  const viewed = isViewed(id);

  // Register this hint on mount
  useEffect(() => {
    registerHint(id, priority);
    return () => unregisterHint(id);
  }, [id, priority, registerHint, unregisterHint]);

  // Animate mobile sheet
  useEffect(() => {
    if (isMobile && isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, isMobile, slideAnim]);

  // Don't render on non-web platforms
  if (Platform.OS !== "web") {
    return null;
  }

  const handlePress = (event: React.MouseEvent) => {
    if (isMobile) {
      // Mobile: just open the bottom sheet
      setIsOpen(true);
      return;
    }

    // Desktop: Calculate optimal popup position
    const clickX = event.clientX;
    const clickY = event.clientY;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate available space in each direction
    const spaceRight = windowWidth - clickX - DESKTOP_POPUP_PADDING;
    const spaceLeft = clickX - DESKTOP_POPUP_PADDING;
    const spaceBelow = windowHeight - clickY - DESKTOP_POPUP_PADDING;
    const spaceAbove = clickY - DESKTOP_POPUP_PADDING;

    // Determine horizontal position
    let left: number;
    if (spaceRight >= popupWidth) {
      // Prefer right of click
      left = clickX + 12;
    } else if (spaceLeft >= popupWidth) {
      // Show left of click
      left = clickX - popupWidth - 12;
    } else {
      // Center horizontally if neither side has enough space
      left = Math.max(DESKTOP_POPUP_PADDING, (windowWidth - popupWidth) / 2);
    }

    // Determine vertical position and max height
    // Strategy: Maximize available space for content by positioning at top/bottom of viewport
    let top: number;
    let maxHeight: number;

    if (spaceBelow >= 200) {
      // Prefer below click - position just below click point
      top = clickY + 12;
      maxHeight = Math.min(DESKTOP_POPUP_MAX_HEIGHT, spaceBelow - 20);
    } else if (spaceAbove >= 200) {
      // More space above - position at TOP of viewport to maximize height
      // Instead of positioning near click, use all available space above
      top = DESKTOP_POPUP_PADDING;
      maxHeight = Math.min(DESKTOP_POPUP_MAX_HEIGHT, spaceAbove - 20);
    } else {
      // Neither has enough space - center vertically
      maxHeight = Math.min(DESKTOP_POPUP_MAX_HEIGHT, windowHeight - DESKTOP_POPUP_PADDING * 2);
      top = Math.max(DESKTOP_POPUP_PADDING, (windowHeight - maxHeight) / 2);
    }

    // Final clamp to viewport
    left = Math.max(DESKTOP_POPUP_PADDING, Math.min(left, windowWidth - popupWidth - DESKTOP_POPUP_PADDING));
    top = Math.max(DESKTOP_POPUP_PADDING, Math.min(top, windowHeight - 100));

    setPopupPosition({ top, left, maxHeight });
    setIsOpen(true);
  };

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    dismissHint(id);
  }, [dismissHint, id]);

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
    dismissHint(id);
  }, [dismissHint, id]);

  // Determine appearance based on state
  const shouldPulse = active && !viewed && !isOpen;
  const indicatorColor = viewed ? "#6B7280" : color;
  const indicatorOpacity = viewed ? 0.6 : 1;

  // Mobile bottom sheet height
  const mobileSheetHeight = viewportHeight * MOBILE_SHEET_MAX_HEIGHT;

  return (
    <>
      {/* Info icon - inline or absolute positioned */}
      <div
        onClick={handlePress}
        style={inline ? {
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: -8,
          marginTop: -8,
          marginBottom: -8,
        } : {
          position: "absolute",
          top: -11,
          right: -11,
          zIndex: 10,
          cursor: "pointer",
        }}
      >
        <View pointerEvents="none">
          <InfoIndicator
            color={indicatorColor}
            icon={icon}
            active={shouldPulse}
            opacity={indicatorOpacity}
          />
        </View>
      </div>

      {/* Backdrop + Popup - rendered via Portal */}
      {isOpen && ReactDOM.createPortal(
        <>
          {/* Blurred backdrop */}
          <div
            onClick={handleBackdropClick}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 9999,
            }}
          />

          {isMobile ? (
            /* Mobile: Bottom Sheet */
            <Animated.View
              style={{
                position: "fixed" as any,
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: mobileSheetHeight,
                backgroundColor: "rgba(18, 18, 24, 0.92)" as any,
                backdropFilter: "blur(32px)" as any,
                WebkitBackdropFilter: "blur(32px)" as any,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.10)",
                borderBottomWidth: 0,
                zIndex: 10000,
                overflow: "hidden",
                boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)" as any,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [mobileSheetHeight, 0],
                  }),
                }],
              }}
            >
              {/* Drag Handle */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 12,
                paddingBottom: 8,
              }}>
                <div style={{
                  width: 36,
                  height: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 2,
                }} />
              </div>

              {/* Header */}
              <div
                style={{
                  padding: "8px 20px 16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <View pointerEvents="none">
                  <Text size={Size.Large} weight="bold" style={{ color: Colors.text.primary }}>
                    {title}
                  </Text>
                </View>
                <div
                  onClick={handleDismiss}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <View pointerEvents="none">
                    <Icon name="x" size={Size.Medium} color={Colors.text.muted} />
                  </View>
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollView
                style={{ maxHeight: mobileSheetHeight - 160 }}
                showsVerticalScrollIndicator={true}
              >
                <div style={{ padding: "16px 20px 24px 20px" }}>
                  {children ? (
                    children
                  ) : (
                    <View pointerEvents="none">
                      <Text size={Size.Medium} style={{ color: Colors.text.secondary, lineHeight: 24 }}>
                        {content}
                      </Text>
                    </View>
                  )}
                </div>
              </ScrollView>

              {/* Footer */}
              <div
                style={{
                  padding: "16px 20px 32px 20px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  onClick={handleDismiss}
                  style={{
                    backgroundColor: Colors.accent.primary,
                    borderRadius: 12,
                    padding: "14px 24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View pointerEvents="none">
                    <Text size={Size.Medium} weight="semibold" style={{ color: "#FFFFFF" }}>
                      {t("buttons.gotIt")}
                    </Text>
                  </View>
                </div>
              </div>
            </Animated.View>
          ) : (
            /* Desktop: Positioned Popup */
            popupPosition && (
              <div
                style={{
                  position: "fixed",
                  top: popupPosition.top,
                  left: popupPosition.left,
                  width: popupWidth,
                  maxHeight: popupPosition.maxHeight,
                  background: "rgba(18, 18, 24, 0.92)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  borderRadius: 16,
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  zIndex: 10000,
                  boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "16px 20px 12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <View pointerEvents="none">
                    <Text size={Size.Medium} weight="semibold" style={{ color: Colors.text.primary }}>
                      {title}
                    </Text>
                  </View>
                  <div
                    onClick={handleDismiss}
                    style={{
                      padding: 4,
                      cursor: "pointer",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: -4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <View pointerEvents="none">
                      <Icon name="x" size={Size.Small} color={Colors.text.muted} />
                    </View>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: "0 20px 16px 20px",
                  }}
                >
                  {children ? (
                    children
                  ) : (
                    <View pointerEvents="none">
                      <Text size={Size.Small} style={{ color: Colors.text.secondary, lineHeight: 22 }}>
                        {content}
                      </Text>
                    </View>
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: "12px 20px 16px 20px",
                    display: "flex",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    onClick={handleDismiss}
                    style={{
                      backgroundColor: "rgba(167, 139, 250, 0.12)",
                      border: "1px solid rgba(167, 139, 250, 0.25)",
                      borderRadius: 8,
                      padding: "8px 20px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(167, 139, 250, 0.22)";
                      e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.45)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(167, 139, 250, 0.12)";
                      e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.25)";
                    }}
                  >
                    <View pointerEvents="none">
                      <Text size={Size.Small} weight="semibold" style={{ color: Colors.accent.primary }}>
                        {t("buttons.gotIt")}
                      </Text>
                    </View>
                  </div>
                </div>
              </div>
            )
          )}
        </>,
        document.body
      )}
    </>
  );
}
