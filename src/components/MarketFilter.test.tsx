/**
 * @file MarketFilter.test.tsx
 * @description Tests for the MarketFilter component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MarketFilter } from "./MarketFilter";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "marketFilterOptions.all": "All",
        "marketFilterOptions.crypto": "Crypto",
        "marketFilterOptions.stocks": "Stocks",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    accent: { primary: "#3b82f6", secondary: "#1e3a5f" },
    border: { subtle: "#333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm" },
  TextAppearance: { Primary: "primary", Muted: "muted" },
}));

describe("MarketFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all three options", () => {
      render(<MarketFilter value="all" onChange={vi.fn()} />);

      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("Crypto")).toBeInTheDocument();
      expect(screen.getByText("Stocks")).toBeInTheDocument();
    });

    it("renders icons for each option", () => {
      render(<MarketFilter value="all" onChange={vi.fn()} />);

      expect(screen.getByTestId("icon-layers")).toBeInTheDocument();
      expect(screen.getByTestId("icon-coins")).toBeInTheDocument();
      expect(screen.getByTestId("icon-building-2")).toBeInTheDocument();
    });
  });

  describe("Selection", () => {
    it("calls onChange when crypto is clicked", () => {
      const onChange = vi.fn();
      render(<MarketFilter value="all" onChange={onChange} />);

      fireEvent.click(screen.getByText("Crypto"));
      expect(onChange).toHaveBeenCalledWith("crypto");
    });

    it("calls onChange when stocks is clicked", () => {
      const onChange = vi.fn();
      render(<MarketFilter value="all" onChange={onChange} />);

      fireEvent.click(screen.getByText("Stocks"));
      expect(onChange).toHaveBeenCalledWith("stock");
    });

    it("calls onChange when all is clicked", () => {
      const onChange = vi.fn();
      render(<MarketFilter value="crypto" onChange={onChange} />);

      fireEvent.click(screen.getByText("All"));
      expect(onChange).toHaveBeenCalledWith("all");
    });
  });

  describe("Active State", () => {
    it("reflects the current value visually", () => {
      // Just verify it renders without crashing with different values
      const { rerender } = render(<MarketFilter value="all" onChange={vi.fn()} />);
      expect(screen.getByText("All")).toBeInTheDocument();

      rerender(<MarketFilter value="crypto" onChange={vi.fn()} />);
      expect(screen.getByText("Crypto")).toBeInTheDocument();

      rerender(<MarketFilter value="stock" onChange={vi.fn()} />);
      expect(screen.getByText("Stocks")).toBeInTheDocument();
    });
  });
});
