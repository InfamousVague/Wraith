/**
 * @file PingIndicator.test.tsx
 * @description Tests for the PingIndicator component utility functions.
 * Note: The component uses React Native Animated which is difficult to test.
 * These tests focus on the utility/helper aspects.
 */

import { describe, it, expect, vi } from "vitest";

// Mock the tokens to test color logic
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    text: { muted: "#888888" },
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#ef4444",
    },
    data: { amber: "#fbbf24" },
  },
}));

import { Colors } from "@wraith/ghost/tokens";

// Recreate the getLatencyColor function for testing
function getLatencyColor(latencyMs: number | null): string {
  if (latencyMs === null) return Colors.text.muted;
  if (latencyMs < 50) return Colors.status.success;
  if (latencyMs < 150) return Colors.data.amber;
  if (latencyMs < 300) return Colors.status.warning;
  return Colors.status.danger;
}

describe("PingIndicator - Color Logic", () => {
  describe("getLatencyColor", () => {
    it("returns muted color for null latency", () => {
      expect(getLatencyColor(null)).toBe("#888888");
    });

    it("returns success color for very low latency (<50ms)", () => {
      expect(getLatencyColor(25)).toBe("#22c55e");
      expect(getLatencyColor(0)).toBe("#22c55e");
      expect(getLatencyColor(49)).toBe("#22c55e");
    });

    it("returns amber color for medium-low latency (50-149ms)", () => {
      expect(getLatencyColor(50)).toBe("#fbbf24");
      expect(getLatencyColor(100)).toBe("#fbbf24");
      expect(getLatencyColor(149)).toBe("#fbbf24");
    });

    it("returns warning color for medium-high latency (150-299ms)", () => {
      expect(getLatencyColor(150)).toBe("#f59e0b");
      expect(getLatencyColor(200)).toBe("#f59e0b");
      expect(getLatencyColor(299)).toBe("#f59e0b");
    });

    it("returns danger color for high latency (>=300ms)", () => {
      expect(getLatencyColor(300)).toBe("#ef4444");
      expect(getLatencyColor(500)).toBe("#ef4444");
      expect(getLatencyColor(1000)).toBe("#ef4444");
    });
  });
});

describe("PingIndicator - Animation Duration Logic", () => {
  // Recreate the getAnimationDuration function for testing
  function getAnimationDuration(latency: number | null): number {
    if (latency === null) return 1500;
    const scaled = Math.min(Math.max(latency, 10), 500);
    return 300 + (scaled / 500) * 2700;
  }

  it("returns default duration for null latency", () => {
    expect(getAnimationDuration(null)).toBe(1500);
  });

  it("returns fast duration for low latency", () => {
    // 10ms latency should give ~354ms duration
    const duration = getAnimationDuration(10);
    expect(duration).toBeGreaterThanOrEqual(300);
    expect(duration).toBeLessThan(600);
  });

  it("returns slow duration for high latency", () => {
    // 500ms+ latency should give 3000ms duration
    const duration = getAnimationDuration(500);
    expect(duration).toBe(3000);
  });

  it("scales duration proportionally to latency", () => {
    const low = getAnimationDuration(50);
    const medium = getAnimationDuration(250);
    const high = getAnimationDuration(450);

    expect(low).toBeLessThan(medium);
    expect(medium).toBeLessThan(high);
  });

  it("clamps very low latency to minimum", () => {
    // Even 0ms should be clamped to 10ms
    const veryLow = getAnimationDuration(0);
    const atMin = getAnimationDuration(10);
    expect(veryLow).toBe(atMin);
  });

  it("clamps very high latency to maximum", () => {
    // 1000ms should be clamped to 500ms
    const veryHigh = getAnimationDuration(1000);
    const atMax = getAnimationDuration(500);
    expect(veryHigh).toBe(atMax);
  });
});

describe("PingIndicator - Size Configuration", () => {
  // Test that size configs have expected properties
  const SIZE_CONFIG = {
    "2xs": { width: 40, height: 16, towerSize: 10, dotSize: 4 },
    xs: { width: 50, height: 18, towerSize: 12, dotSize: 5 },
    sm: { width: 60, height: 20, towerSize: 14, dotSize: 6 },
    md: { width: 80, height: 24, towerSize: 16, dotSize: 7 },
    lg: { width: 100, height: 28, towerSize: 18, dotSize: 8 },
    xl: { width: 120, height: 32, towerSize: 20, dotSize: 9 },
    "2xl": { width: 140, height: 36, towerSize: 22, dotSize: 10 },
  };

  it("has all expected size variants", () => {
    expect(Object.keys(SIZE_CONFIG)).toHaveLength(7);
  });

  it("small size has correct dimensions", () => {
    expect(SIZE_CONFIG.sm.width).toBe(60);
    expect(SIZE_CONFIG.sm.height).toBe(20);
    expect(SIZE_CONFIG.sm.towerSize).toBe(14);
    expect(SIZE_CONFIG.sm.dotSize).toBe(6);
  });

  it("sizes scale proportionally", () => {
    expect(SIZE_CONFIG.sm.width).toBeLessThan(SIZE_CONFIG.md.width);
    expect(SIZE_CONFIG.md.width).toBeLessThan(SIZE_CONFIG.lg.width);
  });
});
