/**
 * @file useAlerts.ts
 * @description Hook for managing price alerts.
 *
 * Provides CRUD operations for price alerts and real-time
 * updates when alerts are triggered via WebSocket.
 * Requires authentication token from AuthContext.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  hauntClient,
  type Alert,
  type CreateAlertRequest,
} from "../services/haunt";
import { useAuth } from "../context/AuthContext";
import { useHauntSocket, type AlertUpdate } from "./useHauntSocket";

export type UseAlertsResult = {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAlert: (request: CreateAlertRequest) => Promise<Alert>;
  deleteAlert: (alertId: string) => Promise<void>;
  lastTriggeredAlert: AlertUpdate | null;
};

const DEFAULT_POLL_INTERVAL = 60000; // 1 minute

export function useAlerts(pollInterval: number = DEFAULT_POLL_INTERVAL): UseAlertsResult {
  const { sessionToken, isAuthenticated } = useAuth();
  const { connected, onAlertTriggered, subscribePortfolio, portfolioSubscribed } = useHauntSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTriggeredAlert, setLastTriggeredAlert] = useState<AlertUpdate | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated || !sessionToken) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getAlerts(sessionToken);
      setAlerts(response.data);
    } catch (err) {
      console.warn("Failed to fetch alerts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, [sessionToken, isAuthenticated]);

  // Handle real-time alert triggers
  const handleAlertTriggered = useCallback((alert: AlertUpdate) => {
    setLastTriggeredAlert(alert);

    // Update the alert in the list to mark as triggered
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.alertId
          ? { ...a, triggered: true, triggeredAt: alert.timestamp }
          : a
      )
    );
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (connected && sessionToken && !portfolioSubscribed) {
      subscribePortfolio(sessionToken);
    }
  }, [connected, sessionToken, portfolioSubscribed, subscribePortfolio]);

  // Register for alert triggers
  useEffect(() => {
    return onAlertTriggered(handleAlertTriggered);
  }, [onAlertTriggered, handleAlertTriggered]);

  const createAlert = useCallback(async (request: CreateAlertRequest): Promise<Alert> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    const response = await hauntClient.createAlert(sessionToken, request);
    // Add to alerts list
    setAlerts((prev) => [response.data, ...prev]);
    return response.data;
  }, [sessionToken]);

  const deleteAlert = useCallback(async (alertId: string): Promise<void> => {
    if (!sessionToken) {
      throw new Error("Not authenticated");
    }

    await hauntClient.deleteAlert(sessionToken, alertId);
    // Remove from alerts list
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, [sessionToken]);

  // Initial fetch and polling
  useEffect(() => {
    fetchAlerts();

    if (pollInterval > 0 && isAuthenticated) {
      const poll = () => {
        pollTimeoutRef.current = setTimeout(() => {
          fetchAlerts();
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
  }, [fetchAlerts, pollInterval, isAuthenticated]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    createAlert,
    deleteAlert,
    lastTriggeredAlert,
  };
}
