/**
 * @file useExchangeDominance.ts
 * @description Hook for fetching exchange dominance by region for a symbol.
 *
 * Returns the dominant exchange for each geographic region (Americas, Europe, Asia)
 * to help users choose the optimal trading server for best liquidity.
 */

import { useState, useEffect, useCallback } from "react";
import { hauntClient, type ExchangeDominanceResponse } from "../services/haunt";

export type UseExchangeDominanceResult = {
  data: ExchangeDominanceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useExchangeDominance(symbol: string | undefined): UseExchangeDominanceResult {
  const [data, setData] = useState<ExchangeDominanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!symbol) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await hauntClient.getExchangeDominance(symbol);
      setData(response.data);
    } catch (err) {
      console.warn("Failed to fetch exchange dominance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch exchange dominance");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
