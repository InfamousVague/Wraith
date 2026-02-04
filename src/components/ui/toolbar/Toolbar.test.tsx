/**
 * @file Toolbar.test.tsx
 * @description Tests for the Toolbar component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Toolbar, type ViewMode, type FilterState } from "./Toolbar";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "toolbar.viewOptions.list": "List",
        "toolbar.viewOptions.charts": "Charts",
        "toolbar.sortOptions.marketCap": "Market Cap",
        "toolbar.sortOptions.price": "Price",
        "toolbar.sortOptions.volume24h": "Volume",
        "toolbar.sortOptions.change1h": "1h %",
        "toolbar.sortOptions.change24h": "24h %",
        "toolbar.sortOptions.change7d": "7d %",
        "toolbar.sortOptions.name": "Name",
        "toolbar.filterOptions.all": "All",
        "toolbar.filterOptions.gainers": "Gainers",
        "toolbar.filterOptions.losers": "Losers",
        "toolbar.filterOptions.volatile": "Volatile",
        "toolbar.filterOptions.topVolume": "Top Volume",
        "toolbar.assetType.all": "All",
        "toolbar.assetType.crypto": "Crypto",
        "toolbar.assetType.stocks": "Stocks",
        "toolbar.sortBy": "Sort by",
        "toolbar.assetTypePlaceholder": "Asset Type",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock theme context
vi.mock("@wraith/ghost/context/ThemeContext", () => ({
  useThemeColors: () => ({
    text: { primary: "#fff", muted: "#888" },
    background: { raised: "#1a1a1a" },
    border: { subtle: "#333" },
  }),
}));

// Mock Ghost components
vi.mock("@wraith/ghost/components", () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
  Slider: ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <input
      data-testid="card-size-slider"
      type="range"
      value={value}
      onChange={(e) => onChange?.(parseInt(e.target.value))}
    />
  ),
  SegmentedControl: ({
    options,
    value,
    onChange,
  }: {
    options?: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div data-testid="segmented-control">
      {(options || []).map((opt) => (
        <button
          key={opt.value}
          data-testid={`segment-${opt.value}`}
          data-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
  Select: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
  FilterChip: ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <button
      data-testid={`filter-chip-${label.toLowerCase()}`}
      data-selected={selected}
      onClick={onPress}
    >
      {label}
    </button>
  ),
  Toggle: ({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) => (
    <button
      data-testid="offline-toggle"
      onClick={() => onValueChange(!value)}
    >
      {value ? "On" : "Off"}
    </button>
  ),
}));

vi.mock("@wraith/ghost/enums", () => ({
  Size: { Small: "sm", Medium: "md", Large: "lg" },
  TextAppearance: { Muted: "muted" },
}));

const defaultFilters: FilterState = {
  sort: "market_cap",
  sortDir: "desc",
  filter: "all",
  assetType: "all",
  showOfflineMarkets: false,
};

function renderToolbar(props: Partial<React.ComponentProps<typeof Toolbar>> = {}) {
  const defaultProps = {
    viewMode: "list" as ViewMode,
    onViewModeChange: vi.fn(),
    filters: defaultFilters,
    onFiltersChange: vi.fn(),
  };
  return render(<Toolbar {...defaultProps} {...props} />);
}

describe("Toolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders view mode toggle", () => {
      renderToolbar();
      expect(screen.getByTestId("segment-list")).toBeInTheDocument();
      expect(screen.getByTestId("segment-charts")).toBeInTheDocument();
    });

    it("renders filter chips", () => {
      renderToolbar();
      expect(screen.getByTestId("filter-chip-all")).toBeInTheDocument();
      expect(screen.getByTestId("filter-chip-gainers")).toBeInTheDocument();
      expect(screen.getByTestId("filter-chip-losers")).toBeInTheDocument();
    });

    it("renders sort select", () => {
      renderToolbar();
      expect(screen.getAllByTestId("select").length).toBeGreaterThan(0);
    });
  });

  describe("View Mode", () => {
    it("calls onViewModeChange when view changes", () => {
      const onViewModeChange = vi.fn();
      renderToolbar({ onViewModeChange });

      fireEvent.click(screen.getByTestId("segment-charts"));
      expect(onViewModeChange).toHaveBeenCalledWith("charts");
    });

    it("shows card size slider in charts mode", () => {
      renderToolbar({ viewMode: "charts", onCardSizeChange: vi.fn() });
      expect(screen.getByTestId("card-size-slider")).toBeInTheDocument();
    });

    it("hides card size slider in list mode", () => {
      renderToolbar({ viewMode: "list" });
      expect(screen.queryByTestId("card-size-slider")).not.toBeInTheDocument();
    });
  });

  describe("Filters", () => {
    it("calls onFiltersChange when filter chip clicked", () => {
      const onFiltersChange = vi.fn();
      renderToolbar({ onFiltersChange });

      fireEvent.click(screen.getByTestId("filter-chip-gainers"));
      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        filter: "gainers",
      });
    });

    it("calls onFiltersChange when offline toggle changes", () => {
      const onFiltersChange = vi.fn();
      renderToolbar({ onFiltersChange });

      fireEvent.click(screen.getByTestId("offline-toggle"));
      expect(onFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        showOfflineMarkets: true,
      });
    });
  });

  describe("Compact Mode", () => {
    it("renders compact toolbar when compact prop is true", () => {
      renderToolbar({ compact: true });
      // Compact mode still renders the same controls
      expect(screen.getByTestId("segment-list")).toBeInTheDocument();
    });
  });
});
