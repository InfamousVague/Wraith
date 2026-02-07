/**
 * @file LeverageControl.tsx
 * @description Top toolbar bar with leverage pills and rolling 24h stats.
 * Leverage pills: 1x, 2x, 5x, 10x — always visible, active highlighted.
 */

import React from "react";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { TapStats } from "../../types/tap-trading";

const ZOOM_PRESETS = [1.0, 1.5, 2.5];

type LeverageControlProps = {
  value: number;
  presets: number[];
  onChange: (leverage: number) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  stats?: TapStats | null;
  symbol: string;
};

export function LeverageControl({ value, presets, onChange, zoomLevel = 1.0, onZoomChange, stats, symbol }: LeverageControlProps) {
  const themeColors = useThemeColors();
  const borderColor = themeColors.border.subtle;

  return (
    <div style={{ ...toolbarStyle, borderBottom: `1px solid ${borderColor}` }}>
      <div style={leverageGroupStyle}>
        {presets.map((preset) => (
          <button
            key={preset}
            style={{
              ...pillStyle,
              border: `1px solid ${borderColor}`,
              ...(preset === value ? activePillStyle : {}),
            }}
            onClick={() => onChange(preset)}
          >
            {preset}x
          </button>
        ))}
        <div style={{ ...dividerStyle, background: borderColor }} />
        {ZOOM_PRESETS.map((z, i) => {
          const labels = ["S", "M", "L"];
          return (
            <button
              key={z}
              style={{
                ...pillStyle,
                border: `1px solid ${borderColor}`,
                ...(zoomLevel === z ? zoomActivePillStyle : {}),
              }}
              onClick={() => onZoomChange?.(z)}
            >
              {labels[i]}
            </button>
          );
        })}
      </div>

      <div style={statsGroupStyle}>
        {stats && stats.win_streak > 0 && (
          <span style={statStyle}>
            {stats.win_streak}
          </span>
        )}
        {stats && (
          <span style={{
            ...statStyle,
            color: stats.net_pnl >= 0 ? "#2FD575" : "#EF4444",
          }}>
            {stats.net_pnl >= 0 ? "+" : ""}${stats.net_pnl.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 16px",
  gap: 12,
};

const leverageGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
};

const pillStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  borderRadius: 6,
  padding: "4px 12px",
  color: "rgba(255, 255, 255, 0.45)",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
  cursor: "pointer",
  transition: "all 0.15s",
};

const activePillStyle: React.CSSProperties = {
  background: "rgba(47, 213, 117, 0.12)",
  border: "1px solid rgba(47, 213, 117, 0.25)",
  color: "#2FD575",
};

const zoomActivePillStyle: React.CSSProperties = {
  background: "rgba(147, 130, 255, 0.12)",
  border: "1px solid rgba(147, 130, 255, 0.3)",
  color: "#9382FF",
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 20,
  background: "rgba(255, 255, 255, 0.1)",
  margin: "0 4px",
};

const statsGroupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const statStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
  color: "rgba(255, 255, 255, 0.5)",
};
