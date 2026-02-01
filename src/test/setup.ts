import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock Platform for React Native Web
vi.mock("react-native", async () => {
  const actual = await vi.importActual("react-native-web");
  return {
    ...actual,
    Platform: { OS: "web" },
  };
});
