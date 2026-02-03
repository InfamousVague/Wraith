/**
 * @file useBreakpoint.test.ts
 * @description Tests for the useBreakpoint hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBreakpoint, BREAKPOINTS } from "./useBreakpoint";

// Mock react-native useWindowDimensions
vi.mock("react-native", () => ({
  useWindowDimensions: vi.fn(() => ({ width: 1024, height: 768 })),
}));

import { useWindowDimensions } from "react-native";
const mockUseWindowDimensions = vi.mocked(useWindowDimensions);

describe("useBreakpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BREAKPOINTS", () => {
    it("exports correct breakpoint values", () => {
      expect(BREAKPOINTS.phone).toBe(480);
      expect(BREAKPOINTS.tablet).toBe(768);
      expect(BREAKPOINTS.desktop).toBe(1024);
      expect(BREAKPOINTS.wide).toBe(1280);
    });
  });

  describe("breakpoint detection", () => {
    it("returns phone for width <= 480", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 375, height: 667, scale: 1, fontScale: 1 });
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("phone");
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isNarrow).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it("returns tablet for width 481-768", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 600, height: 800, scale: 1, fontScale: 1 });
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("tablet");
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isNarrow).toBe(true);
    });

    it("returns desktop for width 769-1024", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("desktop");
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isNarrow).toBe(false);
    });

    it("returns wide for width > 1024", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.breakpoint).toBe("wide");
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe("dimensions", () => {
    it("returns width and height", () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1920, height: 1080, scale: 1, fontScale: 1 });
      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.width).toBe(1920);
      expect(result.current.height).toBe(1080);
    });
  });

  describe("edge cases", () => {
    it("handles exact breakpoint boundaries", () => {
      // Exactly at phone breakpoint
      mockUseWindowDimensions.mockReturnValue({ width: 480, height: 640, scale: 1, fontScale: 1 });
      const { result: phoneResult } = renderHook(() => useBreakpoint());
      expect(phoneResult.current.breakpoint).toBe("phone");

      // Exactly at tablet breakpoint
      mockUseWindowDimensions.mockReturnValue({ width: 768, height: 1024, scale: 1, fontScale: 1 });
      const { result: tabletResult } = renderHook(() => useBreakpoint());
      expect(tabletResult.current.breakpoint).toBe("tablet");
    });
  });
});
