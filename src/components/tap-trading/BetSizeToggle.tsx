/**
 * @file BetSizeToggle.tsx
 * @description Bottom-right bet size popup picker.
 * Shows current bet size as a pill. Tap to open picker with all presets.
 */

import React, { useState, useRef, useEffect } from "react";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

type BetSizeToggleProps = {
  value: number;
  presets: number[];
  onChange: (size: number) => void;
};

export function BetSizeToggle({ value, presets, onChange }: BetSizeToggleProps) {
  const themeColors = useThemeColors();
  const borderColor = themeColors.border.subtle;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={wrapperStyle}>
      {open && (
        <div style={{ ...pickerStyle, border: `1px solid ${borderColor}` }}>
          {presets.map((preset) => (
            <button
              key={preset}
              style={{
                ...presetStyle,
                ...(preset === value ? activePresetStyle : {}),
              }}
              onClick={() => {
                onChange(preset);
                setOpen(false);
              }}
            >
              ${preset}
            </button>
          ))}
        </div>
      )}
      <button style={{ ...pillStyle, border: `1px solid ${borderColor}` }} onClick={() => setOpen(!open)}>
        ${value}
      </button>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  position: "relative",
};

const pillStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.08)",
  borderRadius: 20,
  padding: "6px 16px",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
  cursor: "pointer",
  transition: "background 0.15s",
};

const pickerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 8px)",
  right: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 6,
  backgroundColor: "rgba(20, 20, 25, 0.95)",
  borderRadius: 10,
  backdropFilter: "blur(12px)",
  zIndex: 50,
};

const presetStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 6,
  padding: "6px 20px",
  color: "rgba(255, 255, 255, 0.6)",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "-apple-system, system-ui, sans-serif",
  cursor: "pointer",
  transition: "all 0.15s",
  whiteSpace: "nowrap",
};

const activePresetStyle: React.CSSProperties = {
  background: "rgba(47, 213, 117, 0.15)",
  border: "1px solid rgba(47, 213, 117, 0.3)",
  color: "#2FD575",
  fontWeight: 600,
};
