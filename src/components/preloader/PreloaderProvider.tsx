/**
 * @file PreloaderProvider.tsx
 * @description Context provider that manages the preloading sequence.
 *
 * The preloader runs through these steps:
 * 1. Check server connectivity (health check)
 * 2. Discover mesh servers
 * 3. Check authentication status
 * 4. Login to server (if authenticated locally)
 * 5. Preload user data (portfolio, positions, orders)
 * 6. Initialize WebSocket connection
 * 7. Preload market data
 *
 * Shows the Preloader UI until all steps complete or user skips.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useApiServer } from "../../context/ApiServerContext";
import { useHauntSocket } from "../../hooks/useHauntSocket";
import { hauntClient } from "../../services/haunt";
import { Preloader } from "./Preloader";
import type {
  PreloaderContextValue,
  PreloaderConfig,
  PreloadStep,
  PreloadStatus,
} from "./types";

const PreloaderContext = createContext<PreloaderContextValue | null>(null);

export function usePreloader(): PreloaderContextValue {
  const ctx = useContext(PreloaderContext);
  if (!ctx) {
    throw new Error("usePreloader must be used within PreloaderProvider");
  }
  return ctx;
}

/** Default configuration */
const DEFAULT_CONFIG: PreloaderConfig = {
  minDisplayTime: 1500, // 1.5s minimum for branding
  skipInDev: false,
  debug: false,
};

/** Minimum time to display each step (ms) - gives visual feedback */
const MIN_STEP_DISPLAY_TIME = 50;

/** Step IDs */
const STEP_IDS = {
  SERVER: "server",
  DISCOVER: "discover",
  AUTH_CHECK: "auth_check",
  LOGIN: "login",
  USER_DATA: "user_data",
  WEBSOCKET: "websocket",
  MARKET_DATA: "market_data",
} as const;

type PreloaderProviderProps = {
  children: React.ReactNode;
  config?: PreloaderConfig;
};

export function PreloaderProvider({
  children,
  config: userConfig,
}: PreloaderProviderProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Context hooks
  const {
    isAuthenticated,
    loading: authLoading,
    loginToBackend,
    isConnectedToServer,
  } = useAuth();
  const {
    activeServer,
    servers,
    isRefreshing,
    refreshServerStatus,
    discoverServers,
    isDiscovering,
  } = useApiServer();
  const { connected: wsConnected } = useHauntSocket();

  // Preloader state
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<PreloadStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [steps, setSteps] = useState<PreloadStep[]>([]);

  // Refs for timing and abort
  const startTimeRef = useRef<number>(0);
  const abortRef = useRef(false);
  const hasRunRef = useRef(false);

  // Refs to track latest state (to avoid stale closure issues)
  const activeServerRef = useRef(activeServer);
  const serversRef = useRef(servers);
  const wsConnectedRef = useRef(wsConnected);
  activeServerRef.current = activeServer;
  serversRef.current = servers;
  wsConnectedRef.current = wsConnected;

  // Debug logger
  const log = useCallback(
    (msg: string, ...args: unknown[]) => {
      if (config.debug) {
        console.log(`[Preloader] ${msg}`, ...args);
      }
    },
    [config.debug]
  );

  // Initialize steps based on auth state
  const initializeSteps = useCallback((): PreloadStep[] => {
    const baseSteps: PreloadStep[] = [
      {
        id: STEP_IDS.SERVER,
        label: "Connecting",
        status: "pending",
        required: true,
      },
      {
        id: STEP_IDS.DISCOVER,
        label: "Finding servers",
        status: "pending",
        required: false,
      },
      {
        id: STEP_IDS.AUTH_CHECK,
        label: "Checking auth",
        status: "pending",
        required: false,
      },
    ];

    // Add auth-dependent steps if user is authenticated locally
    if (isAuthenticated) {
      baseSteps.push(
        {
          id: STEP_IDS.LOGIN,
          label: "Logging in",
          status: "pending",
          required: false,
        },
        {
          id: STEP_IDS.USER_DATA,
          label: "Loading data",
          status: "pending",
          required: false,
        }
      );
    }

    baseSteps.push(
      {
        id: STEP_IDS.WEBSOCKET,
        label: "Real-time feed",
        status: "pending",
        required: false,
      },
      {
        id: STEP_IDS.MARKET_DATA,
        label: "Market data",
        status: "pending",
        required: false,
      }
    );

    return baseSteps;
  }, [isAuthenticated]);

  // Update a step's status
  const updateStep = useCallback(
    (
      stepId: string,
      updates: Partial<Pick<PreloadStep, "status" | "detail">>
    ) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        )
      );
    },
    []
  );

  // Run a single step
  const runStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      if (abortRef.current) return false;

      const stepStartTime = Date.now();
      updateStep(stepId, { status: "active" });
      log(`Running step: ${stepId}`);

      // Helper to ensure minimum display time before completing
      const completeWithMinTime = async () => {
        const elapsed = Date.now() - stepStartTime;
        const remaining = MIN_STEP_DISPLAY_TIME - elapsed;
        if (remaining > 0) {
          await new Promise((r) => setTimeout(r, remaining));
        }
      };

      try {
        switch (stepId) {
          case STEP_IDS.SERVER: {
            // Check server connectivity by directly calling health endpoint
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
              if (abortRef.current) return false;

              try {
                await hauntClient.health();
                // Success! Also trigger background refresh of all servers
                refreshServerStatus();

                await completeWithMinTime();
                updateStep(stepId, { status: "completed" });
                return true;
              } catch (err) {
                lastError = err instanceof Error ? err : new Error("Health check failed");
                log(`Health check attempt ${attempt + 1} failed:`, lastError.message);
                // Wait before retry
                if (attempt < maxRetries - 1) {
                  await new Promise((r) => setTimeout(r, 1000));
                }
              }
            }

            throw lastError || new Error("No server available");
          }

          case STEP_IDS.DISCOVER: {
            // Discover mesh servers
            try {
              await discoverServers();
              await completeWithMinTime();
              updateStep(stepId, { status: "completed" });
            } catch {
              // Non-critical, skip
              await completeWithMinTime();
              updateStep(stepId, { status: "skipped" });
            }
            return true;
          }

          case STEP_IDS.AUTH_CHECK: {
            // Wait for auth loading to complete
            if (authLoading) {
              await new Promise((r) => setTimeout(r, 300));
            }
            await completeWithMinTime();
            updateStep(stepId, { status: "completed" });
            return true;
          }

          case STEP_IDS.LOGIN: {
            // Login to backend if not connected
            if (isAuthenticated && !isConnectedToServer) {
              try {
                await loginToBackend();
                await completeWithMinTime();
                updateStep(stepId, { status: "completed" });
              } catch (err) {
                // Non-critical, continue as guest
                log("Login failed:", err);
                await completeWithMinTime();
                updateStep(stepId, { status: "skipped" });
              }
            } else if (isConnectedToServer) {
              await completeWithMinTime();
              updateStep(stepId, { status: "completed" });
            } else {
              await completeWithMinTime();
              updateStep(stepId, { status: "skipped" });
            }
            return true;
          }

          case STEP_IDS.USER_DATA: {
            // Preload user data (portfolio, positions, orders)
            if (isConnectedToServer) {
              try {
                // These calls will cache the data for later use
                await Promise.all([
                  hauntClient.getPortfolioList(),
                  hauntClient.getOpenPositions(),
                  hauntClient.getPendingOrders(),
                ]);
                await completeWithMinTime();
                updateStep(stepId, { status: "completed" });
              } catch (err) {
                log("User data preload failed:", err);
                await completeWithMinTime();
                updateStep(stepId, { status: "skipped" });
              }
            } else {
              await completeWithMinTime();
              updateStep(stepId, { status: "skipped" });
            }
            return true;
          }

          case STEP_IDS.WEBSOCKET: {
            // Wait for WebSocket connection using ref for latest state
            const maxWait = 2000; // Reduced - WS usually connects fast
            const wsStartTime = Date.now();

            while (!wsConnectedRef.current && Date.now() - wsStartTime < maxWait) {
              if (abortRef.current) return false;
              await new Promise((r) => setTimeout(r, 100)); // Poll faster
            }

            await completeWithMinTime();
            if (wsConnectedRef.current) {
              updateStep(stepId, { status: "completed" });
            } else {
              // Non-critical - WS will connect in background
              updateStep(stepId, { status: "skipped" });
            }
            return true;
          }

          case STEP_IDS.MARKET_DATA: {
            // Preload market data - use Promise.race with timeout to avoid blocking
            try {
              const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 2000)
              );
              await Promise.race([
                Promise.all([
                  hauntClient.getGlobalMetrics(),
                  hauntClient.getFearGreedIndex(),
                ]),
                timeout,
              ]);
              await completeWithMinTime();
              updateStep(stepId, { status: "completed" });
            } catch (err) {
              log("Market data preload failed or timed out:", err);
              await completeWithMinTime();
              updateStep(stepId, { status: "skipped" });
            }
            return true;
          }

          default:
            return true;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        log(`Step ${stepId} failed:`, errMsg);
        updateStep(stepId, { status: "failed", detail: errMsg });

        // Check if this step is required
        const step = steps.find((s) => s.id === stepId);
        if (step?.required) {
          throw err;
        }
        return true; // Continue if not required
      }
    },
    [
      activeServer,
      authLoading,
      discoverServers,
      isAuthenticated,
      isConnectedToServer,
      loginToBackend,
      log,
      refreshServerStatus,
      steps,
      updateStep,
      wsConnected,
    ]
  );

  // Run all preload steps
  const runPreload = useCallback(async () => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    log("Starting preload sequence");
    startTimeRef.current = Date.now();
    abortRef.current = false;

    const initialSteps = initializeSteps();
    setSteps(initialSteps);
    setStatus("loading");
    setCurrentStep(0);
    setError(undefined);

    try {
      for (let i = 0; i < initialSteps.length; i++) {
        if (abortRef.current) {
          log("Preload aborted");
          return;
        }

        setCurrentStep(i);
        const success = await runStep(initialSteps[i].id);

        if (!success) {
          return;
        }
      }

      // Ensure minimum display time
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = (config.minDisplayTime || 0) - elapsed;

      if (remaining > 0) {
        log(`Waiting ${remaining}ms for minimum display time`);
        await new Promise((r) => setTimeout(r, remaining));
      }

      log("Preload complete");
      setStatus("complete");

      // Small delay before showing app
      setTimeout(() => {
        setIsReady(true);
      }, 300);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Preload failed";
      log("Preload failed:", errMsg);
      setStatus("error");
      setError(errMsg);
    }
  }, [config.minDisplayTime, initializeSteps, log, runStep]);

  // Retry from current step
  const retry = useCallback(() => {
    log("Retrying from current step");
    hasRunRef.current = false;
    runPreload();
  }, [log, runPreload]);

  // Skip preloading
  const skip = useCallback(() => {
    log("Skipping preload");
    abortRef.current = true;
    setStatus("complete");
    setIsReady(true);
  }, [log]);

  // Restart from beginning
  const restart = useCallback(() => {
    log("Restarting preload");
    hasRunRef.current = false;
    setCurrentStep(0);
    setError(undefined);
    runPreload();
  }, [log, runPreload]);

  // Start preloading on mount
  useEffect(() => {
    // Skip in dev if configured
    if (config.skipInDev && import.meta.env.DEV) {
      log("Skipping preload in development");
      setIsReady(true);
      return;
    }

    // Wait for auth provider to initialize
    if (authLoading) {
      return;
    }

    runPreload();
  }, [authLoading, config.skipInDev, log, runPreload]);

  const contextValue: PreloaderContextValue = {
    isReady,
    status,
    steps,
    currentStep,
    error,
    retry,
    skip,
    restart,
  };

  return (
    <PreloaderContext.Provider value={contextValue}>
      {isReady ? (
        children
      ) : (
        <View style={styles.fullScreen}>
          <Preloader
            steps={steps}
            currentStep={currentStep}
            status={status}
            error={error}
            onRetry={retry}
            onSkip={skip}
          />
        </View>
      )}
    </PreloaderContext.Provider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    height: "100%",
  },
});
