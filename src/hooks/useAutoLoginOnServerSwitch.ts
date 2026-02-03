/**
 * useAutoLoginOnServerSwitch Hook
 *
 * Handles automatic re-authentication when the user switches to a different server.
 * When a server change is detected and the user is authenticated, this hook will:
 * 1. Clear the current session
 * 2. Trigger re-authentication to the new server
 *
 * This implements "Option B: Per-server re-auth" from the plan - each server
 * maintains its own sessions, and we perform fresh challenge/verify on switch.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useApiServer } from "../context/ApiServerContext";

/**
 * Hook that automatically re-authenticates when switching servers.
 * Should be used in a component that has access to both AuthContext and ApiServerContext.
 */
export function useAutoLoginOnServerSwitch() {
  const {
    user,
    privateKey,
    authMode,
    sessionToken,
    loginStep,
    loginToBackend,
    disconnectFromServer,
  } = useAuth();
  const { activeServer, onServerChange } = useApiServer();

  // Track if we're in the middle of a server switch re-auth
  const isReAuthenticatingRef = useRef(false);
  const previousServerIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Register callback for server changes
    onServerChange((oldServerId, newServerId) => {
      // Only re-auth if user was authenticated
      const canReAuth =
        user &&
        (privateKey || authMode === "external_wallet") &&
        sessionToken &&
        loginStep === "success";

      if (canReAuth && !isReAuthenticatingRef.current) {
        console.log(`Server changed from ${oldServerId} to ${newServerId}, re-authenticating...`);
        isReAuthenticatingRef.current = true;

        // Clear current session and trigger re-auth
        disconnectFromServer();

        // Small delay to allow state to settle, then re-login
        setTimeout(() => {
          loginToBackend().finally(() => {
            isReAuthenticatingRef.current = false;
          });
        }, 100);
      }
    });

    // Cleanup callback on unmount
    return () => {
      onServerChange(null);
    };
  }, [user, privateKey, authMode, sessionToken, loginStep, loginToBackend, disconnectFromServer, onServerChange]);

  // Also trigger re-auth when activeServer changes and we're logged in but session is cleared
  useEffect(() => {
    const currentServerId = activeServer?.id;
    const previousServerId = previousServerIdRef.current;

    // Detect server change when we have a user but no session (disconnected for re-auth)
    const needsReAuth =
      user &&
      (privateKey || authMode === "external_wallet") &&
      !sessionToken &&
      loginStep === "idle" &&
      currentServerId &&
      previousServerId &&
      currentServerId !== previousServerId &&
      !isReAuthenticatingRef.current;

    if (needsReAuth) {
      console.log(`Detected server switch, triggering re-auth to ${currentServerId}...`);
      isReAuthenticatingRef.current = true;
      loginToBackend().finally(() => {
        isReAuthenticatingRef.current = false;
      });
    }

    previousServerIdRef.current = currentServerId || null;
  }, [activeServer?.id, user, privateKey, authMode, sessionToken, loginStep, loginToBackend]);

  return {
    isReAuthenticating: isReAuthenticatingRef.current,
  };
}
