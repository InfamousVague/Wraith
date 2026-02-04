/**
 * LoginProgress Component Tests
 *
 * Tests the login progress stepper including:
 * - Step rendering
 * - Completed/current/pending states
 * - Success and error states
 * - Icon display
 * - Error messages
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "loginSteps.requestingChallenge": "Requesting challenge",
        "loginSteps.signing": "Signing message",
        "loginSteps.verifying": "Verifying signature",
        "loginSteps.loadingProfile": "Loading profile",
        "loginSteps.success": "Login successful",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme colors
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#ffffff", muted: "#888888" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, appearance, weight, style }: { children: React.ReactNode; appearance?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight} style={style}>{children}</span>
  ),
  Icon: ({ name, color }: { name: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      success: "#2fd575",
      danger: "#ff5c7a",
    },
  },
}));

// Mock react-native ActivityIndicator
vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native");
  return {
    ...actual,
    ActivityIndicator: ({ size, color }: { size?: string; color?: string }) => (
      <div data-testid="activity-indicator" data-size={size} data-color={color} />
    ),
  };
});

import { LoginProgress } from "./LoginProgress";

describe("LoginProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Idle State", () => {
    it("returns null when idle", () => {
      const { container } = render(<LoginProgress currentStep="idle" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Step Rendering", () => {
    it("renders all step labels", () => {
      render(<LoginProgress currentStep="requesting_challenge" />);
      expect(screen.getByText("Requesting challenge")).toBeInTheDocument();
      expect(screen.getByText("Signing message")).toBeInTheDocument();
      expect(screen.getByText("Verifying signature")).toBeInTheDocument();
      expect(screen.getByText("Loading profile")).toBeInTheDocument();
    });
  });

  describe("Step States", () => {
    it("shows spinner on current step", () => {
      render(<LoginProgress currentStep="signing" />);
      expect(screen.getByTestId("activity-indicator")).toBeInTheDocument();
    });

    it("shows check-circle for completed steps", () => {
      render(<LoginProgress currentStep="verifying" />);
      // requesting_challenge and signing are completed
      const checkIcons = screen.getAllByTestId("icon-check-circle");
      expect(checkIcons.length).toBe(2);
    });

    it("shows current step with medium weight", () => {
      render(<LoginProgress currentStep="signing" />);
      const signingText = screen.getByText("Signing message");
      expect(signingText).toHaveAttribute("data-weight", "medium");
    });

    it("shows pending steps with muted appearance", () => {
      render(<LoginProgress currentStep="requesting_challenge" />);
      const verifyingText = screen.getByText("Verifying signature");
      expect(verifyingText).toHaveAttribute("data-appearance", "muted");
    });
  });

  describe("Success State", () => {
    it("shows success message when complete", () => {
      render(<LoginProgress currentStep="success" />);
      expect(screen.getByText("Login successful")).toBeInTheDocument();
    });

    it("shows all check-circle icons when success", () => {
      render(<LoginProgress currentStep="success" />);
      // All 4 steps + success row = 5 check icons
      const checkIcons = screen.getAllByTestId("icon-check-circle");
      expect(checkIcons.length).toBe(5);
    });
  });

  describe("Error State", () => {
    it("shows error message when present", () => {
      render(<LoginProgress currentStep="error" error="Authentication failed" />);
      expect(screen.getByText("Authentication failed")).toBeInTheDocument();
    });

    it("shows error with danger appearance", () => {
      render(<LoginProgress currentStep="error" error="Auth failed" />);
      const errorText = screen.getByText("Auth failed");
      expect(errorText).toHaveAttribute("data-appearance", "danger");
    });

    it("still renders step labels on error", () => {
      render(<LoginProgress currentStep="error" error="Failed" />);
      expect(screen.getByText("Requesting challenge")).toBeInTheDocument();
    });
  });

  describe("Progress Through Steps", () => {
    it("at requesting_challenge, only that step is current", () => {
      render(<LoginProgress currentStep="requesting_challenge" />);
      expect(screen.getByTestId("activity-indicator")).toBeInTheDocument();
      expect(screen.queryAllByTestId("icon-check-circle").length).toBe(0);
    });

    it("at signing, requesting_challenge is completed", () => {
      render(<LoginProgress currentStep="signing" />);
      expect(screen.getAllByTestId("icon-check-circle").length).toBe(1);
      expect(screen.getByTestId("activity-indicator")).toBeInTheDocument();
    });

    it("at verifying, two steps are completed", () => {
      render(<LoginProgress currentStep="verifying" />);
      expect(screen.getAllByTestId("icon-check-circle").length).toBe(2);
    });

    it("at loading_profile, three steps are completed", () => {
      render(<LoginProgress currentStep="loading_profile" />);
      expect(screen.getAllByTestId("icon-check-circle").length).toBe(3);
    });
  });
});
