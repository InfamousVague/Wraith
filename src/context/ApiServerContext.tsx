/**
 * API Server Context
 *
 * Manages connections to multiple Haunt API servers.
 * Supports dynamic server discovery via mesh protocol.
 * Tracks server health, latency, and allows switching between servers.
 * Auto-selects the fastest available server by default.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { HauntClient, type PeerMeshResponse } from "../services/haunt";

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
const ENTRY_POINT_WS = import.meta.env.VITE_HAUNT_WS_URL || "ws://localhost:3001/ws";

// Fallback servers if discovery fails
const FALLBACK_SERVERS: Omit<ApiServer, "status" | "latencyMs" | "lastChecked">[] = [
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
    url: "http://64.176.44.233:3001",
    wsUrl: "ws://64.176.44.233:3001/ws",
  },
  {
    id: "seoul",
    name: "Seoul",
    region: "Asia Pacific",
    url: "http://141.164.40.12:3001",
    wsUrl: "ws://141.164.40.12:3001/ws",
  },
  {
    id: "new-york",
    name: "New York",
    region: "North America",
    url: "http://66.135.9.5:3001",
    wsUrl: "ws://66.135.9.5:3001/ws",
  },
];

// Local storage key for cached servers
const SERVERS_CACHE_KEY = "haunt_discovered_servers";
const SERVERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type ApiServerContextType = {
  servers: ApiServer[];
  activeServer: ApiServer | null;
  setActiveServer: (serverId: string) => void;
  autoSelectFastest: boolean;
  setAutoSelectFastest: (auto: boolean) => void;
  refreshServerStatus: () => Promise<void>;
  discoverServers: () => Promise<void>;
  isRefreshing: boolean;
  isDiscovering: boolean;
  hauntClient: HauntClient;
  peerMesh: PeerMeshResponse | null;
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
  const [activeServerId, setActiveServerId] = useState<string>("local");
  const [autoSelectFastest, setAutoSelectFastest] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [peerMesh, setPeerMesh] = useState<PeerMeshResponse | null>(null);

  // Create haunt client for active server - this is the key fix for server switching
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

        // Ensure local server is always present
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

    // If auto-select is enabled, switch to fastest online server
    if (autoSelectFastest) {
      const onlineServers = updates
        .filter((u) => u.status === "online" && u.latencyMs !== null)
        .sort((a, b) => (a.latencyMs || Infinity) - (b.latencyMs || Infinity));

      if (onlineServers.length > 0 && onlineServers[0].id) {
        setActiveServerId(onlineServers[0].id);
      }
    }

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
  }, [servers, autoSelectFastest, activeServerId, checkServer]);

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

  useEffect(() => {
    // Initial status check after a short delay to allow discovery
    const initialTimeout = setTimeout(() => {
      refreshServerStatus();
    }, 500);

    // Refresh every 30 seconds
    intervalRef.current = setInterval(refreshServerStatus, 30000);

    // Re-discover servers every 5 minutes
    const discoveryInterval = setInterval(discoverServers, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(discoveryInterval);
    };
  }, [refreshServerStatus, discoverServers]);

  const setActiveServer = useCallback((serverId: string) => {
    setActiveServerId(serverId);
    // Disable auto-select when manually choosing
    setAutoSelectFastest(false);
  }, []);

  const activeServer = servers.find((s) => s.id === activeServerId) || null;

  const value = useMemo<ApiServerContextType>(
    () => ({
      servers,
      activeServer,
      setActiveServer,
      autoSelectFastest,
      setAutoSelectFastest,
      refreshServerStatus,
      discoverServers,
      isRefreshing,
      isDiscovering,
      hauntClient,
      peerMesh,
    }),
    [servers, activeServer, setActiveServer, autoSelectFastest, refreshServerStatus, discoverServers, isRefreshing, isDiscovering, hauntClient, peerMesh]
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
