import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCryptoData } from "./useCryptoData";
import { MOCK_ASSETS } from "../data/mockAssets";

describe("useCryptoData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial loading state", () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true }));
    expect(result.current.loading).toBe(true);
    expect(result.current.assets).toEqual([]);
  });

  it("should load mock data", async () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.assets.length).toBe(10);
    expect(result.current.assets[0].symbol).toBe("BTC");
  });

  it("should search assets by name", async () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true, limit: 20 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const searchResults = result.current.search("ethereum");
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.some((a) => a.name === "Ethereum")).toBe(true);
  });

  it("should search assets by symbol", async () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true, limit: 20 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const searchResults = result.current.search("btc");
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.some((a) => a.symbol === "BTC")).toBe(true);
  });

  it("should return all assets when search query is empty", async () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const searchResults = result.current.search("");
    expect(searchResults.length).toBe(10);
  });

  it("should indicate hasMore when more data available", async () => {
    const { result } = renderHook(() => useCryptoData({ useMock: true, limit: 10 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
  });
});
