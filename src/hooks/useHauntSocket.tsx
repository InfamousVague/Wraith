import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext, type ReactNode } from "react";
import { logger } from "../utils/logger";

// Derive WebSocket URL from current location (works with Vite proxy)
function getWebSocketUrl(): string {
  if (import.meta.env.VITE_HAUNT_WS_URL) {
    return import.meta.env.VITE_HAUNT_WS_URL;
  }

  // In development, connect directly to Haunt server
  // Vite proxy doesn't handle WebSocket upgrade well, so we go direct
  if (import.meta.env.DEV) {
    return "ws://localhost:3001/ws";
  }

  // In production, derive from current location
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }

  return "ws://localhost:3001/ws";
}

export type PriceUpdate = {
  id: number;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: string;
};

export type MarketUpdate = {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  timestamp: string;
};

export type WSMessage =
  | { type: "price_update"; data: PriceUpdate }
  | { type: "market_update"; data: MarketUpdate }
  | { type: "subscribed"; assets: string[] }
  | { type: "unsubscribed"; assets: string[] }
  | { type: "error"; error: string };

type HauntSocketContextType = {
  connected: boolean;
  subscribe: (assets: string[]) => void;
  unsubscribe: (assets?: string[]) => void;
  subscriptions: string[];
  error: string | null;
  onPriceUpdate: (callback: (update: PriceUpdate) => void) => () => void;
  onMarketUpdate: (callback: (update: MarketUpdate) => void) => () => void;
};

const HauntSocketContext = createContext<HauntSocketContextType | null>(null);

type HauntSocketProviderProps = {
  children: ReactNode;
  autoReconnect?: boolean;
  reconnectInterval?: number;
};

/**
 * Provider component that manages a single WebSocket connection to Haunt.
 * Wrap your app with this to share the connection across components.
 */
export function HauntSocketProvider({
  children,
  autoReconnect = true,
  reconnectInterval = 5000,
}: HauntSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  // Compute WebSocket URL once
  const wsUrl = useMemo(() => getWebSocketUrl(), []);

  // Callback registries
  const priceCallbacksRef = useRef<Set<(update: PriceUpdate) => void>>(new Set());
  const marketCallbacksRef = useRef<Set<(update: MarketUpdate) => void>>(new Set());

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      logger.data("Haunt WS", { action: "connecting", url: wsUrl });
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        logger.data("Haunt WS", { action: "connected" });
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message = JSON.parse(event.data) as WSMessage;

          switch (message.type) {
            case "price_update":
              priceCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "market_update":
              marketCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "subscribed":
              setSubscriptions((prev) => [...new Set([...prev, ...message.assets])]);
              break;

            case "unsubscribed":
              setSubscriptions((prev) => prev.filter((a) => !message.assets.includes(a)));
              break;

            case "error":
              setError(message.error);
              break;
          }
        } catch (err) {
          logger.error("Haunt WS parse error", err);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        logger.data("Haunt WS", { action: "disconnected" });
        setConnected(false);
        socketRef.current = null;

        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        logger.error("Haunt WS error", event);
        setError("WebSocket connection error");
      };
    } catch (err) {
      logger.error("Haunt WS connect error", err);
      setError("Failed to connect to WebSocket");
    }
  }, [autoReconnect, reconnectInterval, wsUrl]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const subscribe = useCallback((assets: string[]) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "subscribe", assets }));
    }
  }, []);

  const unsubscribe = useCallback((assets?: string[]) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "unsubscribe", assets }));
    }
  }, []);

  const onPriceUpdate = useCallback((callback: (update: PriceUpdate) => void) => {
    priceCallbacksRef.current.add(callback);
    return () => {
      priceCallbacksRef.current.delete(callback);
    };
  }, []);

  const onMarketUpdate = useCallback((callback: (update: MarketUpdate) => void) => {
    marketCallbacksRef.current.add(callback);
    return () => {
      marketCallbacksRef.current.delete(callback);
    };
  }, []);

  const value: HauntSocketContextType = {
    connected,
    subscribe,
    unsubscribe,
    subscriptions,
    error,
    onPriceUpdate,
    onMarketUpdate,
  };

  return (
    <HauntSocketContext.Provider value={value}>
      {children}
    </HauntSocketContext.Provider>
  );
}

// No-op version of the context for when provider is not available
const noopContext: HauntSocketContextType = {
  connected: false,
  subscribe: () => {},
  unsubscribe: () => {},
  subscriptions: [],
  error: null,
  onPriceUpdate: () => () => {},
  onMarketUpdate: () => () => {},
};

/**
 * Hook to access the shared Haunt WebSocket connection.
 * Returns a no-op version when used outside HauntSocketProvider (e.g., tests).
 */
export function useHauntSocket() {
  const context = useContext(HauntSocketContext);
  // Return no-op context when provider is not available (e.g., in tests)
  return context ?? noopContext;
}

/**
 * Hook to subscribe to specific assets and receive price updates.
 */
export function useAssetSubscription(
  assets: string[],
  onUpdate?: (update: PriceUpdate) => void
) {
  const { connected, subscribe, unsubscribe, onPriceUpdate } = useHauntSocket();

  // Subscribe when connected and assets change
  useEffect(() => {
    if (connected && assets.length > 0) {
      subscribe(assets.map((a) => a.toLowerCase()));
    }

    return () => {
      if (assets.length > 0) {
        unsubscribe(assets.map((a) => a.toLowerCase()));
      }
    };
  }, [connected, assets.join(","), subscribe, unsubscribe]);

  // Register callback for price updates
  useEffect(() => {
    if (!onUpdate) return;

    const assetSet = new Set(assets.map((a) => a.toLowerCase()));
    const handler = (update: PriceUpdate) => {
      if (assetSet.has(update.symbol.toLowerCase())) {
        onUpdate(update);
      }
    };

    return onPriceUpdate(handler);
  }, [assets.join(","), onUpdate, onPriceUpdate]);
}

/**
 * Hook to receive market updates.
 * Safe to use outside HauntSocketProvider (will be a no-op).
 */
export function useMarketSubscription(onUpdate?: (update: MarketUpdate) => void) {
  const { onMarketUpdate } = useHauntSocket();

  useEffect(() => {
    if (!onUpdate) return;
    return onMarketUpdate(onUpdate);
  }, [onUpdate, onMarketUpdate]);
}
