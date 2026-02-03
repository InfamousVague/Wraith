/**
 * @file CountdownTimer.test.tsx
 * @description Tests for the CountdownTimer component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { CountdownTimer } from "./CountdownTimer";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "countdown.ready": "Ready",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock tokens
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    data: { blue: "#3b82f6" },
    status: { success: "#22c55e" },
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, weight, style }: { children: React.ReactNode; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-size={size} data-weight={weight} style={style}>{children}</span>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { TwoXSmall: "2xs" },
}));

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders label", () => {
      const targetTime = Date.now() + 60000; // 1 minute from now
      render(<CountdownTimer targetTime={targetTime} label="5m" />);
      expect(screen.getByText("5m")).toBeInTheDocument();
    });

    it("renders remaining time", () => {
      const targetTime = Date.now() + 65000; // 65 seconds from now
      render(<CountdownTimer targetTime={targetTime} label="5m" />);
      expect(screen.getByText("1:05")).toBeInTheDocument();
    });
  });

  describe("Time Formatting", () => {
    it("formats minutes and seconds", () => {
      const targetTime = Date.now() + 125000; // 2:05
      render(<CountdownTimer targetTime={targetTime} label="test" />);
      expect(screen.getByText("2:05")).toBeInTheDocument();
    });

    it("formats hours and minutes for long countdowns", () => {
      const targetTime = Date.now() + 3700000; // 1h 1m 40s
      render(<CountdownTimer targetTime={targetTime} label="test" />);
      expect(screen.getByText("1h 1m")).toBeInTheDocument();
    });

    it("formats seconds only when under a minute", () => {
      const targetTime = Date.now() + 45000; // 45 seconds
      render(<CountdownTimer targetTime={targetTime} label="test" />);
      expect(screen.getByText("0:45")).toBeInTheDocument();
    });

    it("shows 0:00 when time is up", () => {
      const targetTime = Date.now() - 1000; // Already passed
      render(<CountdownTimer targetTime={targetTime} label="test" />);
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });
  });

  describe("Countdown Updates", () => {
    it("updates countdown every second", () => {
      const targetTime = Date.now() + 5000; // 5 seconds
      render(<CountdownTimer targetTime={targetTime} label="test" />);

      expect(screen.getByText("0:05")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("0:04")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("0:03")).toBeInTheDocument();
    });
  });

  describe("Completion", () => {
    it("shows Ready text when complete", () => {
      const targetTime = Date.now() + 1000;
      render(<CountdownTimer targetTime={targetTime} label="test" />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("calls onComplete when countdown finishes", () => {
      const onComplete = vi.fn();
      const targetTime = Date.now() + 1000;
      render(<CountdownTimer targetTime={targetTime} label="test" onComplete={onComplete} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("clears interval on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const targetTime = Date.now() + 60000;
      const { unmount } = render(<CountdownTimer targetTime={targetTime} label="test" />);

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("Color Styling", () => {
    it("uses activeColor while counting", () => {
      const targetTime = Date.now() + 60000;
      render(<CountdownTimer targetTime={targetTime} label="test" activeColor="#ff0000" />);
      const texts = screen.getAllByTestId("text");
      // Both label and time should have the active color
      expect(texts[0]).toHaveStyle({ color: "#ff0000" });
    });

    it("uses default blue color when no activeColor provided", () => {
      const targetTime = Date.now() + 60000;
      render(<CountdownTimer targetTime={targetTime} label="test" />);
      const texts = screen.getAllByTestId("text");
      expect(texts[0]).toHaveStyle({ color: "#3b82f6" });
    });
  });
});
