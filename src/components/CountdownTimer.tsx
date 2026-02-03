/**
 * @file CountdownTimer.tsx
 * @description Real-time countdown display for prediction validation times.
 *
 * ## Features:
 * - Updates every second for accurate countdown
 * - Formats time as "Xh Xm" or "X:SS" based on remaining
 * - Color-coded: active color while counting, success when complete
 * - Fires onComplete callback when countdown reaches zero
 *
 * ## Props:
 * - `targetTime`: Target timestamp in ms
 * - `label`: Display label (e.g., "5m", "1h")
 * - `activeColor`: Color while counting (default: blue)
 * - `onComplete`: Callback when countdown finishes
 *
 * ## Helper Functions:
 * - `formatRemaining(ms)`: Formats ms to human-readable string
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@wraith/ghost/components";
import { Size } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

type CountdownTimerProps = {
  /** Target timestamp in milliseconds when the prediction will be validated */
  targetTime: number;
  /** Label to display (e.g., "5m", "1h", "4h") */
  label: string;
  /** Color when countdown is active (default: blue) */
  activeColor?: string;
  /** Callback when countdown completes */
  onComplete?: () => void;
};

/**
 * Format remaining milliseconds into human-readable string.
 */
function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";

  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}`;
  return `0:${secs.toString().padStart(2, "0")}`;
}

export function CountdownTimer({
  targetTime,
  label,
  activeColor = Colors.data.blue,
  onComplete,
}: CountdownTimerProps) {
  const { t } = useTranslation("components");
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    // Update remaining time immediately
    setRemaining(targetTime - Date.now());

    const interval = setInterval(() => {
      const r = targetTime - Date.now();
      setRemaining(r);

      if (r <= 0) {
        clearInterval(interval);
        handleComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, handleComplete]);

  const isComplete = remaining <= 0;

  return (
    <View style={styles.container}>
      <Text
        size={Size.TwoXSmall}
        weight="semibold"
        style={{ color: isComplete ? Colors.status.success : activeColor }}
      >
        {label}
      </Text>
      <Text
        size={Size.TwoXSmall}
        style={{ color: isComplete ? Colors.status.success : activeColor }}
      >
        {isComplete ? t("countdown.ready") : formatRemaining(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    minWidth: 48,
  },
});
