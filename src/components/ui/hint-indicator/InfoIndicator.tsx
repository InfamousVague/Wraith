/**
 * Info indicator icon with optional pulse animation
 */

import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import type { InfoIndicatorProps } from "./types";

export function InfoIndicator({ color, icon, active, opacity }: InfoIndicatorProps) {
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
