/**
 * @file useTapTrading.ts
 * @description Main data hook for the Tap Trading page.
 *
 * All game-critical data (multipliers, grid config, trade resolution) comes
 * from the Haunt backend. The frontend is display-only — it never computes
 * multipliers or price ranges locally, preventing client-side cheating.
 *
 * Data flow:
 * - REST: grid state (config + multipliers + positions) on mount
 * - WebSocket: multiplier matrix updates (~1Hz), trade events, price ticks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import { useHauntSocket, useAssetSubscription } from "./useHauntSocket";
import { useAuth } from "../context/AuthContext";
import type {
  GridConfig,
  TapPosition,
  TapStats,
  UseTapTradingReturn,
} from "../types/tap-trading";
import type {
  GridMultiplierUpdateData,
  GridTradePlacedData,
  GridTradeResolvedData,
  GridColumnExpiredData,
} from "./useHauntSocket";

// ─── Display preferences (sent to backend, not overrides) ────
// These are hints sent as query params so the backend builds
// a config with our preferred grid dimensions. The backend is
// still authoritative — it may return different values.

const PREFERRED_ROW_COUNT = 36;
const PREFERRED_COL_COUNT = 12;
const VISIBLE_ROWS = 12; // For canvas rendering (cell sizing), not business logic

/**
 * Map backend camelCase config to our frontend GridConfig type.
 * No overrides — values come directly from the backend.
 */
function mapBackendConfig(raw: any): GridConfig {
  return {
    symbol: raw.symbol || "",
    row_count: raw.rowCount || raw.row_count || 8,
    col_count: raw.colCount || raw.col_count || 6,
    interval_ms: raw.intervalMs || raw.interval_ms || 10_000,
    row_height: raw.rowHeight || raw.row_height || 0,
    price_high: raw.priceHigh || raw.price_high || 0,
    price_low: raw.priceLow || raw.price_low || 0,
    current_col_index: raw.currentColIndex || raw.current_col_index || 0,
    house_edge: raw.houseEdge || raw.house_edge || 0.05,
    min_multiplier: raw.minMultiplier || raw.min_multiplier || 1.1,
    max_multiplier: raw.maxMultiplier || raw.max_multiplier || 100,
    max_active_trades: raw.maxActiveTrades || raw.max_active_trades || 10,
    min_trade_amount: raw.minTradeAmount || raw.min_trade_amount || 0.1,
    bet_size_presets: raw.betSizePresets || raw.bet_size_presets || [1, 5, 10, 25, 50],
    leverage_presets: raw.leveragePresets || raw.leverage_presets || [1, 2, 5, 10],
    max_leverage: raw.maxLeverage || raw.max_leverage || 10,
    sensitivity_factor: 1.0, // No client-side sensitivity compression
    min_time_buffer_ms: raw.minTimeBufferMs || raw.min_time_buffer_ms || 2000,
  };
}

/**
 * Hook for tap trading data and actions.
 *
 * @param symbol - The trading symbol (e.g., "BTC")
 * @param portfolioId - The user's portfolio ID
 * @returns Tap trading state and actions
 */
export function useTapTrading(
  symbol: string,
  portfolioId?: string
): UseTapTradingReturn {
  const { sessionToken } = useAuth();
  const {
    connected,
    subscribeGridline,
    unsubscribeGridline,
    onGridMultiplierUpdate,
    onGridTradePlaced,
    onGridTradeResolved,
    onGridColumnExpired,
  } = useHauntSocket();

  const [gridConfig, setGridConfig] = useState<GridConfig | null>(null);
  const [multipliers, setMultipliers] = useState<number[][]>([]);
  const [activePositions, setActivePositions] = useState<TapPosition[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceHistory, setPriceHistory] = useState<Array<{ time: number; price: number }>>([]);
  const [stats, setStats] = useState<TapStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track callbacks for trade events (page can subscribe to these)
  const onTradeResolvedRef = useRef<((data: GridTradeResolvedData) => void) | null>(null);
  const onColumnExpiredRef = useRef<((data: GridColumnExpiredData) => void) | null>(null);

  // ─── REST: Fetch initial state on mount ──────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchInitialState() {
      try {
        // Request grid state with preferred dimensions — backend is authoritative
        const stateRes = await hauntClient.getGridState(symbol, {
          row_count: PREFERRED_ROW_COUNT,
          col_count: PREFERRED_COL_COUNT,
          portfolio_id: portfolioId,
        });
        if (cancelled) return;

        const data = (stateRes as any).data;
        if (data) {
          if (data.config) {
            const config = mapBackendConfig(data.config);
            setGridConfig(config);

            // Use the mid-price from backend config as initial price
            const price = (config.price_high + config.price_low) / 2;
            setCurrentPrice(price);
          }

          // Use server-computed multipliers directly (pad 2 extra cols for edge rendering)
          if (data.multipliers && Array.isArray(data.multipliers)) {
            const padded = data.multipliers.map((row: number[]) => {
              if (!row || row.length === 0) return row;
              const last = row[row.length - 1];
              return [...row, last, last];
            });
            setMultipliers(padded);
          }

          if (data.activePositions) {
            setActivePositions(data.activePositions);
          }

          // Pre-populate sparkline with price history from backend
          if (data.priceHistory && Array.isArray(data.priceHistory) && data.priceHistory.length > 0) {
            const history = data.priceHistory.map((p: any) => ({
              time: p.time,
              price: p.price,
            }));
            setPriceHistory(history);
            // Use the most recent price from history as the initial current price
            const lastPoint = history[history.length - 1];
            if (lastPoint?.price) {
              setCurrentPrice(lastPoint.price);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[useTapTrading] Failed to fetch grid state:", err);
          setError(err.message || "Failed to load grid data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchInitialState();
    return () => { cancelled = true; };
  }, [symbol, portfolioId]);

  // ─── WebSocket: Subscribe to gridline updates ────────────────

  // Subscribe to gridline events when connected
  useEffect(() => {
    if (connected) {
      subscribeGridline(symbol, portfolioId);
    }
    return () => {
      if (connected) {
        unsubscribeGridline(symbol);
      }
    };
  }, [connected, symbol, portfolioId, subscribeGridline, unsubscribeGridline]);

  // Handle multiplier matrix updates from backend (~1Hz)
  useEffect(() => {
    return onGridMultiplierUpdate((update: GridMultiplierUpdateData) => {
      if (update.symbol.toUpperCase() !== symbol.toUpperCase()) return;

      // Update price from backend (camelCase from serde)
      const price = update.currentPrice || update.current_price;
      if (price) {
        setCurrentPrice(price);
        setPriceHistory((prev) => {
          const next = [...prev, { time: update.timestamp, price }];
          const maxPoints = 500;
          return next.length > maxPoints ? next.slice(-maxPoints) : next;
        });
      }

      // Use server-computed multipliers directly — no local recomputation
      // Pad with 2 extra columns (duplicate last col) so the rightmost visible
      // cells don't render blank while scrolling in from the right edge.
      if (update.multipliers && Array.isArray(update.multipliers) && update.multipliers.length > 0) {
        const padded = update.multipliers.map((row: number[]) => {
          if (!row || row.length === 0) return row;
          const last = row[row.length - 1];
          return [...row, last, last];
        });
        setMultipliers(padded);
      }

      // Only update grid config if price has drifted far outside the current grid range.
      // Updating config every tick causes "jerk-back" because price_high/price_low shift
      // the entire coordinate system. The viewport lerp handles normal price tracking.
      if (update.config && price) {
        setGridConfig((prev) => {
          if (!prev) return mapBackendConfig(update.config);
          const gridRange = prev.price_high - prev.price_low;
          const margin = gridRange * 0.15; // 15% margin before re-center
          if (price > prev.price_high - margin || price < prev.price_low + margin) {
            // Price near edge — re-center the grid
            return mapBackendConfig(update.config);
          }
          // Price is well within grid range — keep existing config to avoid jerk
          return prev;
        });
      }
    });
  }, [symbol, onGridMultiplierUpdate]);

  // Handle trade placed confirmations
  useEffect(() => {
    return onGridTradePlaced((update: GridTradePlacedData) => {
      const pos = update.position;
      if (pos.symbol?.toUpperCase() !== symbol.toUpperCase()) return;

      setActivePositions((prev) => {
        // Match by server ID first, then fall back to matching optimistic
        // entry by (row, col) to prevent duplicates from race conditions
        let idx = prev.findIndex((p) => p.id === pos.id);
        if (idx < 0) {
          // Look for the optimistic entry (pending_* ID) at the same cell
          idx = prev.findIndex(
            (p) =>
              p.id.startsWith("pending_") &&
              p.row_index === pos.row_index &&
              p.col_index === pos.col_index &&
              (p.status === "pending" || p.status === "active")
          );
        }
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            id: pos.id,
            multiplier: pos.multiplier,
            price_low: pos.price_low,
            price_high: pos.price_high,
            time_start: pos.time_start,
            time_end: pos.time_end,
            status: "active",
            created_at: pos.created_at,
          };
          return next;
        }
        // Truly new position (e.g. placed from another session/device)
        // Check for duplicate by row/col before adding
        const alreadyExists = prev.some(
          (p) =>
            p.row_index === pos.row_index &&
            p.col_index === pos.col_index &&
            (p.status === "active" || p.status === "pending")
        );
        if (alreadyExists) return prev;

        return [...prev, {
          id: pos.id,
          portfolio_id: pos.portfolio_id,
          symbol: pos.symbol,
          row_index: pos.row_index,
          col_index: pos.col_index,
          amount: pos.amount,
          leverage: pos.leverage,
          multiplier: pos.multiplier,
          price_low: pos.price_low,
          price_high: pos.price_high,
          time_start: pos.time_start,
          time_end: pos.time_end,
          status: "active",
          created_at: pos.created_at,
        }];
      });
    });
  }, [symbol, onGridTradePlaced]);

  // Handle trade resolutions
  useEffect(() => {
    return onGridTradeResolved((update: GridTradeResolvedData) => {
      setActivePositions((prev) =>
        prev.map((p) =>
          p.id === update.position.id
            ? {
                ...p,
                status: update.won ? "won" : "lost",
                result_pnl: update.pnl,
                payout: update.payout,
                resolved_at: update.timestamp,
              }
            : p
        )
      );
      onTradeResolvedRef.current?.(update);
    });
  }, [onGridTradeResolved]);

  // Handle column expirations (batch resolutions)
  useEffect(() => {
    return onGridColumnExpired((update: GridColumnExpiredData) => {
      if (update.symbol.toUpperCase() !== symbol.toUpperCase()) return;

      setActivePositions((prev) =>
        prev.map((p) => {
          const result = update.results.find((r) => r.position_id === p.id);
          if (result) {
            return {
              ...p,
              status: result.won ? "won" : "lost",
              result_pnl: result.pnl,
              payout: result.payout,
              resolved_at: update.timestamp,
            };
          }
          return p;
        })
      );
      onColumnExpiredRef.current?.(update);
    });
  }, [symbol, onGridColumnExpired]);

  // ─── Subscribe to price updates via the existing price feed ──

  useAssetSubscription([symbol], (update) => {
    setCurrentPrice(update.price);
    setPriceHistory((prev) => {
      const next = [...prev, { time: Date.now(), price: update.price }];
      const maxPoints = 500;
      return next.length > maxPoints ? next.slice(-maxPoints) : next;
    });

    // Note: We do NOT recompute multipliers on price ticks.
    // The backend broadcasts updated multipliers via WebSocket (~1Hz).
    // This prevents any client-side manipulation of multiplier values.
  });

  // ─── Actions ─────────────────────────────────────────────────

  const placeTrade = useCallback(async (
    row: number,
    col: number,
    amount?: number,
    lev?: number,
    canvasTimeStart?: number,
    canvasTimeEnd?: number,
  ) => {
    if (!sessionToken || !portfolioId) {
      setError("Not authenticated");
      return;
    }

    const betAmount = amount ?? 5;
    const betLeverage = lev ?? 1;

    // Get the server-computed multiplier for display purposes only
    const displayMultiplier = multipliers[row]?.[col] ?? 1.0;

    // Use absolute time from canvas (anchored to gridStartTime) for correct rendering.
    // Fallback to Date.now()-based calculation if canvas doesn't provide times.
    const timeStart = canvasTimeStart ?? (gridConfig ? Date.now() + col * gridConfig.interval_ms : Date.now());
    const timeEnd = canvasTimeEnd ?? (gridConfig ? Date.now() + (col + 1) * gridConfig.interval_ms : Date.now() + 10000);

    // Optimistic: add pending position immediately for responsive UI
    const optimisticId = `pending_${Date.now()}_${row}_${col}`;
    const optimisticPosition: TapPosition = {
      id: optimisticId,
      portfolio_id: portfolioId,
      symbol,
      row_index: row,
      col_index: col,
      amount: betAmount,
      leverage: betLeverage,
      multiplier: displayMultiplier,
      price_low: gridConfig ? gridConfig.price_high - (row + 1) * gridConfig.row_height : 0,
      price_high: gridConfig ? gridConfig.price_high - row * gridConfig.row_height : 0,
      time_start: timeStart,
      time_end: timeEnd,
      status: "pending",
      created_at: Date.now(),
    };
    setActivePositions((prev) => [...prev, optimisticPosition]);

    try {
      // Send trade to backend — backend computes authoritative multiplier,
      // price bounds, and time window from row_index + col_index + its own config.
      const priceLow = gridConfig ? gridConfig.price_high - (row + 1) * gridConfig.row_height : 0;
      const priceHigh = gridConfig ? gridConfig.price_high - row * gridConfig.row_height : 0;

      const res = await hauntClient.placeGridTrade(sessionToken, {
        symbol,
        rowIndex: row,
        colIndex: col,
        amount: betAmount,
        leverage: betLeverage,
        portfolioId: portfolioId,
        priceLow,
        priceHigh,
        timeStart,
        timeEnd,
        multiplier: displayMultiplier,
      });

      const data = (res as any).data;
      if (data) {
        // Replace optimistic with server-confirmed position (all values from server).
        // If the WebSocket already replaced the optimistic entry (id changed),
        // look for the server ID to avoid creating a duplicate.
        setActivePositions((prev) => {
          const hasOptimistic = prev.some((p) => p.id === optimisticId);
          const hasServerId = data.id && prev.some((p) => p.id === data.id);

          // WebSocket already handled it — optimistic is gone, server entry exists
          if (!hasOptimistic && hasServerId) return prev;

          return prev.map((p) =>
            p.id === optimisticId
              ? {
                  id: data.id || optimisticId,
                  portfolio_id: data.portfolioId || data.portfolio_id || portfolioId,
                  symbol: data.symbol || symbol,
                  row_index: data.rowIndex ?? data.row_index ?? row,
                  col_index: data.colIndex ?? data.col_index ?? col,
                  amount: data.amount ?? betAmount,
                  leverage: data.leverage ?? betLeverage,
                  multiplier: data.multiplier ?? displayMultiplier,
                  price_low: data.priceLow ?? data.price_low ?? p.price_low,
                  price_high: data.priceHigh ?? data.price_high ?? p.price_high,
                  time_start: data.timeStart ?? data.time_start ?? p.time_start,
                  time_end: data.timeEnd ?? data.time_end ?? p.time_end,
                  status: "active",
                  created_at: data.createdAt ?? data.created_at ?? p.created_at,
                }
              : p
          );
        });
      } else {
        // No position data in response — keep optimistic as active
        setActivePositions((prev) =>
          prev.map((p) => (p.id === optimisticId ? { ...p, status: "active" } : p))
        );
      }
    } catch (err: any) {
      console.error("[useTapTrading] placeGridTrade error:", err);
      // Remove optimistic position on error
      setActivePositions((prev) => prev.filter((p) => p.id !== optimisticId));
      setError(err.message || "Trade failed");
    }
  }, [sessionToken, portfolioId, symbol, multipliers, gridConfig]);

  // ─── Clean up resolved positions after fade animation ────────

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePositions((prev) => {
        const now = Date.now();
        return prev
          .map((p) => {
            // If position's time column has expired and it's still active/pending,
            // mark it as lost (client-side safety net in case WS resolution is missed).
            if ((p.status === "active" || p.status === "pending") && p.time_end && now > p.time_end) {
              return { ...p, status: "lost" as const, resolved_at: now, result_pnl: -p.amount };
            }
            return p;
          })
          .filter((p) => {
            // Remove resolved positions after their fade animation
            if (p.status === "won" && p.resolved_at && now - p.resolved_at > 3000) return false;
            if (p.status === "lost" && p.resolved_at && now - p.resolved_at > 2000) return false;
            return true;
          });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    gridConfig,
    multipliers,
    activePositions,
    currentPrice,
    priceHistory,
    placeTrade,
    stats,
    betSizePresets: gridConfig?.bet_size_presets ?? [1, 5, 10, 25, 50],
    leveragePresets: gridConfig?.leverage_presets ?? [1, 2, 5, 10],
    connected,
    loading,
    error,
  };
}
