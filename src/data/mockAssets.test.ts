import { describe, it, expect } from "vitest";
import { MOCK_ASSETS } from "./mockAssets";

describe("MOCK_ASSETS", () => {
  it("should have 50 assets", () => {
    expect(MOCK_ASSETS.length).toBe(50);
  });

  it("should have Bitcoin as first asset", () => {
    expect(MOCK_ASSETS[0].symbol).toBe("BTC");
    expect(MOCK_ASSETS[0].name).toBe("Bitcoin");
    expect(MOCK_ASSETS[0].rank).toBe(1);
  });

  it("should have Ethereum as second asset", () => {
    expect(MOCK_ASSETS[1].symbol).toBe("ETH");
    expect(MOCK_ASSETS[1].name).toBe("Ethereum");
  });

  it("should have valid sparkline data for each asset", () => {
    MOCK_ASSETS.forEach((asset) => {
      expect(Array.isArray(asset.sparkline)).toBe(true);
      expect(asset.sparkline.length).toBeGreaterThan(0);
    });
  });

  it("should have valid image URLs", () => {
    MOCK_ASSETS.forEach((asset) => {
      expect(asset.image).toMatch(/^https:\/\/s2\.coinmarketcap\.com\/static\/img\/coins\/64x64\/\d+\.png$/);
    });
  });

  it("should have ascending ranks", () => {
    for (let i = 0; i < MOCK_ASSETS.length - 1; i++) {
      expect(MOCK_ASSETS[i].rank).toBeLessThan(MOCK_ASSETS[i + 1].rank);
    }
  });
});
