/**
 * @file BalancePill.tsx
 * @description Bottom-left balance display. Shows portfolio cash balance.
 * Flashes green on win, red on loss.
 */

import React, { useState, useEffect, useRef } from "react";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";

type BalancePillProps = {
  balance: number;
};

export function BalancePill({ balance }: BalancePillProps) {
  const themeColors = useThemeColors();
  const borderColor = themeColors.border.subtle;
  const [flash, setFlash] = useState<"none" | "win" | "loss">("none");
  const prevBalanceRef = useRef(balance);

  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      const diff = balance - prevBalanceRef.current;
      if (diff > 0.01) {
        setFlash("win");
      } else if (diff < -0.01) {
        setFlash("loss");
      }
      prevBalanceRef.current = balance;

      const timer = setTimeout(() => setFlash("none"), 600);
      return () => clearTimeout(timer);
    }
  }, [balance]);

  const flashColor =
    flash === "win"
      ? "rgba(47, 213, 117, 0.3)"
      : flash === "loss"
      ? "rgba(239, 68, 68, 0.3)"
      : "transparent";

  return (
    <div style={{ ...pillStyle, border: `1px solid ${borderColor}`, boxShadow: `0 0 12px ${flashColor}` }}>
      <span style={iconStyle}>💰</span>
      <span style={amountStyle}>
        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  background: "rgba(255, 255, 255, 0.06)",
  borderRadius: 20,
  transition: "box-shadow 0.3s",
  pointerEvents: "auto",
};

const iconStyle: React.CSSProperties = {
  fontSize: 13,
};

const amountStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "-apple-system, system-ui, sans-serif",
};
