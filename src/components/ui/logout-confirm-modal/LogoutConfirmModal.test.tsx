/**
 * LogoutConfirmModal Component Tests
 *
 * Tests the logout confirmation modal including:
 * - Modal visibility
 * - Warning display
 * - Key backup state
 * - Action buttons
 * - Callbacks
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "auth:logout.title": "Log Out",
        "auth:logout.message": "Are you sure you want to log out?",
        "auth:logout.keyBackupConfirmed": "Your key has been backed up",
        "auth:logout.backUpWarning": "Your key is not backed up!",
        "auth:logout.loseAccessWarning": "You may lose access to your account",
        "common:buttons.backUpKey": "Back Up Key",
        "common:buttons.cancel": "Cancel",
        "common:buttons.logOut": "Log Out",
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
  Card: ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <div data-testid="card">{children}</div>
  ),
  Text: ({ children, appearance, weight, style }: { children: React.ReactNode; appearance?: string; weight?: string; style?: object }) => (
    <span data-testid="text" data-appearance={appearance} data-weight={weight}>{children}</span>
  ),
  Icon: ({ name, color }: { name: string; color?: string }) => (
    <span data-testid={`icon-${name}`} data-color={color} />
  ),
  Button: ({ label, onPress, leadingIcon }: { label: string; onPress: () => void; leadingIcon?: string }) => (
    <button data-testid={`button-${label.replace(/\s+/g, "-").toLowerCase()}`} onClick={onPress} data-icon={leadingIcon}>
      {label}
    </button>
  ),
}));

// Mock Colors
vi.mock("@wraith/ghost/tokens", () => ({
  Colors: {
    status: {
      danger: "#ff5c7a",
      dangerSurface: "#ff5c7a20",
      success: "#2fd575",
      successSurface: "#2fd57520",
    },
  },
}));

import { LogoutConfirmModal } from "./LogoutConfirmModal";

describe("LogoutConfirmModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnBackupKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("renders when visible is true", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("does not render when visible is false", () => {
      render(
        <LogoutConfirmModal
          visible={false}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.queryByTestId("card")).not.toBeInTheDocument();
    });
  });

  describe("Content Display", () => {
    it("renders title", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      // "Log Out" appears as both title and button label
      expect(screen.getAllByText("Log Out").length).toBeGreaterThan(0);
    });

    it("renders warning message", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByText("Are you sure you want to log out?")).toBeInTheDocument();
    });

    it("renders warning triangle icon", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("icon-alert-triangle")).toBeInTheDocument();
    });
  });

  describe("Key Not Backed Up State", () => {
    it("shows backup warning", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByText("Your key is not backed up!")).toBeInTheDocument();
    });

    it("shows lose access warning", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByText("You may lose access to your account")).toBeInTheDocument();
    });

    it("shows alert-circle icon", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
    });

    it("shows backup button", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("button-back-up-key")).toBeInTheDocument();
    });
  });

  describe("Key Backed Up State", () => {
    it("shows confirmation message", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByText("Your key has been backed up")).toBeInTheDocument();
    });

    it("shows check-circle icon", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("icon-check-circle")).toBeInTheDocument();
    });

    it("hides backup button", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.queryByTestId("button-back-up-key")).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("renders cancel button", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("button-cancel")).toBeInTheDocument();
    });

    it("renders log out button", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      expect(screen.getByTestId("button-log-out")).toBeInTheDocument();
    });

    it("calls onCancel when cancel clicked", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      fireEvent.click(screen.getByTestId("button-cancel"));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("calls onConfirm when log out clicked", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      fireEvent.click(screen.getByTestId("button-log-out"));
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it("calls onBackupKey when backup button clicked", () => {
      render(
        <LogoutConfirmModal
          visible={true}
          hasBackedUpKey={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onBackupKey={mockOnBackupKey}
        />
      );
      fireEvent.click(screen.getByTestId("button-back-up-key"));
      expect(mockOnBackupKey).toHaveBeenCalled();
    });
  });
});
