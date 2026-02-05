/**
 * @file usePositions.ts
 * @description Hook for fetching and managing open positions.
 *
 * Provides real-time position updates with polling and WebSocket support.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type Position, type ModifyPositionRequest } from "../services/haunt";
import { useAuth } from "../context/AuthContext";
import { useHauntSocket, type PositionUpdate } from "./useHauntSocket";

export type UsePositionsResult = {
  positions: Position[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  closePosition: (positionId: string) => Promise<void>;
  modifyPosition: (positionId: string, changes: ModifyPositionRequest) => Promise<Position>;
  addMargin: (positionId: string, amount: number) => Promise<Position>;
  lastPositionUpdate: PositionUpdate | null;
  updatedPositionIds: Set<string>; // Recently updated positions for UI feedback
};

const DEFAULT_POLL_INTERVAL = 10000; // 10 seconds

function normalizePosition(position: Position): Position {
  return {
    ...position,
    // Quantity/size aliases
    size: position.size ?? position.quantity,
    // Mark/current price aliases
    markPrice: position.markPrice ?? position.currentPrice,
    currentPrice: position.currentPrice ?? position.markPrice ?? 0,
    // P&L percent aliases
    unrealizedPnlPercent: position.unrealizedPnlPercent ?? position.unrealizedPnlPct,
    unrealizedPnlPct: position.unrealizedPnlPct ?? position.unrealizedPnlPercent ?? 0,
    // Margin aliases
    margin: position.margin ?? position.marginUsed,
  };
}

export function usePositions(
  portfolioId: string | null,
  pollInterval: number = DEFAULT_POLL_INTERVAL
): UsePositionsResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const { connected, onPositionUpdate, subscribePortfolio, portfolioSubscribed } = useHauntSocket();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPositionUpdate, setLastPositionUpdate] = useState<PositionUpdate | null>(null);
  const [updatedPositionIds, setUpdatedPositionIds] = useState<Set<string>>(new Set());
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchPositions = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setPositions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getPositions(sessionToken, portfolioId);
      console.log("[usePositions] Fetched positions:", response.data.length, response.data);
      setPositions(response.data.map(normalizePosition));
    } catch (err) {
      console.warn("Failed to fetch positions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId]);

  // Mark a position as recently updated for UI feedback
  const markPositionUpdated = useCallback((positionId: string) => {
    setUpdatedPositionIds((prev) => new Set(prev).add(positionId));

    // Clear existing timeout for this position
    const existingTimeout = updateTimeoutRef.current.get(positionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Clear the updated state after 1 second
    const timeout = setTimeout(() => {
      setUpdatedPositionIds((prev) => {
        const next = new Set(prev);
        next.delete(positionId);
        return next;
      });
      updateTimeoutRef.current.delete(positionId);
    }, 1000);

    updateTimeoutRef.current.set(positionId, timeout);
  }, []);

  // Handle real-time position updates
  const handlePositionUpdate = useCallback((update: PositionUpdate) => {
    console.log("[usePositions] WebSocket position update:", update.event, update);
    setLastPositionUpdate(update);

    // Mark position as updated for visual feedback
    if (update.event === "updated") {
      markPositionUpdated(update.id);
    }

    setPositions((prev) => {
      switch (update.event) {
        case "opened":
          // Add new position if not already present
          if (!prev.find((p) => p.id === update.id)) {
            return [
              normalizePosition({
                id: update.id,
                symbol: update.symbol,
                side: update.side,
                quantity: update.size,
                size: update.size,
                entryPrice: update.entryPrice,
                currentPrice: update.markPrice,
                markPrice: update.markPrice,
                leverage: 1, // Default, will be updated on next poll
                marginMode: "isolated" as const,
                liquidationPrice: update.liquidationPrice,
                unrealizedPnl: update.unrealizedPnl,
                unrealizedPnlPct: update.unrealizedPnlPercent,
                unrealizedPnlPercent: update.unrealizedPnlPercent,
                marginUsed: 0,
                margin: 0,
                roe: update.unrealizedPnlPercent,
                createdAt: update.timestamp,
              }),
              ...prev,
            ];
          }
          return prev;

        case "updated":
          // Update position P&L and mark price
          return prev.map((p) =>
            p.id === update.id
              ? {
                  ...p,
                  currentPrice: update.markPrice,
                  markPrice: update.markPrice,
                  unrealizedPnl: update.unrealizedPnl,
                  unrealizedPnlPct: update.unrealizedPnlPercent,
                  unrealizedPnlPercent: update.unrealizedPnlPercent,
                  liquidationPrice: update.liquidationPrice,
                  roe: update.unrealizedPnlPercent,
                }
              : p
          );

        case "closed":
        case "liquidated":
          // Remove from positions
          return prev.filter((p) => p.id !== update.id);

        default:
          return prev;
      }
    });
  }, [markPositionUpdated]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (connected && sessionToken && !portfolioSubscribed) {
      subscribePortfolio(sessionToken);
    }
  }, [connected, sessionToken, portfolioSubscribed, subscribePortfolio]);

  // Register for position updates
  useEffect(() => {
    return onPositionUpdate(handlePositionUpdate);
  }, [onPositionUpdate, handlePositionUpdate]);

  const closePosition = useCallback(async (positionId: string) => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    await hauntClient.closePosition(sessionToken, positionId);
    // Optimistically remove from list (WebSocket will confirm)
    setPositions((prev) => prev.filter((p) => p.id !== positionId));
  }, [sessionToken]);

  const modifyPosition = useCallback(async (
    positionId: string,
    changes: ModifyPositionRequest
  ): Promise<Position> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.modifyPosition(sessionToken, positionId, changes);
    const normalized = normalizePosition(response.data);
    // Update position in list
    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? normalized : p))
    );
    return normalized;
  }, [sessionToken]);

  const addMargin = useCallback(async (
    positionId: string,
    amount: number
  ): Promise<Position> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.addMargin(sessionToken, positionId, amount);
    const normalized = normalizePosition(response.data);
    // Update position in list
    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? normalized : p))
    );
    return normalized;
  }, [sessionToken]);

  // Initial fetch and polling
  useEffect(() => {
    fetchPositions();

    if (pollInterval > 0 && isAuthenticated && portfolioId) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchPositions();
          poll();
        }, pollInterval);
      };
      poll();
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [fetchPositions, pollInterval, isAuthenticated, portfolioId]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      updateTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      updateTimeoutRef.current.clear();
    };
  }, []);

  return {
    positions,
    loading,
    error,
    refetch: fetchPositions,
    closePosition,
    modifyPosition,
    addMargin,
    lastPositionUpdate,
    updatedPositionIds,
  };
}
