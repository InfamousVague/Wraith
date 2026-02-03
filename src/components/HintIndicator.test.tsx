/**
 * HintIndicator Component Tests
 *
 * Tests the help tooltip indicator including:
 * - Icon rendering (inline and absolute positioned)
 * - Popup display on click
 * - Title and content display
 * - Dismiss functionality
 * - Active/viewed states
 * - Hint context integration
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "buttons.gotIt": "Got it",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Platform to return web
vi.mock("react-native", () => ({
  View: ({ children, style, pointerEvents }: { children?: React.ReactNode; style?: object; pointerEvents?: string }) => (
    <div data-testid="view" style={style}>{children}</div>
  ),
  StyleSheet: {
    create: (styles: object) => styles,
  },
  Platform: {
    OS: "web",
  },
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children, size, weight, style }: { children: React.ReactNode; size?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-size={size}>{children}</span>
  ),
  Icon: ({ name, color, size }: { name: string; color?: string; size?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    accent: { primary: "#a78bfa" },
    text: { primary: "#ffffff", muted: "#888888", secondary: "#cccccc" },
    background: { subtle: "#1a1a1a" },
  },
}));

// Mock HintContext
const mockRegisterHint = vi.fn();
const mockUnregisterHint = vi.fn();
const mockDismissHint = vi.fn();
let mockIsActive = true;
let mockIsViewed = false;

vi.mock("../context/HintContext", () => ({
  useHints: () => ({
    registerHint: mockRegisterHint,
    unregisterHint: mockUnregisterHint,
    dismissHint: mockDismissHint,
    isActive: () => mockIsActive,
    isViewed: () => mockIsViewed,
  }),
}));

import { HintIndicator } from "./HintIndicator";

describe("HintIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsActive = true;
    mockIsViewed = false;
    // Reset document head styles
    const existingStyle = document.getElementById("hint-ripple-animation");
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  describe("Hint Registration", () => {
    it("registers hint on mount", () => {
      render(<HintIndicator id="test-hint" title="Test Title" content="Test content" />);
      expect(mockRegisterHint).toHaveBeenCalledWith("test-hint", 100);
    });

    it("uses custom priority when provided", () => {
      render(<HintIndicator id="test-hint" title="Test" priority={50} />);
      expect(mockRegisterHint).toHaveBeenCalledWith("test-hint", 50);
    });

    it("unregisters hint on unmount", () => {
      const { unmount } = render(<HintIndicator id="test-hint" title="Test" />);
      unmount();
      expect(mockUnregisterHint).toHaveBeenCalledWith("test-hint");
    });
  });

  describe("Icon Rendering", () => {
    it("renders info icon by default", () => {
      render(<HintIndicator id="test" title="Test" />);
      expect(screen.getByText("i")).toBeInTheDocument();
    });

    it("renders custom icon when specified", () => {
      render(<HintIndicator id="test" title="Test" icon="?" />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("renders exclamation icon when specified", () => {
      render(<HintIndicator id="test" title="Test" icon="!" />);
      expect(screen.getByText("!")).toBeInTheDocument();
    });
  });

  describe("Popup Display", () => {
    it("shows popup when clicked", () => {
      render(<HintIndicator id="test" title="Test Title" content="Test content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("shows content in popup", () => {
      render(<HintIndicator id="test" title="Test" content="This is the hint content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      expect(screen.getByText("This is the hint content")).toBeInTheDocument();
    });

    it("renders children content when provided", () => {
      render(
        <HintIndicator id="test" title="Test">
          <div data-testid="custom-content">Custom child content</div>
        </HintIndicator>
      );

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
    });

    it("shows close icon in popup", () => {
      render(<HintIndicator id="test" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      expect(screen.getByTestId("icon-x")).toBeInTheDocument();
    });

    it("shows Got it button in footer", () => {
      render(<HintIndicator id="test" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      expect(screen.getByText("Got it")).toBeInTheDocument();
    });
  });

  describe("Dismiss Functionality", () => {
    it("calls dismissHint when Got it button clicked", () => {
      render(<HintIndicator id="test-dismiss" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      const gotItButton = screen.getByText("Got it");
      fireEvent.click(gotItButton.closest("div[style*='cursor']")!);

      expect(mockDismissHint).toHaveBeenCalledWith("test-dismiss");
    });

    it("calls dismissHint when close icon clicked", () => {
      render(<HintIndicator id="test-close" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      const closeIcon = screen.getByTestId("icon-x");
      fireEvent.click(closeIcon.closest("div[style*='cursor']")!);

      expect(mockDismissHint).toHaveBeenCalledWith("test-close");
    });

    it("closes popup when backdrop clicked", () => {
      render(<HintIndicator id="test-backdrop" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      // Find the backdrop - it has position: fixed and backdrop-filter styles
      // Use a more general selector since style serialization varies
      const allDivs = document.querySelectorAll("div");
      const backdrop = Array.from(allDivs).find(
        (div) => div.style.position === "fixed" && div.style.top === "0px"
      );
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      expect(mockDismissHint).toHaveBeenCalledWith("test-backdrop");
    });
  });

  describe("Active State", () => {
    it("shows ripple animation when active and not viewed", () => {
      mockIsActive = true;
      mockIsViewed = false;

      render(<HintIndicator id="test" title="Test" />);

      // Check for ripple ring class
      const rippleRing = document.querySelector(".hint-ripple-ring");
      expect(rippleRing).toBeInTheDocument();
    });

    it("does not show ripple when viewed", () => {
      mockIsActive = true;
      mockIsViewed = true;

      render(<HintIndicator id="test" title="Test" />);

      const rippleRing = document.querySelector(".hint-ripple-ring");
      expect(rippleRing).not.toBeInTheDocument();
    });

    it("does not show ripple when not active", () => {
      mockIsActive = false;
      mockIsViewed = false;

      render(<HintIndicator id="test" title="Test" />);

      const rippleRing = document.querySelector(".hint-ripple-ring");
      expect(rippleRing).not.toBeInTheDocument();
    });
  });

  describe("Viewed State", () => {
    it("uses gray color when viewed", () => {
      mockIsViewed = true;

      render(<HintIndicator id="test" title="Test" />);

      // The indicator should use gray (#6B7280) when viewed
      // This is reflected in the opacity of 0.6
      const indicator = screen.getByText("i").closest("div[style*='opacity']");
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("Inline Mode", () => {
    it("renders inline when inline prop is true", () => {
      render(<HintIndicator id="test" title="Test" inline />);

      const clickableDiv = screen.getByText("i").closest("div[style*='inline-flex']");
      expect(clickableDiv).toBeInTheDocument();
    });

    it("renders absolute positioned when inline is false", () => {
      render(<HintIndicator id="test" title="Test" inline={false} />);

      const clickableDiv = screen.getByText("i").closest("div[style*='absolute']");
      expect(clickableDiv).toBeInTheDocument();
    });
  });

  describe("Custom Width", () => {
    it("uses default width of 320px", () => {
      render(<HintIndicator id="test" title="Test" content="Content" />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      // The popup should have width: 320
      const popup = document.querySelector('div[style*="width: 320"]');
      expect(popup).toBeInTheDocument();
    });

    it("uses custom width when provided", () => {
      render(<HintIndicator id="test" title="Test" content="Content" width={400} />);

      const icon = screen.getByText("i");
      fireEvent.click(icon.closest("div[style*='cursor']")!);

      const popup = document.querySelector('div[style*="width: 400"]');
      expect(popup).toBeInTheDocument();
    });
  });

  describe("CSS Animation Injection", () => {
    it("injects ripple animation styles", () => {
      render(<HintIndicator id="test" title="Test" />);

      const styleElement = document.getElementById("hint-ripple-animation");
      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.textContent).toContain("@keyframes hint-ripple");
    });

    it("does not duplicate style injection", () => {
      render(<HintIndicator id="test1" title="Test 1" />);
      render(<HintIndicator id="test2" title="Test 2" />);

      const styleElements = document.querySelectorAll("#hint-ripple-animation");
      expect(styleElements.length).toBe(1);
    });
  });
});
