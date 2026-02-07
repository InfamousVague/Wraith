import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext, type ReactNode } from "react";
import { logger } from "../utils/logger";
import { usePerformance } from "../context/PerformanceContext";
import { useApiServer } from "../context/ApiServerContext";

// Default WebSocket URL when no active server
const DEFAULT_WS_URL = import.meta.env.VITE_HAUNT_WS_URL || "ws://localhost:3001/ws";

// Fetch initial update count from the API
async function fetchInitialUpdateCount(apiUrl: string): Promise<number> {
  try {
    const url = apiUrl ? `${apiUrl}/api/market/stats` : "/api/market/stats";
    const response = await fetch(url);
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

// Trading update types
export type PortfolioUpdate = {
  balance: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalValue: number;
  timestamp: number;
};

export type PositionUpdate = {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
  event: "opened" | "updated" | "closed" | "liquidated";
  timestamp: number;
};

export type OrderUpdate = {
  id: string;
  symbol: string;
  type: "market" | "limit" | "stop_loss" | "take_profit";
  side: "buy" | "sell";
  price?: number;
  size: number;
  filledSize: number;
  status: "pending" | "partial" | "filled" | "cancelled" | "rejected";
  event: "created" | "filled" | "partial" | "cancelled" | "rejected";
  executionPrice?: number;
  fee?: number;
  pnl?: number;
  timestamp: number;
};

export type AlertUpdate = {
  id: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  timestamp: number;
};

// Gridline / Tap Trading event types
export type GridMultiplierUpdateData = {
  symbol: string;
  multipliers: number[][];
  config: {
    symbol: string;
    priceHigh: number;
    priceLow: number;
    rowCount: number;
    colCount: number;
    intervalMs: number;
    rowHeight: number;
    maxLeverage: number;
  };
  currentPrice: number;
  current_price?: number; // Legacy fallback
  current_col_index?: number;
  timestamp: number;
};

export type GridTradePlacedData = {
  position: {
    id: string;
    portfolio_id: string;
    symbol: string;
    row_index: number;
    col_index: number;
    amount: number;
    leverage: number;
    multiplier: number;
    price_low: number;
    price_high: number;
    time_start: number;
    time_end: number;
    status: string;
    created_at: number;
  };
  timestamp: number;
};

export type GridTradeResolvedData = {
  position: {
    id: string;
    status: "won" | "lost";
    result_pnl: number;
  };
  won: boolean;
  payout: number;
  pnl: number;
  timestamp: number;
};

export type GridColumnExpiredData = {
  symbol: string;
  col_index: number;
  time_end: number;
  results: Array<{
    position_id: string;
    won: boolean;
    payout: number;
    pnl: number;
  }>;
  timestamp: number;
};

export type WSMessage =
  | { type: "price_update"; data: PriceUpdate }
  | { type: "market_update"; data: MarketUpdate }
  | { type: "peer_update"; data: PeerUpdate }
  | { type: "portfolio_update"; data: PortfolioUpdate }
  | { type: "position_update"; data: PositionUpdate }
  | { type: "order_update"; data: OrderUpdate }
  | { type: "alert_triggered"; data: AlertUpdate }
  | { type: "grid_multiplier_update"; data: GridMultiplierUpdateData }
  | { type: "gridline_trade_placed"; data: GridTradePlacedData }
  | { type: "gridline_trade_resolved"; data: GridTradeResolvedData }
  | { type: "grid_column_expired"; data: GridColumnExpiredData }
  | { type: "gridline_subscribed" }
  | { type: "gridline_unsubscribed" }
  | { type: "subscribed"; assets: string[] }
  | { type: "unsubscribed"; assets: string[] }
  | { type: "throttle_set"; throttle_ms: number }
  | { type: "peers_subscribed" }
  | { type: "peers_unsubscribed" }
  | { type: "portfolio_subscribed" }
  | { type: "portfolio_unsubscribed" }
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
  onPortfolioUpdate: (callback: (update: PortfolioUpdate) => void) => () => void;
  onPositionUpdate: (callback: (update: PositionUpdate) => void) => () => void;
  onOrderUpdate: (callback: (update: OrderUpdate) => void) => () => void;
  onAlertTriggered: (callback: (update: AlertUpdate) => void) => () => void;
  subscribePeers: () => void;
  unsubscribePeers: () => void;
  subscribePortfolio: (token: string) => void;
  unsubscribePortfolio: () => void;
  // Gridline / Tap Trading
  subscribeGridline: (symbol: string, portfolioId?: string) => void;
  unsubscribeGridline: (symbol: string) => void;
  onGridMultiplierUpdate: (callback: (update: GridMultiplierUpdateData) => void) => () => void;
  onGridTradePlaced: (callback: (update: GridTradePlacedData) => void) => () => void;
  onGridTradeResolved: (callback: (update: GridTradeResolvedData) => void) => () => void;
  onGridColumnExpired: (callback: (update: GridColumnExpiredData) => void) => () => void;
  gridlineSubscribed: boolean;
  peersSubscribed: boolean;
  portfolioSubscribed: boolean;
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
  const [portfolioSubscribed, setPortfolioSubscribed] = useState(false);
  const [gridlineSubscribed, setGridlineSubscribed] = useState(false);

  // Get active server from context
  const { activeServer } = useApiServer();

  // Get performance/throttle settings
  const { throttleMs } = usePerformance();

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const updateCountRef = useRef(0);
  const initialCountLoadedRef = useRef(false);
  const currentThrottleMsRef = useRef(throttleMs);
  const peerCallbacksRef = useRef<Set<(update: PeerUpdate) => void>>(new Set());

  // Compute WebSocket URL from active server
  const wsUrl = useMemo(() => {
    if (activeServer?.wsUrl) {
      return activeServer.wsUrl;
    }
    return DEFAULT_WS_URL;
  }, [activeServer?.wsUrl]);

  // Get API URL for initial count fetch
  const apiUrl = activeServer?.url || "";

  // Fetch initial update count from API on mount or server change
  useEffect(() => {
    fetchInitialUpdateCount(apiUrl).then((count) => {
      if (mountedRef.current) {
        updateCountRef.current = count;
        setUpdateCount(count);
      }
    });
  }, [apiUrl]);

  // Callback registries
  const priceCallbacksRef = useRef<Set<(update: PriceUpdate) => void>>(new Set());
  const marketCallbacksRef = useRef<Set<(update: MarketUpdate) => void>>(new Set());
  const portfolioCallbacksRef = useRef<Set<(update: PortfolioUpdate) => void>>(new Set());
  const positionCallbacksRef = useRef<Set<(update: PositionUpdate) => void>>(new Set());
  const orderCallbacksRef = useRef<Set<(update: OrderUpdate) => void>>(new Set());
  const alertCallbacksRef = useRef<Set<(update: AlertUpdate) => void>>(new Set());

  // Gridline callback registries
  const gridMultiplierCallbacksRef = useRef<Set<(update: GridMultiplierUpdateData) => void>>(new Set());
  const gridTradePlacedCallbacksRef = useRef<Set<(update: GridTradePlacedData) => void>>(new Set());
  const gridTradeResolvedCallbacksRef = useRef<Set<(update: GridTradeResolvedData) => void>>(new Set());
  const gridColumnExpiredCallbacksRef = useRef<Set<(update: GridColumnExpiredData) => void>>(new Set());

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

            case "portfolio_update":
              portfolioCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "position_update":
              positionCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "order_update":
              orderCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "alert_triggered":
              alertCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "peers_subscribed":
              setPeersSubscribed(true);
              logger.data("Haunt WS", { action: "peers_subscribed" });
              break;

            case "peers_unsubscribed":
              setPeersSubscribed(false);
              logger.data("Haunt WS", { action: "peers_unsubscribed" });
              break;

            case "portfolio_subscribed":
              setPortfolioSubscribed(true);
              logger.data("Haunt WS", { action: "portfolio_subscribed" });
              break;

            case "portfolio_unsubscribed":
              setPortfolioSubscribed(false);
              logger.data("Haunt WS", { action: "portfolio_unsubscribed" });
              break;

            // Gridline / Tap Trading events
            case "grid_multiplier_update":
              gridMultiplierCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "gridline_trade_placed":
              gridTradePlacedCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "gridline_trade_resolved":
              gridTradeResolvedCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "grid_column_expired":
              gridColumnExpiredCallbacksRef.current.forEach((cb) => cb(message.data));
              break;

            case "gridline_subscribed":
              setGridlineSubscribed(true);
              logger.data("Haunt WS", { action: "gridline_subscribed" });
              break;

            case "gridline_unsubscribed":
              setGridlineSubscribed(false);
              logger.data("Haunt WS", { action: "gridline_unsubscribed" });
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

  // Track previous wsUrl to detect server changes
  const prevWsUrlRef = useRef(wsUrl);

  useEffect(() => {
    mountedRef.current = true;

    // If wsUrl changed (server switch), close existing connection first
    if (prevWsUrlRef.current !== wsUrl && socketRef.current) {
      logger.data("Haunt WS", { action: "server_change", from: prevWsUrlRef.current, to: wsUrl });
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.close();
      socketRef.current = null;
      setConnected(false);
      setPeersSubscribed(false);
      setSubscriptions([]);
    }
    prevWsUrlRef.current = wsUrl;

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
  }, [connect, wsUrl]);

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

  const onPortfolioUpdate = useCallback((callback: (update: PortfolioUpdate) => void) => {
    portfolioCallbacksRef.current.add(callback);
    return () => {
      portfolioCallbacksRef.current.delete(callback);
    };
  }, []);

  const onPositionUpdate = useCallback((callback: (update: PositionUpdate) => void) => {
    positionCallbacksRef.current.add(callback);
    return () => {
      positionCallbacksRef.current.delete(callback);
    };
  }, []);

  const onOrderUpdate = useCallback((callback: (update: OrderUpdate) => void) => {
    orderCallbacksRef.current.add(callback);
    return () => {
      orderCallbacksRef.current.delete(callback);
    };
  }, []);

  const onAlertTriggered = useCallback((callback: (update: AlertUpdate) => void) => {
    alertCallbacksRef.current.add(callback);
    return () => {
      alertCallbacksRef.current.delete(callback);
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

  const subscribePortfolio = useCallback((token: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "subscribe_portfolio", token }));
    }
  }, []);

  const unsubscribePortfolio = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "unsubscribe_portfolio" }));
    }
  }, []);

  // Gridline / Tap Trading subscribe/unsubscribe
  const subscribeGridline = useCallback((symbol: string, portfolioId?: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "subscribe_gridline",
        symbol,
        portfolio_id: portfolioId,
      }));
    }
  }, []);

  const unsubscribeGridline = useCallback((symbol: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "unsubscribe_gridline",
        symbol,
      }));
    }
  }, []);

  const onGridMultiplierUpdate = useCallback((callback: (update: GridMultiplierUpdateData) => void) => {
    gridMultiplierCallbacksRef.current.add(callback);
    return () => { gridMultiplierCallbacksRef.current.delete(callback); };
  }, []);

  const onGridTradePlaced = useCallback((callback: (update: GridTradePlacedData) => void) => {
    gridTradePlacedCallbacksRef.current.add(callback);
    return () => { gridTradePlacedCallbacksRef.current.delete(callback); };
  }, []);

  const onGridTradeResolved = useCallback((callback: (update: GridTradeResolvedData) => void) => {
    gridTradeResolvedCallbacksRef.current.add(callback);
    return () => { gridTradeResolvedCallbacksRef.current.delete(callback); };
  }, []);

  const onGridColumnExpired = useCallback((callback: (update: GridColumnExpiredData) => void) => {
    gridColumnExpiredCallbacksRef.current.add(callback);
    return () => { gridColumnExpiredCallbacksRef.current.delete(callback); };
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
    onPortfolioUpdate,
    onPositionUpdate,
    onOrderUpdate,
    onAlertTriggered,
    subscribePeers,
    unsubscribePeers,
    subscribePortfolio,
    unsubscribePortfolio,
    subscribeGridline,
    unsubscribeGridline,
    onGridMultiplierUpdate,
    onGridTradePlaced,
    onGridTradeResolved,
    onGridColumnExpired,
    gridlineSubscribed,
    peersSubscribed,
    portfolioSubscribed,
    updateCount,
  }), [connected, subscribe, unsubscribe, setThrottle, subscriptions, error, onPriceUpdate, onMarketUpdate, onPeerUpdate, onPortfolioUpdate, onPositionUpdate, onOrderUpdate, onAlertTriggered, subscribePeers, unsubscribePeers, subscribePortfolio, unsubscribePortfolio, subscribeGridline, unsubscribeGridline, onGridMultiplierUpdate, onGridTradePlaced, onGridTradeResolved, onGridColumnExpired, gridlineSubscribed, peersSubscribed, portfolioSubscribed, updateCount]);

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
  onPortfolioUpdate: () => () => {},
  onPositionUpdate: () => () => {},
  onOrderUpdate: () => () => {},
  onAlertTriggered: () => () => {},
  subscribePeers: () => {},
  unsubscribePeers: () => {},
  subscribePortfolio: () => {},
  unsubscribePortfolio: () => {},
  subscribeGridline: () => {},
  unsubscribeGridline: () => {},
  onGridMultiplierUpdate: () => () => {},
  onGridTradePlaced: () => () => {},
  onGridTradeResolved: () => () => {},
  onGridColumnExpired: () => () => {},
  gridlineSubscribed: false,
  peersSubscribed: false,
  portfolioSubscribed: false,
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

/**
 * Hook to subscribe to portfolio/trading updates.
 * Provides real-time portfolio, position, and order updates.
 * Requires authentication token.
 */
export function useTradingSubscription(
  token: string | null,
  callbacks?: {
    onPortfolioUpdate?: (update: PortfolioUpdate) => void;
    onPositionUpdate?: (update: PositionUpdate) => void;
    onOrderUpdate?: (update: OrderUpdate) => void;
    onAlertTriggered?: (update: AlertUpdate) => void;
  }
) {
  const {
    connected,
    subscribePortfolio,
    unsubscribePortfolio,
    onPortfolioUpdate,
    onPositionUpdate,
    onOrderUpdate,
    onAlertTriggered,
    portfolioSubscribed,
  } = useHauntSocket();

  // Use refs for callbacks to avoid re-registering
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Auto-subscribe when connected and token available
  useEffect(() => {
    if (connected && token && !portfolioSubscribed) {
      subscribePortfolio(token);
    }

    return () => {
      if (portfolioSubscribed) {
        unsubscribePortfolio();
      }
    };
  }, [connected, token, portfolioSubscribed, subscribePortfolio, unsubscribePortfolio]);

  // Register callbacks
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (callbacksRef.current?.onPortfolioUpdate) {
      unsubscribers.push(onPortfolioUpdate(callbacksRef.current.onPortfolioUpdate));
    }
    if (callbacksRef.current?.onPositionUpdate) {
      unsubscribers.push(onPositionUpdate(callbacksRef.current.onPositionUpdate));
    }
    if (callbacksRef.current?.onOrderUpdate) {
      unsubscribers.push(onOrderUpdate(callbacksRef.current.onOrderUpdate));
    }
    if (callbacksRef.current?.onAlertTriggered) {
      unsubscribers.push(onAlertTriggered(callbacksRef.current.onAlertTriggered));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [onPortfolioUpdate, onPositionUpdate, onOrderUpdate, onAlertTriggered]);

  return { portfolioSubscribed };
}
