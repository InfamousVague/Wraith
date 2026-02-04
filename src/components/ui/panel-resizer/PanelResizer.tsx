/**
 * @file PanelResizer.tsx
 * @description Draggable divider for resizing adjacent panels.
 * Full-height clickable area with visible indicator on hover.
 */

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Colors } from "@wraith/ghost/tokens";

type PanelResizerProps = {
  onResize: (delta: number) => void;
  direction?: "horizontal" | "vertical";
};

export function PanelResizer({
  onResize,
  direction = "horizontal",
}: PanelResizerProps) {
  const isDragging = useRef(false);
  const lastPosition = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastPosition.current = direction === "horizontal" ? e.clientX : e.clientY;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [direction]);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const currentPosition = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = currentPosition - lastPosition.current;
      lastPosition.current = currentPosition;

      if (delta !== 0) {
        onResize(delta);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [direction, onResize]);

  if (Platform.OS !== "web") {
    return null;
  }

  const isHorizontal = direction === "horizontal";

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isHorizontal ? 12 : "100%",
        minHeight: isHorizontal ? 100 : undefined,
        height: isHorizontal ? undefined : 12,
        alignSelf: "stretch",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Full-height/width indicator line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: isHorizontal ? "50%" : 0,
          right: isHorizontal ? undefined : 0,
          width: isHorizontal ? 2 : undefined,
          height: isHorizontal ? undefined : 2,
          transform: isHorizontal ? "translateX(-50%)" : "translateY(-50%)",
          backgroundColor: isHovered ? Colors.accent.primary : Colors.border.subtle,
          opacity: isHovered ? 0.8 : 0.4,
          transition: "opacity 0.15s, background-color 0.15s",
        }}
      />
    </div>
  );
}
