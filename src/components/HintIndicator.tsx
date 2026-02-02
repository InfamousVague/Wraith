/**
 * Hint Indicator Component
 *
 * A help icon that shows a tooltip popup when clicked.
 * - Always visible on components
 * - Pulses when "active" (new/unviewed) - only one pulses at a time
 * - After viewing, becomes muted but remains visible
 */

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { View, StyleSheet, Platform } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useHints } from "../context/HintContext";

// ============================================================================
// INFO INDICATOR - Always visible info icon with optional pulse animation
// ============================================================================

type InfoIndicatorProps = {
  color: string;
  icon: "!" | "?" | "i";
  active: boolean;
  opacity: number;
};

function InfoIndicator({ color, icon, active, opacity }: InfoIndicatorProps) {
  const size = 16;
  const isOutline = !active; // Show outline when viewed/inactive

  // Inject CSS keyframes for ripple animation (only once)
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const styleId = "hint-ripple-animation";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes hint-ripple {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(2.2);
          opacity: 0;
        }
      }
      .hint-ripple-ring {
        animation: hint-ripple 1.5s ease-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div
      style={{
        width: size * 2,
        height: size * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        position: "relative",
      }}
    >
      {/* Ripple ring - CSS animation for reliable web rendering */}
      {active && (
        <div
          className="hint-ripple-ring"
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            border: `2px solid ${color}`,
            boxSizing: "border-box",
          }}
        />
      )}
      {/* Main circle - stays fixed size */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOutline ? "transparent" : color,
          border: isOutline ? `1.5px solid ${color}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <View pointerEvents="none">
          <Text size={Size.TwoXSmall} weight="bold" style={{ color: isOutline ? color : "#FFFFFF" }}>
            {icon}
          </Text>
        </View>
      </div>
    </div>
  );
}

type HintIndicatorProps = {
  /** Unique ID for this hint */
  id: string;
  /** Tooltip title */
  title: string;
  /** Tooltip content */
  content: string;
  /** Priority in the hint queue (lower = shown first) */
  priority?: number;
  /** Hotspot icon */
  icon?: "!" | "?" | "i";
  /** Color when active */
  color?: string;
  /** If true, renders inline instead of absolute positioned (for placing next to headings) */
  inline?: boolean;
};

const POPUP_WIDTH = 320;

export function HintIndicator({
  id,
  title,
  content,
  priority = 100,
  icon = "i",
  color = "#A78BFA",
  inline = false,
}: HintIndicatorProps) {
  const { registerHint, unregisterHint, dismissHint, isActive, isViewed } = useHints();
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  const active = isActive(id);
  const viewed = isViewed(id);

  // Register this hint on mount
  useEffect(() => {
    registerHint(id, priority);
    return () => unregisterHint(id);
  }, [id, priority, registerHint, unregisterHint]);

  // Don't render on non-web platforms
  if (Platform.OS !== "web") {
    return null;
  }

  const handlePress = (event: React.MouseEvent) => {
    // Use clientX/clientY for fixed positioning (viewport coordinates)
    const clickX = event.clientX;
    const clickY = event.clientY;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Determine popup position based on available space
    let left = clickX + 12;
    let top = clickY + 12;

    // If popup would go off right edge, show on left of click
    if (left + POPUP_WIDTH > windowWidth - 20) {
      left = clickX - POPUP_WIDTH - 12;
    }

    // If popup would go off bottom, show above click
    if (top + 200 > windowHeight - 20) {
      top = clickY - 200 - 12;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, windowWidth - POPUP_WIDTH - 16));
    top = Math.max(16, top);

    setPopupPosition({ top, left });
    setIsOpen(true);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    dismissHint(id);
  };

  const handleBackdropClick = () => {
    setIsOpen(false);
    dismissHint(id);
  };

  // Determine appearance based on state
  const shouldPulse = active && !viewed && !isOpen;
  const indicatorColor = viewed ? "#6B7280" : color; // Gray when viewed
  const indicatorOpacity = viewed ? 0.6 : 1;

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
      {isOpen && popupPosition && ReactDOM.createPortal(
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
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 9999,
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: "fixed",
              top: popupPosition.top,
              left: popupPosition.left,
              width: POPUP_WIDTH,
              backgroundColor: "#0A0C10",
              borderRadius: 12,
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: 0,
              zIndex: 10000,
              boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)",
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
              }}
            >
              <View pointerEvents="none">
                <Text size={Size.Medium} weight="semibold" style={{ color: "#F4F6FF" }}>
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
                  <Icon name="x" size={Size.Small} color="#6B7280" />
                </View>
              </div>
            </div>
            {/* Content */}
            <div style={{ padding: "0 20px 16px 20px" }}>
              <View pointerEvents="none">
                <Text size={Size.Small} style={{ color: "#9CA3AF", lineHeight: 22 }}>
                  {content}
                </Text>
              </View>
            </div>
            {/* Footer */}
            <div
              style={{
                padding: "12px 20px 16px 20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                onClick={handleDismiss}
                style={{
                  backgroundColor: "rgba(167, 139, 250, 0.15)",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  borderRadius: 6,
                  padding: "8px 20px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(167, 139, 250, 0.25)";
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(167, 139, 250, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                }}
              >
                <View pointerEvents="none">
                  <Text size={Size.Small} weight="semibold" style={{ color: "#A78BFA" }}>
                    Got it
                  </Text>
                </View>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    marginBottom: 12,
    paddingRight: 20,
  },
  title: {
    marginBottom: 6,
    color: "#F4F6FF",
  },
  description: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
