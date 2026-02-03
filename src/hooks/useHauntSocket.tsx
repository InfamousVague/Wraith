import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext, type ReactNode } from "react";
import { logger } from "../utils/logger";
import { usePerformance } from "../context/PerformanceContext";

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

// Fetch initial update count from the API
async function fetchInitialUpdateCount(): Promise<number> {
  try {
    const response = await fetch("/api/market/stats");
    if (response.ok) {
      const json = await response.json();
      return json.data?.totalUpdates || 0;
    }
  } catch (e) {
    logger.error("Failed to fetch initial update count", e);
  }
  return 0;
}

export type PriceSourceId =
  | "binance"
  | "coinbase"
  | "coinmarketcap"
  | "coingecko"
  | "cryptocompare"
  | "kraken"
  | "kucoin"
  | "okx"
  | "huobi";

export type TradeDirection = "up" | "down";

export type PriceUpdate = {
  id: number;
  symbol: string;
  price: number;
  previousPrice?: number;
  change24h?: number;
  volume24h?: number;
  tradeDirection?: TradeDirection;
  source?: PriceSourceId;
  sources?: PriceSourceId[];
  timestamp: string;
};

export type MarketUpdate = {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  timestamp: string;
};

export type PeerConnectionStatus = "connected" | "connecting" | "disconnected" | "failed";

export type PeerStatus = {
  id: string;
  region: string;
  status: PeerConnectionStatus;
  latencyMs?: number;
  avgLatencyMs?: number;
  minLatencyMs?: number;
  maxLatencyMs?: number;
  pingCount: number;
  failedPings: number;
  uptimePercent: number;
  lastPingAt?: number;
  lastAttemptAt?: number;
};

export type PeerUpdate = {
  serverId: string;
  serverRegion: string;
  peers: PeerStatus[];
  timestamp: number;
};

export type WSMessage =
  | { type: "price_update"; data: PriceUpdate }
  | { type: "market_update"; data: MarketUpdate }
  | { type: "peer_update"; data: PeerUpdate }
  | { type: "subscribed"; assets: string[] }
  | { type: "unsubscribed"; assets: string[] }
  | { type: "throttle_set"; throttle_ms: number }
  | { type: "peers_subscribed" }
  | { type: "peers_unsubscribed" }
  | { type: "error"; error: string };

type HauntSocketContextType = {
  connected: boolean;
  subscribe: (assets: string[]) => void;
  unsubscribe: (assets?: string[]) => void;
  setThrottle: (throttleMs: number) => void;
  subscriptions: string[];
  error: string | null;
  onPriceUpdate: (callback: (update: PriceUpdate) => void) => () => void;
  onMarketUpdate: (callback: (update: MarketUpdate) => void) => () => void;
  onPeerUpdate: (callback: (update: PeerUpdate) => void) => () => void;
  subscribePeers: () => void;
  unsubscribePeers: () => void;
  peersSubscribed: boolean;
  updateCount: number;
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
  const [updateCount, setUpdateCount] = useState(0);
  const [peersSubscribed, setPeersSubscribed] = useState(false);

  // Get performance/throttle settings
  const { throttleMs } = usePerformance();

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const updateCountRef = useRef(0);
  const initialCountLoadedRef = useRef(false);
  const currentThrottleMsRef = useRef(throttleMs);
  const peerCallbacksRef = useRef<Set<(update: PeerUpdate) => void>>(new Set());

  // Compute WebSocket URL once
  const wsUrl = useMemo(() => getWebSocketUrl(), []);

  // Fetch initial update count from API on mount
  useEffect(() => {
    if (initialCountLoadedRef.current) return;
    initialCountLoadedRef.current = true;

    fetchInitialUpdateCount().then((count) => {
      if (mountedRef.current) {
        updateCountRef.current = count;
        setUpdateCount(count);
      }
    });
  }, []);

  // Callback registries
  const priceCallbacksRef = useRef<Set<(update: PriceUpdate) => void>>(new Set());
  const marketCallbacksRef = useRef<Set<(update: MarketUpdate) => void>>(new Set());

  const connect = useCallback(() => {
    // Don't connect if already open or connecting
    const state = socketRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
      return;
    }

    // Clean up any existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      if (state !== WebSocket.CLOSED) {
        socketRef.current.close();
      }
      socketRef.current = null;
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

        // Send current throttle setting to server
        const currentThrottle = currentThrottleMsRef.current;
        if (currentThrottle > 0) {
          ws.send(JSON.stringify({ type: "set_throttle", throttle_ms: currentThrottle }));
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message = JSON.parse(event.data) as WSMessage;

          switch (message.type) {
            case "price_update":
              // Increment update count and dispatch to callbacks
              // Server handles throttling, so we just pass through
              updateCountRef.current += 1;
              setUpdateCount(updateCountRef.current);
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

            case "throttle_set":
              logger.data("Haunt WS", { action: "throttle_set", throttle_ms: message.throttle_ms });
              break;

            case "peer_update":
              peerCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "peers_subscribed":
              setPeersSubscribed(true);
              logger.data("Haunt WS", { action: "peers_subscribed" });
              break;

            case "peers_unsubscribed":
              setPeersSubscribed(false);
              logger.data("Haunt WS", { action: "peers_unsubscribed" });
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
        reconnectTimeoutRef.current = undefined;
      }
      if (socketRef.current) {
        // Clear handlers to prevent callbacks after unmount
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
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

  const setThrottle = useCallback((newThrottleMs: number) => {
    currentThrottleMsRef.current = newThrottleMs;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "set_throttle", throttle_ms: newThrottleMs }));
    }
  }, []);

  // Send throttle update to server when throttleMs changes
  useEffect(() => {
    if (connected && throttleMs !== currentThrottleMsRef.current) {
      setThrottle(throttleMs);
    }
  }, [connected, throttleMs, setThrottle]);

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

  const onPeerUpdate = useCallback((callback: (update: PeerUpdate) => void) => {
    peerCallbacksRef.current.add(callback);
    return () => {
      peerCallbacksRef.current.delete(callback);
    };
  }, []);

  const subscribePeers = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "subscribe_peers" }));
    }
  }, []);

  const unsubscribePeers = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "unsubscribe_peers" }));
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo<HauntSocketContextType>(() => ({
    connected,
    subscribe,
    unsubscribe,
    setThrottle,
    subscriptions,
    error,
    onPriceUpdate,
    onMarketUpdate,
    onPeerUpdate,
    subscribePeers,
    unsubscribePeers,
    peersSubscribed,
    updateCount,
  }), [connected, subscribe, unsubscribe, setThrottle, subscriptions, error, onPriceUpdate, onMarketUpdate, onPeerUpdate, subscribePeers, unsubscribePeers, peersSubscribed, updateCount]);

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
  setThrottle: () => {},
  subscriptions: [],
  error: null,
  onPriceUpdate: () => () => {},
  onMarketUpdate: () => () => {},
  onPeerUpdate: () => () => {},
  subscribePeers: () => {},
  unsubscribePeers: () => {},
  peersSubscribed: false,
  updateCount: 0,
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

  // Memoize normalized asset list to prevent dependency changes
  const assetKey = assets.map((a) => a.toLowerCase()).join(",");
  const normalizedAssets = useMemo(
    () => assets.map((a) => a.toLowerCase()),
    [assetKey]
  );

  // Subscribe when connected and assets change
  useEffect(() => {
    if (connected && normalizedAssets.length > 0) {
      subscribe(normalizedAssets);
    }

    return () => {
      if (normalizedAssets.length > 0) {
        unsubscribe(normalizedAssets);
      }
    };
  }, [connected, normalizedAssets, subscribe, unsubscribe]);

  // Use ref for onUpdate to avoid re-registering on every render
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Register callback for price updates
  useEffect(() => {
    if (!onUpdateRef.current) return;

    const assetSet = new Set(normalizedAssets);
    const handler = (update: PriceUpdate) => {
      if (assetSet.has(update.symbol.toLowerCase()) && onUpdateRef.current) {
        onUpdateRef.current(update);
      }
    };

    return onPriceUpdate(handler);
  }, [normalizedAssets, onPriceUpdate]);
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

/**
 * Hook to subscribe to peer mesh updates.
 * Provides real-time latency and connectivity info for all peer servers.
 */
export function usePeerSubscription(onUpdate?: (update: PeerUpdate) => void) {
  const { connected, subscribePeers, unsubscribePeers, onPeerUpdate, peersSubscribed } = useHauntSocket();

  // Auto-subscribe when connected
  useEffect(() => {
    if (connected && !peersSubscribed) {
      subscribePeers();
    }

    return () => {
      if (peersSubscribed) {
        unsubscribePeers();
      }
    };
  }, [connected, peersSubscribed, subscribePeers, unsubscribePeers]);

  // Register callback for peer updates
  useEffect(() => {
    if (!onUpdate) return;
    return onPeerUpdate(onUpdate);
  }, [onUpdate, onPeerUpdate]);

  return { peersSubscribed };
}
