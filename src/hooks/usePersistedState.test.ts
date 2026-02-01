import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistedState } from "./usePersistedState";

describe("usePersistedState", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return default value when no stored value exists", () => {
    const { result } = renderHook(() => usePersistedState("test-key", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("should return stored value when it exists", () => {
    localStorage.setItem("test-key", JSON.stringify("stored-value"));
    const { result } = renderHook(() => usePersistedState("test-key", "default"));
    expect(result.current[0]).toBe("stored-value");
  });

  it("should persist value to localStorage on change", () => {
    const { result } = renderHook(() => usePersistedState("test-key", "initial"));

    act(() => {
      result.current[1]("new-value");
    });

    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
  });

  it("should handle number values", () => {
    const { result } = renderHook(() => usePersistedState("test-number", 100));

    act(() => {
      result.current[1](200);
    });

    expect(result.current[0]).toBe(200);
    expect(localStorage.getItem("test-number")).toBe("200");
  });

  it("should handle function updates", () => {
    const { result } = renderHook(() => usePersistedState("test-fn", 10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it("should return default on invalid JSON", () => {
    localStorage.setItem("test-invalid", "not-valid-json");
    const { result } = renderHook(() => usePersistedState("test-invalid", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});
