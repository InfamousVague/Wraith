/**
 * Outcome helper functions for prediction rows
 */

import { Colors } from "@wraith/ghost/tokens";
import type { SignalPrediction } from "../../../types/signals";
import type { OutcomeResult, DirectionDisplay } from "../types";

/** Get the best available outcome and price */
export function getBestOutcome(
  prediction: SignalPrediction,
  preferredTimeframe?: string
): OutcomeResult {
  // If a specific timeframe is requested
  if (preferredTimeframe) {
    switch (preferredTimeframe) {
      case "5m":
        return {
          outcome: prediction.outcome5m ?? null,
          priceAfter: prediction.priceAfter5m ?? null,
          timeframe: "5m",
        };
      case "1h":
        return {
          outcome: prediction.outcome1h ?? null,
          priceAfter: prediction.priceAfter1h ?? null,
          timeframe: "1h",
        };
      case "4h":
        return {
          outcome: prediction.outcome4h ?? null,
          priceAfter: prediction.priceAfter4h ?? null,
          timeframe: "4h",
        };
      case "24h":
        return {
          outcome: prediction.outcome24h ?? null,
          priceAfter: prediction.priceAfter24h ?? null,
          timeframe: "24h",
        };
    }
  }

  // Otherwise, return the longest validated timeframe
  if (prediction.outcome24h) {
    return {
      outcome: prediction.outcome24h,
      priceAfter: prediction.priceAfter24h ?? null,
      timeframe: "24h",
    };
  }
  if (prediction.outcome4h) {
    return {
      outcome: prediction.outcome4h,
      priceAfter: prediction.priceAfter4h ?? null,
      timeframe: "4h",
    };
  }
  if (prediction.outcome1h) {
    return {
      outcome: prediction.outcome1h,
      priceAfter: prediction.priceAfter1h ?? null,
      timeframe: "1h",
    };
  }
  if (prediction.outcome5m) {
    return {
      outcome: prediction.outcome5m,
      priceAfter: prediction.priceAfter5m ?? null,
      timeframe: "5m",
    };
  }

  return { outcome: null, priceAfter: null, timeframe: "pending" };
}

/** Get direction display */
export function getDirectionDisplay(direction: string): DirectionDisplay {
  switch (direction) {
    case "strong_buy":
      return { label: "BUY", color: Colors.status.success };
    case "buy":
      return { label: "BUY", color: Colors.status.successDim };
    case "sell":
      return { label: "SELL", color: Colors.status.dangerDim };
    case "strong_sell":
      return { label: "SELL", color: Colors.status.danger };
    default:
      return { label: "HOLD", color: Colors.text.muted };
  }
}
