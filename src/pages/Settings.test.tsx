/**
 * Settings Page Tests
 *
 * Tests for the Settings page, particularly focusing on the
 * private key reveal functionality that has been crashing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Settings } from "./Settings";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import React from "react";

// Mock the theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888", secondary: "#aaa" },
    background: { raised: "#1a1a1a", surface: "#0a0a0a", overlay: "#2a2a2a" },
    border: { subtle: "#333" },
    accent: { primary: "#3B82F6", secondary: "#1E40AF" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Card: ({ children, style, loading }: { children: React.ReactNode; style?: object; loading?: boolean }) => (
    <div data-testid="card" style={style}>{loading ? "Loading..." : children}</div>
  ),
  Text: ({ children, size, weight, appearance, style, numberOfLines }: {
    children: React.ReactNode;
    size?: string;
    weight?: string;
    appearance?: string;
    style?: object;
    numberOfLines?: number;
  }) => (
    <span data-testid="text" data-appearance={appearance} style={style}>{children}</span>
  ),
  Button: ({ label, onPress, disabled, size, shape, appearance, leadingIcon, style }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    size?: string;
    shape?: string;
    appearance?: string;
    leadingIcon?: string;
    style?: object;
  }) => (
    <button
      data-testid={`button-${label.replace(/\s+/g, "-").toLowerCase()}`}
      onClick={onPress}
      disabled={disabled}
    >
      {label}
    </button>
  ),
  Input: ({ value, onChangeText, placeholder, size, shape, style }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    size?: string;
    shape?: string;
    style?: object;
  }) => (
    <input
      data-testid="input"
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
    />
  ),
  Icon: ({ name, size, color }: { name: string; size?: string; color?: string }) => (
    <span data-testid={`icon-${name}`} style={{ color }} />
  ),
  Skeleton: ({ width, height }: { width: number | string; height: number }) => (
    <div data-testid="skeleton" style={{ width, height }} />
  ),
}));

// Mock Ghost enums
vi.mock("@wraith/ghost/enums", () => ({
  Size: {
    TwoXSmall: "2xs",
    ExtraSmall: "xs",
    Small: "sm",
    Medium: "md",
    Large: "lg",
    ExtraLarge: "xl",
    TwoXLarge: "2xl",
  },
  TextAppearance: {
    Primary: "primary",
    Secondary: "secondary",
    Muted: "muted",
    Danger: "danger",
  },
  Shape: {
    Rounded: "rounded",
    Square: "square",
  },
  Appearance: {
    Primary: "primary",
    Secondary: "secondary",
  },
}));

// Mock Navbar
vi.mock("../components/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

// Wrapper component with all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("Settings Page", () => {
  beforeEach(() => {
    // Clear localStorage between tests
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Unauthenticated state", () => {
    it("renders without crashing when not authenticated", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("No Account Connected")).toBeInTheDocument();
    });

    it("shows create account and import options", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      expect(screen.getByText("Create New Account")).toBeInTheDocument();
      expect(
        screen.getByText("Or import existing private key")
      ).toBeInTheDocument();
    });
  });

  describe("Account Creation", () => {
    it("creates account when button is clicked", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      const createButton = screen.getByText("Create New Account");
      fireEvent.click(createButton);

      // Wait for account creation
      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Should show public key section
      expect(screen.getByText("Public Key (Wallet Address)")).toBeInTheDocument();
    });
  });

  describe("Private Key Reveal", () => {
    it("handles long private key strings without crashing", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Click create account
      const createButton = screen.getByText("Create New Account");
      fireEvent.click(createButton);

      // Wait for account creation
      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Find and click reveal button
      const revealButton = screen.getByText("Reveal Private Key");
      expect(revealButton).toBeInTheDocument();

      // This should not crash - the main test!
      fireEvent.click(revealButton);

      // Wait for private key to be displayed - reveal button should be gone
      await waitFor(() => {
        expect(screen.queryByText("Reveal Private Key")).not.toBeInTheDocument();
      });

      // The hide button (eye-off icon) should be visible
      expect(screen.getByTestId("icon-eye-off")).toBeInTheDocument();
    });

    it("can hide private key after revealing", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Create account
      fireEvent.click(screen.getByText("Create New Account"));

      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Reveal private key
      fireEvent.click(screen.getByText("Reveal Private Key"));

      await waitFor(() => {
        expect(screen.queryByText("Reveal Private Key")).not.toBeInTheDocument();
      });

      // Find and click the hide button (eye-off icon's parent Pressable)
      const hideIcon = screen.getByTestId("icon-eye-off");
      const hideButton = hideIcon.closest("div");
      if (hideButton) {
        fireEvent.click(hideButton);
      }

      // Reveal button should come back
      await waitFor(() => {
        expect(screen.getByText("Reveal Private Key")).toBeInTheDocument();
      });
    });

    it("displays private key text when revealed", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Create account
      fireEvent.click(screen.getByText("Create New Account"));

      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Reveal private key
      fireEvent.click(screen.getByText("Reveal Private Key"));

      await waitFor(() => {
        expect(screen.queryByText("Reveal Private Key")).not.toBeInTheDocument();
      });

      // There should be a text element containing the hex key (64 chars)
      const allTexts = screen.getAllByTestId("text");
      const keyText = allTexts.find((el) => {
        const content = el.textContent || "";
        return /^[0-9a-f]{64}$/i.test(content);
      });
      expect(keyText).toBeDefined();
    });
  });

  describe("Copy and Download", () => {
    it("copy button works without crashing", async () => {
      // Mock clipboard
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Create account
      fireEvent.click(screen.getByText("Create New Account"));

      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click copy button
      const copyButton = screen.getByText("Copy");
      fireEvent.click(copyButton);

      // Button should change to "Copied!"
      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });

      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  describe("Logout", () => {
    it("logout button is visible when authenticated", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Create account
      fireEvent.click(screen.getByText("Create New Account"));

      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Logout text should be present (next to power icon)
      expect(screen.getByText("Logout")).toBeInTheDocument();
      expect(screen.getByTestId("icon-power")).toBeInTheDocument();
    });

    it("logout removes account", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Create account
      fireEvent.click(screen.getByText("Create New Account"));

      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click the logout icon (find parent of power icon)
      const powerIcon = screen.getByTestId("icon-power");
      const logoutButton = powerIcon.closest("div");
      if (logoutButton) {
        fireEvent.click(logoutButton);
      }

      // Should show no account state again
      await waitFor(() => {
        expect(screen.getByText("No Account Connected")).toBeInTheDocument();
      });
    });
  });

  describe("Import Private Key", () => {
    it("shows error for invalid key format", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Enter invalid key
      const input = screen.getByTestId("input");
      fireEvent.change(input, { target: { value: "not-a-valid-key" } });

      // Click import button
      const importButton = screen.getByText("Import Private Key");
      fireEvent.click(importButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Invalid private key format/i)).toBeInTheDocument();
      });
    });

    it("imports valid 64-char hex key", async () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Enter valid key (64 hex chars)
      const validKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const input = screen.getByTestId("input");
      fireEvent.change(input, { target: { value: validKey } });

      // Click import button
      const importButton = screen.getByText("Import Private Key");
      fireEvent.click(importButton);

      // Should switch to authenticated state
      await waitFor(
        () => {
          expect(screen.queryByText("No Account Connected")).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Edge cases", () => {
    it("handles undefined private key gracefully", () => {
      render(
        <TestWrapper>
          <Settings />
        </TestWrapper>
      );

      // Without creating an account, there's no key to reveal
      expect(screen.getByText("No Account Connected")).toBeInTheDocument();
    });
  });
});
