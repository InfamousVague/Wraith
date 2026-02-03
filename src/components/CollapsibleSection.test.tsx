/**
 * @file CollapsibleSection.test.tsx
 * @description Tests for the CollapsibleSection component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CollapsibleSection } from "./CollapsibleSection";

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", secondary: "#aaa" },
    border: { subtle: "#333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Medium: "md" },
}));

describe("CollapsibleSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders title", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });

    it("renders chevron icon", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      // Default is open, so chevron-up
      expect(screen.getByTestId("icon-chevron-up")).toBeInTheDocument();
    });
  });

  describe("Default State", () => {
    it("is open by default", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("can be closed by default with defaultOpen=false", () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      );
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("shows chevron-down when closed", () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div>Content</div>
        </CollapsibleSection>
      );
      expect(screen.getByTestId("icon-chevron-down")).toBeInTheDocument();
    });
  });

  describe("Toggle Behavior", () => {
    it("collapses content when header is clicked", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText("Test Section"));

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("expands content when header is clicked again", () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      );

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText("Test Section"));

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("toggles icon when state changes", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );

      // Initially open
      expect(screen.getByTestId("icon-chevron-up")).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText("Test Section"));

      // Now should show down icon
      expect(screen.getByTestId("icon-chevron-down")).toBeInTheDocument();
    });
  });

  describe("Children", () => {
    it("renders complex children when open", () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </CollapsibleSection>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });
  });
});
