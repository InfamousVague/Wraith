/**
 * API Server Context
 *
 * Manages connections to multiple Haunt API servers.
 * Supports dynamic server discovery via mesh protocol.
 * Tracks server health, latency, and allows switching between servers.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { HauntClient, type PeerMeshResponse } from "../services/haunt";
import { usePreferenceSyncSafe } from "./PreferenceSyncContext";

export type ServerStatus = "online" | "offline" | "checking";

export type ApiServer = {
  id: string;
  name: string;
  region: string;
  url: string;
  wsUrl: string;
  status: ServerStatus;
  latencyMs: number | null;
  lastChecked: number | null;
  isLocal?: boolean;
  isDiscovered?: boolean;
};

// Mesh discovery response type
type MeshDiscoveryResponse = {
  selfId: string;
  selfRegion: string;
  selfApiUrl: string;
  selfWsUrl: string;
  servers: {
    id: string;
    region: string;
    apiUrl: string;
    wsUrl: string;
    status: string;
    latencyMs?: number;
  }[];
  meshKeyHash: string;
  timestamp: number;
};

// Entry point server for discovery (can be any server in the mesh)
const ENTRY_POINT_URL = import.meta.env.VITE_HAUNT_URL || "";

// Detect if we're on the production site (haunt.st) and use relative URLs
const isProduction = typeof window !== "undefined" && window.location.hostname === "haunt.st";
const wsProtocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";

// Fallback servers if discovery fails
const FALLBACK_SERVERS: Omit<ApiServer, "status" | "latencyMs" | "lastChecked">[] = isProduction
  ? [
      // Production: use HTTPS subdomains
      {
        id: "osaka",
        name: "Osaka",
        region: "Asia Pacific",
        url: "https://osaka.haunt.st",
        wsUrl: "wss://osaka.haunt.st/ws",
      },
      {
        id: "seoul",
        name: "Seoul",
        region: "Asia Pacific",
        url: "https://seoul.haunt.st",
        wsUrl: "wss://seoul.haunt.st/ws",
      },
      {
        id: "nyc",
        name: "New York",
        region: "North America",
        url: "https://nyc.haunt.st",
        wsUrl: "wss://nyc.haunt.st/ws",
      },
    ]
  : [
      // Development/local: use direct server IPs
      {
        id: "local",
        name: "Local",
        region: "Local",
        url: "",
        wsUrl: "ws://localhost:3001/ws",
        isLocal: true,
      },
      {
        id: "osaka",
        name: "Osaka",
        region: "Asia Pacific",
        url: "https://osaka.haunt.st",
        wsUrl: "wss://osaka.haunt.st/ws",
      },
      {
        id: "seoul",
        name: "Seoul",
        region: "Asia Pacific",
        url: "https://seoul.haunt.st",
        wsUrl: "wss://seoul.haunt.st/ws",
      },
      {
        id: "nyc",
        name: "New York",
        region: "North America",
        url: "https://nyc.haunt.st",
        wsUrl: "wss://nyc.haunt.st/ws",
      },
    ];

// Local storage key for cached servers
const SERVERS_CACHE_KEY = "haunt_servers_v2"; // Changed to bust old HTTP URL cache
const SERVERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const AUTO_FASTEST_KEY = "haunt_auto_fastest";
const ACTIVE_SERVER_KEY = "haunt_active_server";

type ApiServerContextType = {
  servers: ApiServer[];
  activeServer: ApiServer | null;
  setActiveServer: (serverId: string) => void;
  refreshServerStatus: () => Promise<void>;
  discoverServers: () => Promise<void>;
  isRefreshing: boolean;
  isDiscovering: boolean;
  hauntClient: HauntClient;
  peerMesh: PeerMeshResponse | null;
  /** Whether auto-select fastest mode is enabled */
  useAutoFastest: boolean;
  /** Enable/disable auto-select fastest mode */
  setUseAutoFastest: (enabled: boolean) => void;
  /** The current fastest server (may differ from active if auto is off) */
  fastestServer: ApiServer | null;
  /** Register callback for server change events (for auto-login) */
  onServerChange: (callback: ((oldServerId: string | null, newServerId: string) => void) | null) => void;
};

const ApiServerContext = createContext<ApiServerContextType | null>(null);

type ApiServerProviderProps = {
  children: ReactNode;
};

export function ApiServerProvider({ children }: ApiServerProviderProps) {
  const [servers, setServers] = useState<ApiServer[]>(() => {
    // Try to load from cache first
    try {
      const cached = localStorage.getItem(SERVERS_CACHE_KEY);
      if (cached) {
        const { servers: cachedServers, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < SERVERS_CACHE_TTL) {
          return cachedServers.map((s: ApiServer) => ({
            ...s,
            status: "checking" as ServerStatus,
            latencyMs: null,
            lastChecked: null,
          }));
        }
      }
    } catch {
      // Ignore cache errors
    }
    // Fall back to default servers
    return FALLBACK_SERVERS.map((s) => ({
      ...s,
      status: "checking" as ServerStatus,
      latencyMs: null,
      lastChecked: null,
    }));
  });
  const [activeServerId, setActiveServerId] = useState<string>(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem(ACTIVE_SERVER_KEY);
      if (saved) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    // In production, default to osaka; in development, default to local
    return isProduction ? "osaka" : "local";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [peerMesh, setPeerMesh] = useState<PeerMeshResponse | null>(null);
  const [useAutoFastest, setUseAutoFastestState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTO_FASTEST_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Preference sync (may not be available during initial load)
  const prefSync = usePreferenceSyncSafe();

  // Track previous server for auto-login detection
  const previousServerIdRef = useRef<string | null>(null);

  // Compute fastest server
  const fastestServer = useMemo(() => {
    const onlineServers = servers.filter(
      (s) => s.status === "online" && s.latencyMs !== null
    );
    if (onlineServers.length === 0) return null;
    return onlineServers.reduce((fastest, current) =>
      (current.latencyMs ?? Infinity) < (fastest.latencyMs ?? Infinity) ? current : fastest
    );
  }, [servers]);

  // Auto-switch to fastest when enabled and latencies change
  const autoFastestRef = useRef(useAutoFastest);
  autoFastestRef.current = useAutoFastest;

  useEffect(() => {
    if (autoFastestRef.current && fastestServer && fastestServer.id !== activeServerId) {
      setActiveServerId(fastestServer.id);
    }
  }, [fastestServer, activeServerId]);

  // Wrapper for setUseAutoFastest that persists to localStorage
  const setUseAutoFastest = useCallback((enabled: boolean) => {
    setUseAutoFastestState(enabled);
    try {
      localStorage.setItem(AUTO_FASTEST_KEY, enabled ? "true" : "false");
    } catch {
      // Ignore storage errors
    }
    // Sync to server if available
    if (prefSync) {
      prefSync.updatePreference("autoFastest", enabled);
    }
    // If enabling, immediately switch to fastest
    if (enabled && fastestServer) {
      setActiveServerId(fastestServer.id);
    }
  }, [fastestServer, prefSync]);

  // Create haunt client for active server
  const hauntClient = useMemo(() => {
    const activeServer = servers.find((s) => s.id === activeServerId);
    const url = activeServer?.url || "";
    return new HauntClient(url);
  }, [activeServerId, servers]);

  // Discover servers from the mesh
  const discoverServers = useCallback(async () => {
    setIsDiscovering(true);
    try {
      // Try entry point first
      let entryUrl = ENTRY_POINT_URL;
      let response: Response | null = null;

      // Try to discover from entry point
      try {
        response = await fetch(`${entryUrl}/api/mesh/servers`);
      } catch {
        // Entry point failed, try fallback servers
        for (const fallback of FALLBACK_SERVERS) {
          if (fallback.url) {
            try {
              response = await fetch(`${fallback.url}/api/mesh/servers`);
              if (response.ok) {
                entryUrl = fallback.url;
                break;
              }
            } catch {
              continue;
            }
          }
        }
      }

      if (response && response.ok) {
        const discovery: MeshDiscoveryResponse = await response.json();

        // Convert discovered servers to our format
        const discoveredServers: ApiServer[] = discovery.servers.map((s) => ({
          id: s.id,
          name: s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/-/g, " "),
          region: s.region,
          url: s.apiUrl,
          wsUrl: s.wsUrl,
          status: s.status === "online" ? "online" : "offline" as ServerStatus,
          latencyMs: s.latencyMs ?? null,
          lastChecked: Date.now(),
          isLocal: s.id === "local" || s.apiUrl.includes("localhost"),
          isDiscovered: true,
        }));

        // Ensure local server is always present (development only)
        if (!isProduction) {
          const hasLocal = discoveredServers.some((s) => s.isLocal);
          if (!hasLocal) {
            discoveredServers.unshift({
              id: "local",
              name: "Local",
              region: "Local",
              url: "",
              wsUrl: "ws://localhost:3001/ws",
              status: "checking",
              latencyMs: null,
              lastChecked: null,
              isLocal: true,
              isDiscovered: false,
            });
          }
        }

        setServers(discoveredServers);

        // Cache the discovered servers
        try {
          localStorage.setItem(
            SERVERS_CACHE_KEY,
            JSON.stringify({
              servers: discoveredServers,
              timestamp: Date.now(),
            })
          );
        } catch {
          // Ignore storage errors
        }
      }
    } catch (error) {
      console.warn("Server discovery failed, using fallback servers:", error);
    } finally {
      setIsDiscovering(false);
    }
  }, []);

  // Check a single server's health and latency
  const checkServer = useCallback(async (server: ApiServer): Promise<Partial<ApiServer>> => {
    const startTime = performance.now();
    try {
      const client = new HauntClient(server.url);
      await client.health();
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: "online",
        latencyMs,
        lastChecked: Date.now(),
      };
    } catch {
      return {
        status: "offline",
        latencyMs: null,
        lastChecked: Date.now(),
      };
    }
  }, []);

  // Refresh status of all servers
  const refreshServerStatus = useCallback(async () => {
    setIsRefreshing(true);

    const updates = await Promise.all(
      servers.map(async (server) => {
        const update = await checkServer(server);
        return { id: server.id, ...update };
      })
    );

    setServers((prev) =>
      prev.map((server) => {
        const update = updates.find((u) => u.id === server.id);
        return update ? { ...server, ...update } : server;
      })
    );

    // Fetch peer mesh from active server
    try {
      const activeServer = servers.find((s) => s.id === activeServerId);
      if (activeServer) {
        const client = new HauntClient(activeServer.url);
        const response = await client.getPeers();
        setPeerMesh(response.data);
      }
    } catch {
      // Peer mesh not available
    }

    setIsRefreshing(false);
  }, [servers, activeServerId, checkServer]);

  // Discover servers on mount
  const discoveryRef = useRef(false);
  useEffect(() => {
    if (!discoveryRef.current) {
      discoveryRef.current = true;
      discoverServers();
    }
  }, [discoverServers]);

  // Check servers on mount and periodically
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fast refresh for local server (every 5 seconds)
  const refreshLocalServer = useCallback(async () => {
    const localServer = servers.find((s) => s.isLocal);
    if (!localServer) return;

    const update = await checkServer(localServer);
    setServers((prev) =>
      prev.map((server) =>
        server.isLocal ? { ...server, ...update } : server
      )
    );
  }, [servers, checkServer]);

  useEffect(() => {
    // Initial status check after a short delay to allow discovery
    const initialTimeout = setTimeout(() => {
      refreshServerStatus();
    }, 500);

    // Refresh all servers every 30 seconds
    intervalRef.current = setInterval(refreshServerStatus, 30000);

    // Fast refresh local server every 5 seconds (for real-time latency in dev)
    if (!isProduction) {
      localIntervalRef.current = setInterval(refreshLocalServer, 5000);
    }

    // Re-discover servers every 5 minutes
    const discoveryInterval = setInterval(discoverServers, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (localIntervalRef.current) {
        clearInterval(localIntervalRef.current);
      }
      clearInterval(discoveryInterval);
    };
  }, [refreshServerStatus, refreshLocalServer, discoverServers]);

  const setActiveServer = useCallback((serverId: string) => {
    // Disable auto-fastest when manually selecting a server
    if (useAutoFastest) {
      setUseAutoFastestState(false);
      try {
        localStorage.setItem(AUTO_FASTEST_KEY, "false");
      } catch {
        // Ignore storage errors
      }
    }
    // Persist to localStorage for reload recovery
    try {
      localStorage.setItem(ACTIVE_SERVER_KEY, serverId);
    } catch {
      // Ignore storage errors
    }
    // Sync preferred server to backend
    if (prefSync) {
      prefSync.updatePreference("preferredServer", serverId);
    }
    setActiveServerId(serverId);
  }, [useAutoFastest, prefSync]);

  const activeServer = servers.find((s) => s.id === activeServerId) || null;

  // Apply server preferences when they arrive (autoFastest and preferredServer)
  useEffect(() => {
    if (prefSync?.serverPreferences) {
      const serverPrefs = prefSync.serverPreferences;
      const localPrefs = localStorage.getItem("wraith_user_preferences");
      let localUpdatedAt = 0;
      if (localPrefs) {
        try {
          localUpdatedAt = JSON.parse(localPrefs).updatedAt || 0;
        } catch {}
      }
      const serverUpdatedAt = serverPrefs.updatedAt || 0;

      // Only apply if server is newer
      if (serverUpdatedAt > localUpdatedAt) {
        if (typeof serverPrefs.autoFastest === "boolean") {
          setUseAutoFastestState(serverPrefs.autoFastest);
        }
        if (serverPrefs.preferredServer && !serverPrefs.autoFastest) {
          // Only set preferred server if auto-fastest is disabled
          const serverExists = servers.some((s) => s.id === serverPrefs.preferredServer);
          if (serverExists) {
            setActiveServerId(serverPrefs.preferredServer);
            // Also persist to localStorage for reload recovery
            try {
              localStorage.setItem(ACTIVE_SERVER_KEY, serverPrefs.preferredServer);
            } catch {
              // Ignore storage errors
            }
          }
        }
      }
    }
  }, [prefSync?.serverPreferences, prefSync?.serverPreferences?.updatedAt, servers]);

  // Track server changes for auto-login callback
  const onServerChangeCallbackRef = useRef<((oldServerId: string | null, newServerId: string) => void) | null>(null);

  // Detect server changes and notify
  useEffect(() => {
    const prevId = previousServerIdRef.current;
    if (prevId !== null && prevId !== activeServerId) {
      // Server has changed, trigger callback
      onServerChangeCallbackRef.current?.(prevId, activeServerId);
    }
    previousServerIdRef.current = activeServerId;
  }, [activeServerId]);

  // Register callback for server change events
  const onServerChange = useCallback((callback: ((oldServerId: string | null, newServerId: string) => void) | null) => {
    onServerChangeCallbackRef.current = callback;
  }, []);

  const value = useMemo<ApiServerContextType>(
    () => ({
      servers,
      activeServer,
      setActiveServer,
      refreshServerStatus,
      discoverServers,
      isRefreshing,
      isDiscovering,
      hauntClient,
      peerMesh,
      useAutoFastest,
      setUseAutoFastest,
      fastestServer,
      onServerChange,
    }),
    [servers, activeServer, setActiveServer, refreshServerStatus, discoverServers, isRefreshing, isDiscovering, hauntClient, peerMesh, useAutoFastest, setUseAutoFastest, fastestServer, onServerChange]
  );

  return (
    <ApiServerContext.Provider value={value}>
      {children}
    </ApiServerContext.Provider>
  );
}

export function useApiServer() {
  const context = useContext(ApiServerContext);
  if (!context) {
    throw new Error("useApiServer must be used within an ApiServerProvider");
  }
  return context;
}
