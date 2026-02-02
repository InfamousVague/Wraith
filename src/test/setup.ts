import { afterEach, vi, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock MutationObserver
class MockMutationObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(_callback: MutationCallback) {}
}
global.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

// Mock lightweight-charts
vi.mock("lightweight-charts", () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
    })),
    remove: vi.fn(),
    resize: vi.fn(),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
    subscribeCrosshairMove: vi.fn(),
  })),
  AreaSeries: "AreaSeries",
  LineSeries: "LineSeries",
  CandlestickSeries: "CandlestickSeries",
  HistogramSeries: "HistogramSeries",
  CrosshairMode: { Normal: 0, Hidden: 1 },
}));

// Mock react-router-dom - only mock useNavigate, let useParams work naturally with Routes
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Platform for React Native Web
vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native-web");
  return {
    ...actual,
    Platform: { OS: "web" },
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console errors/warnings in tests (optional - can remove for debugging)
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
