/**
 * AuthContext
 *
 * Manages user authentication using crypto wallet keypairs.
 * Generates ed25519-style keypairs for signing requests.
 * Stores private key in localStorage for testing.
 *
 * Backend authentication flow:
 * 1. Get challenge from server
 * 2. Sign challenge with private key
 * 3. Verify signature with server
 * 4. Receive session token
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import type { Profile as ServerProfile } from "../services/haunt";

// Simple crypto utilities using Web Crypto API
async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  // Generate a random 32-byte seed
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);

  // For simplicity, derive public key as a hash of private key
  // In production, use proper ed25519 or secp256k1 libraries
  const hashBuffer = await crypto.subtle.digest("SHA-256", privateKeyBytes);
  const publicKeyBytes = new Uint8Array(hashBuffer);

  // Convert to hex strings
  const privateKey = Array.from(privateKeyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const publicKey = Array.from(publicKeyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { publicKey, privateKey };
}

async function signMessage(privateKey: string, message: string): Promise<string> {
  // Simple HMAC-based signature for testing
  // In production, use proper ed25519 signing
  const encoder = new TextEncoder();
  const keyBytes = new Uint8Array(
    privateKey.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type User = {
  publicKey: string;
  createdAt: number;
};

/** Login progress steps */
export type LoginStep =
  | "idle"
  | "requesting_challenge"
  | "signing"
  | "verifying"
  | "loading_profile"
  | "success"
  | "error";

/** Login step labels for display */
export const LOGIN_STEP_LABELS: Record<LoginStep, string> = {
  idle: "Ready",
  requesting_challenge: "Requesting challenge...",
  signing: "Signing...",
  verifying: "Verifying...",
  loading_profile: "Loading profile...",
  success: "Connected!",
  error: "Failed",
};

type AuthContextType = {
  user: User | null;
  privateKey: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Backend session state
  sessionToken: string | null;
  serverProfile: ServerProfile | null;
  isConnectedToServer: boolean;
  loginStep: LoginStep;
  loginError: string | null;
  // Actions
  createAccount: () => Promise<void>;
  logout: () => void;
  importPrivateKey: (key: string) => Promise<void>;
  exportPrivateKey: () => string | null;
  signRequest: (message: string) => Promise<string | null>;
  loginToBackend: () => Promise<void>;
  disconnectFromServer: () => void;
  // Profile actions
  updateUsername: (username: string) => Promise<void>;
  updateLeaderboardVisibility: (show: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_PRIVATE = "wraith_private_key";
const STORAGE_KEY_USER = "wraith_user";
const STORAGE_KEY_SESSION = "wraith_session_token";
const STORAGE_KEY_SERVER_PROFILE = "wraith_server_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Backend session state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [serverProfile, setServerProfile] = useState<ServerProfile | null>(null);
  const [loginStep, setLoginStep] = useState<LoginStep>("idle");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedPrivateKey = localStorage.getItem(STORAGE_KEY_PRIVATE);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    const storedServerProfile = localStorage.getItem(STORAGE_KEY_SERVER_PROFILE);

    if (storedPrivateKey && storedUser) {
      try {
        setPrivateKey(storedPrivateKey);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(STORAGE_KEY_PRIVATE);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }

    // Restore session if available
    if (storedSession && storedServerProfile) {
      try {
        setSessionToken(storedSession);
        setServerProfile(JSON.parse(storedServerProfile));
        setLoginStep("success");
      } catch (e) {
        console.error("Failed to parse stored session:", e);
        localStorage.removeItem(STORAGE_KEY_SESSION);
        localStorage.removeItem(STORAGE_KEY_SERVER_PROFILE);
      }
    }

    setLoading(false);
  }, []);

  const createAccount = useCallback(async () => {
    try {
      const { publicKey, privateKey: newPrivateKey } = await generateKeyPair();

      const newUser: User = {
        publicKey,
        createdAt: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_PRIVATE, newPrivateKey);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

      setPrivateKey(newPrivateKey);
      setUser(newUser);
    } catch (e) {
      console.error("Failed to create account:", e);
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear local account
    localStorage.removeItem(STORAGE_KEY_PRIVATE);
    localStorage.removeItem(STORAGE_KEY_USER);
    setPrivateKey(null);
    setUser(null);

    // Clear server session
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_SERVER_PROFILE);
    setSessionToken(null);
    setServerProfile(null);
    setLoginStep("idle");
    setLoginError(null);
  }, []);

  const disconnectFromServer = useCallback(() => {
    // Only clear server session, keep local account
    if (sessionToken) {
      // Fire and forget logout request
      hauntClient.logout(sessionToken).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_SERVER_PROFILE);
    setSessionToken(null);
    setServerProfile(null);
    setLoginStep("idle");
    setLoginError(null);
  }, [sessionToken]);

  const importPrivateKey = useCallback(async (key: string) => {
    try {
      // Validate key format (64 hex chars = 32 bytes)
      if (!/^[0-9a-f]{64}$/i.test(key)) {
        throw new Error("Invalid private key format. Expected 64 hex characters.");
      }

      // Derive public key from private key
      const keyBytes = new Uint8Array(
        key.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
      );
      const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes);
      const publicKey = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const newUser: User = {
        publicKey,
        createdAt: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_PRIVATE, key);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

      setPrivateKey(key);
      setUser(newUser);
    } catch (e) {
      console.error("Failed to import private key:", e);
      throw e;
    }
  }, []);

  const exportPrivateKey = useCallback(() => {
    return privateKey;
  }, [privateKey]);

  const signRequest = useCallback(async (message: string) => {
    if (!privateKey) return null;
    try {
      return await signMessage(privateKey, message);
    } catch (e) {
      console.error("Failed to sign message:", e);
      return null;
    }
  }, [privateKey]);

  /**
   * Update username on the server
   */
  const updateUsername = useCallback(async (username: string) => {
    if (!sessionToken) {
      throw new Error("Not connected to server");
    }

    const response = await hauntClient.updateUsername(sessionToken, username);
    const updatedProfile = response.data;

    // Update local state
    localStorage.setItem(STORAGE_KEY_SERVER_PROFILE, JSON.stringify(updatedProfile));
    setServerProfile(updatedProfile);
  }, [sessionToken]);

  /**
   * Update leaderboard visibility on the server
   * When opting in, signs a consent message
   */
  const updateLeaderboardVisibility = useCallback(async (show: boolean) => {
    if (!sessionToken || !privateKey) {
      throw new Error("Not connected to server");
    }

    let signature: string | undefined;
    const timestamp = Date.now();

    if (show) {
      // Sign consent message when opting in
      const message = `I consent to showing my trading performance on the Haunt leaderboard. Timestamp: ${timestamp}`;
      signature = await signMessage(privateKey, message);
    }

    const response = await hauntClient.updateLeaderboardVisibility(
      sessionToken,
      show,
      signature,
      timestamp
    );
    const updatedProfile = response.data;

    // Update local state
    localStorage.setItem(STORAGE_KEY_SERVER_PROFILE, JSON.stringify(updatedProfile));
    setServerProfile(updatedProfile);
  }, [sessionToken, privateKey]);

  /**
   * Login to the backend server.
   * Steps:
   * 1. Request challenge from server
   * 2. Sign challenge with private key
   * 3. Send signed challenge to server
   * 4. Receive session token and profile
   */
  const loginToBackend = useCallback(async () => {
    if (!user || !privateKey) {
      setLoginError("No account found. Create an account first.");
      setLoginStep("error");
      return;
    }

    try {
      setLoginError(null);

      // Step 1: Request challenge
      setLoginStep("requesting_challenge");
      const challengeResponse = await hauntClient.getChallenge();
      const { challenge, timestamp: challengeTimestamp } = challengeResponse.data;

      // Step 2: Sign challenge
      setLoginStep("signing");
      const signature = await signMessage(privateKey, challenge);

      // Step 3: Verify with server
      setLoginStep("verifying");
      const verifyResponse = await hauntClient.verify({
        publicKey: user.publicKey,
        challenge,
        signature,
        timestamp: challengeTimestamp,
      });

      const { sessionToken: token, profile } = verifyResponse.data;

      // Step 4: Store session
      setLoginStep("loading_profile");
      localStorage.setItem(STORAGE_KEY_SESSION, token);
      localStorage.setItem(STORAGE_KEY_SERVER_PROFILE, JSON.stringify(profile));
      setSessionToken(token);
      setServerProfile(profile);

      // Success!
      setLoginStep("success");
    } catch (e) {
      console.error("Login failed:", e);
      setLoginError(e instanceof Error ? e.message : "Login failed");
      setLoginStep("error");
    }
  }, [user, privateKey]);

  // Auto-connect to server when authenticated but not connected
  const autoConnectAttempted = useRef(false);
  useEffect(() => {
    // Only auto-connect if:
    // 1. User is authenticated (has local account)
    // 2. Not currently connected to server
    // 3. Not currently in the middle of a login attempt
    // 4. Haven't already attempted auto-connect this session
    // 5. Initial loading is complete
    const shouldAutoConnect =
      user &&
      privateKey &&
      !sessionToken &&
      loginStep === "idle" &&
      !autoConnectAttempted.current &&
      !loading;

    if (shouldAutoConnect) {
      autoConnectAttempted.current = true;
      console.log("Auto-connecting to server...");
      loginToBackend();
    }
  }, [user, privateKey, sessionToken, loginStep, loading, loginToBackend]);

  // Reset auto-connect flag when user logs out
  useEffect(() => {
    if (!user) {
      autoConnectAttempted.current = false;
    }
  }, [user]);

  // Auto-reconnect when disconnected (with delay to avoid rapid retries)
  useEffect(() => {
    if (user && privateKey && !sessionToken && loginStep === "error") {
      const reconnectTimer = setTimeout(() => {
        console.log("Auto-reconnecting to server after error...");
        setLoginStep("idle");
        setLoginError(null);
        autoConnectAttempted.current = false;
      }, 5000); // Wait 5 seconds before allowing reconnect

      return () => clearTimeout(reconnectTimer);
    }
  }, [user, privateKey, sessionToken, loginStep]);

  return (
    <AuthContext.Provider
      value={{
        user,
        privateKey,
        isAuthenticated: !!user,
        loading,
        // Backend session state
        sessionToken,
        serverProfile,
        isConnectedToServer: !!sessionToken && loginStep === "success",
        loginStep,
        loginError,
        // Actions
        createAccount,
        logout,
        importPrivateKey,
        exportPrivateKey,
        signRequest,
        loginToBackend,
        disconnectFromServer,
        // Profile actions
        updateUsername,
        updateLeaderboardVisibility,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
