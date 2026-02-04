/**
 * @file useOrders.ts
 * @description Hook for fetching and managing pending orders.
 *
 * Provides real-time order updates with polling and WebSocket support.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { hauntClient, type Order, type PlaceOrderRequest, type ModifyOrderRequest } from "../services/haunt";
import { useAuth } from "../context/AuthContext";
import { useHauntSocket, type OrderUpdate } from "./useHauntSocket";

export type UseOrdersResult = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  placeOrder: (order: PlaceOrderRequest) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  modifyOrder: (orderId: string, changes: ModifyOrderRequest) => Promise<Order>;
  cancelAllOrders: (symbol?: string) => Promise<number>;
  lastOrderUpdate: OrderUpdate | null;
};

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds

export function useOrders(
  portfolioId: string | null,
  pollInterval: number = DEFAULT_POLL_INTERVAL
): UseOrdersResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const { connected, onOrderUpdate, subscribePortfolio, portfolioSubscribed } = useHauntSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrderUpdate, setLastOrderUpdate] = useState<OrderUpdate | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !sessionToken || !portfolioId) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getOrders(sessionToken, portfolioId);
      setOrders(response.data);
    } catch (err) {
      console.warn("Failed to fetch orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated, portfolioId]);

  // Handle real-time order updates
  const handleOrderUpdate = useCallback((update: OrderUpdate) => {
    setLastOrderUpdate(update);

    setOrders((prev) => {
      switch (update.event) {
        case "created":
          // Add new order if not already present
          if (!prev.find((o) => o.id === update.id)) {
            return [
              {
                id: update.id,
                symbol: update.symbol,
                type: update.type,
                side: update.side,
                price: update.price,
                size: update.size,
                filledSize: update.filledSize,
                status: update.status as Order["status"],
                createdAt: update.timestamp,
              },
              ...prev,
            ];
          }
          return prev;

        case "partial":
          // Update filled size
          return prev.map((o) =>
            o.id === update.id
              ? { ...o, filledSize: update.filledSize, status: "partial" as const }
              : o
          );

        case "filled":
        case "cancelled":
        case "rejected":
          // Remove from pending orders
          return prev.filter((o) => o.id !== update.id);

        default:
          return prev;
      }
    });
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (connected && sessionToken && !portfolioSubscribed) {
      subscribePortfolio(sessionToken);
    }
  }, [connected, sessionToken, portfolioSubscribed, subscribePortfolio]);

  // Register for order updates
  useEffect(() => {
    return onOrderUpdate(handleOrderUpdate);
  }, [onOrderUpdate, handleOrderUpdate]);

  const placeOrder = useCallback(async (orderRequest: PlaceOrderRequest): Promise<Order> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.placeOrder(sessionToken, orderRequest);
    // Refetch orders after placing (WebSocket will also update)
    await fetchOrders();
    // Backend returns ApiResponse<Order> which is { data: Order }
    return response.data;
  }, [sessionToken, fetchOrders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    await hauntClient.cancelOrder(sessionToken, orderId);
    // Optimistically remove from list
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, [sessionToken]);

  const modifyOrder = useCallback(async (orderId: string, changes: ModifyOrderRequest): Promise<Order> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.modifyOrder(sessionToken, orderId, changes);
    // Update order in list
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? response.data : o))
    );
    return response.data;
  }, [sessionToken]);

  const cancelAllOrders = useCallback(async (symbol?: string): Promise<number> => {
    if (!sessionToken || !portfolioId) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.cancelAllOrders(sessionToken, portfolioId, symbol);
    // Optimistically clear orders
    if (symbol) {
      setOrders((prev) => prev.filter((o) => o.symbol !== symbol));
    } else {
      setOrders([]);
    }
    return response.data.cancelled;
  }, [sessionToken, portfolioId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchOrders();

    if (pollInterval > 0 && isAuthenticated && portfolioId) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchOrders();
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
  }, [fetchOrders, pollInterval, isAuthenticated, portfolioId]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    placeOrder,
    cancelOrder,
    modifyOrder,
    cancelAllOrders,
    lastOrderUpdate,
  };
}
