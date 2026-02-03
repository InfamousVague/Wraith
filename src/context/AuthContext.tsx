/**
 * AuthContext
 *
 * Manages user authentication with support for:
 * 1. External Ethereum Wallet (MetaMask/WalletConnect) - signs with wallet
 * 2. Local Ethereum Keys - generates and stores keys locally
 * 3. Legacy SHA-256 Keys - backwards compatible with existing accounts
 *
 * Backend authentication flow:
 * 1. Get challenge from server
 * 2. Sign challenge with wallet or local key
 * 3. Verify signature with server (supports both EIP-191 and legacy HMAC)
 * 4. Receive session token
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { hauntClient } from "../services/haunt";
import type { Profile as ServerProfile } from "../services/haunt";
import { useWeb3Safe } from "./Web3Context";

// ============================================================================
// Crypto Utilities
// ============================================================================

/**
 * Generate legacy keypair (SHA-256 based).
 * Kept for backwards compatibility with existing accounts.
 */
async function generateLegacyKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);

  const hashBuffer = await crypto.subtle.digest("SHA-256", privateKeyBytes);
  const publicKeyBytes = new Uint8Array(hashBuffer);

  const privateKey = Array.from(privateKeyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const publicKey = Array.from(publicKeyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { publicKey, privateKey };
}

/**
 * Generate Ethereum keypair using Web Crypto.
 * Returns checksummed address and hex private key.
 */
async function generateEthKeyPair(): Promise<{ address: string; privateKey: string }> {
  // Generate 32 random bytes for private key
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);

  const privateKey = "0x" + Array.from(privateKeyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Derive address from private key using keccak256 of public key
  // For simplicity, use a placeholder address format until ethers is available
  // In production, this would use ethers.Wallet
  const hashBuffer = await crypto.subtle.digest("SHA-256", privateKeyBytes);
  const hashBytes = new Uint8Array(hashBuffer);
  const addressHex = Array.from(hashBytes.slice(0, 20))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Format as checksummed address (simplified - proper checksum uses keccak256)
  const address = "0x" + addressHex;

  return { address, privateKey };
}

/**
 * Sign message with legacy HMAC-SHA256 method.
 */
async function signMessageLegacy(privateKey: string, message: string): Promise<string> {
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

/**
 * Sign message with Ethereum personal_sign (EIP-191).
 * For local keys, uses HMAC-SHA256 with "0x" prefix to distinguish from legacy.
 */
async function signMessageEth(privateKey: string, message: string): Promise<string> {
  // Prefix message per EIP-191
  const prefixedMessage = `\x19Ethereum Signed Message:\n${message.length}${message}`;
  const encoder = new TextEncoder();

  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
  const keyBytes = new Uint8Array(
    cleanKey.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(prefixedMessage));
  // Prefix with 0x to indicate ETH signature format
  return "0x" + Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================================
// Types
// ============================================================================

/** Authentication mode */
export type AuthMode = "external_wallet" | "local_eth_key" | "legacy_key";

/** User account information */
export type User = {
  /** ETH address (0x...) or legacy public key */
  address: string;
  /** Short display form of address */
  shortAddress: string;
  /** Authentication mode used */
  authMode: AuthMode;
  /** Account creation timestamp */
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
  // Auth mode
  authMode: AuthMode | null;
  // Backend session state
  sessionToken: string | null;
  serverProfile: ServerProfile | null;
  isConnectedToServer: boolean;
  loginStep: LoginStep;
  loginError: string | null;
  // Actions
  createAccount: () => Promise<void>;
  createEthAccount: () => Promise<void>;
  connectExternalWallet: () => Promise<void>;
  logout: () => void;
  importPrivateKey: (key: string) => Promise<void>;
  exportPrivateKey: () => string | null;
  signRequest: (message: string) => Promise<string | null>;
  loginToBackend: () => Promise<void>;
  disconnectFromServer: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_PRIVATE = "wraith_private_key";
const STORAGE_KEY_USER = "wraith_user";
const STORAGE_KEY_SESSION = "wraith_session_token";
const STORAGE_KEY_SERVER_PROFILE = "wraith_server_profile";
const STORAGE_KEY_AUTH_MODE = "wraith_auth_mode";

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [loading, setLoading] = useState(true);

  // Backend session state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [serverProfile, setServerProfile] = useState<ServerProfile | null>(null);
  const [loginStep, setLoginStep] = useState<LoginStep>("idle");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Web3 context for external wallet
  const web3 = useWeb3Safe();

  // Shorten address for display
  const shortenAddress = (addr: string): string => {
    if (addr.startsWith("0x") && addr.length >= 42) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    // Legacy key format
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  // Load from localStorage on mount
  useEffect(() => {
    const storedPrivateKey = localStorage.getItem(STORAGE_KEY_PRIVATE);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
    const storedServerProfile = localStorage.getItem(STORAGE_KEY_SERVER_PROFILE);
    const storedAuthMode = localStorage.getItem(STORAGE_KEY_AUTH_MODE) as AuthMode | null;

    if (storedPrivateKey && storedUser) {
      try {
        setPrivateKey(storedPrivateKey);
        setUser(JSON.parse(storedUser));
        setAuthMode(storedAuthMode || "legacy_key");
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem(STORAGE_KEY_PRIVATE);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
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

  // Sync with external wallet connection
  useEffect(() => {
    if (web3?.isConnected && web3.address && authMode === "external_wallet") {
      // Update user if wallet address changed
      if (user?.address !== web3.address) {
        const newUser: User = {
          address: web3.address,
          shortAddress: web3.shortAddress || shortenAddress(web3.address),
          authMode: "external_wallet",
          createdAt: user?.createdAt || Date.now(),
        };
        setUser(newUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      }
    } else if (!web3?.isConnected && authMode === "external_wallet" && user) {
      // Wallet disconnected - clear user if using external wallet
      setUser(null);
      setAuthMode(null);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
    }
  }, [web3?.isConnected, web3?.address, web3?.shortAddress, authMode, user]);

  /**
   * Create legacy account (backwards compatible).
   */
  const createAccount = useCallback(async () => {
    try {
      const { publicKey, privateKey: newPrivateKey } = await generateLegacyKeyPair();

      const newUser: User = {
        address: publicKey,
        shortAddress: shortenAddress(publicKey),
        authMode: "legacy_key",
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY_PRIVATE, newPrivateKey);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, "legacy_key");

      setPrivateKey(newPrivateKey);
      setUser(newUser);
      setAuthMode("legacy_key");
    } catch (e) {
      console.error("Failed to create account:", e);
      throw e;
    }
  }, []);

  /**
   * Create local Ethereum account.
   */
  const createEthAccount = useCallback(async () => {
    try {
      const { address, privateKey: newPrivateKey } = await generateEthKeyPair();

      const newUser: User = {
        address,
        shortAddress: shortenAddress(address),
        authMode: "local_eth_key",
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY_PRIVATE, newPrivateKey);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, "local_eth_key");

      setPrivateKey(newPrivateKey);
      setUser(newUser);
      setAuthMode("local_eth_key");
    } catch (e) {
      console.error("Failed to create ETH account:", e);
      throw e;
    }
  }, []);

  /**
   * Connect external wallet and use for authentication.
   */
  const connectExternalWallet = useCallback(async () => {
    if (!web3) {
      throw new Error("Web3 context not available");
    }

    if (!web3.isConnected || !web3.address) {
      throw new Error("No wallet connected. Please connect a wallet first.");
    }

    const newUser: User = {
      address: web3.address,
      shortAddress: web3.shortAddress || shortenAddress(web3.address),
      authMode: "external_wallet",
      createdAt: Date.now(),
    };

    // Don't store private key for external wallets
    localStorage.removeItem(STORAGE_KEY_PRIVATE);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEY_AUTH_MODE, "external_wallet");

    setPrivateKey(null);
    setUser(newUser);
    setAuthMode("external_wallet");
  }, [web3]);

  const logout = useCallback(() => {
    // Clear local account
    localStorage.removeItem(STORAGE_KEY_PRIVATE);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_AUTH_MODE);
    setPrivateKey(null);
    setUser(null);
    setAuthMode(null);

    // Clear server session
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_SERVER_PROFILE);
    setSessionToken(null);
    setServerProfile(null);
    setLoginStep("idle");
    setLoginError(null);

    // Disconnect external wallet if connected
    if (web3?.isConnected) {
      web3.disconnect();
    }
  }, [web3]);

  const disconnectFromServer = useCallback(() => {
    // Only clear server session, keep local account
    if (sessionToken) {
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
      // Check if it's an ETH key (starts with 0x)
      const isEthKey = key.startsWith("0x");
      const cleanKey = isEthKey ? key.slice(2) : key;

      // Validate key format (64 hex chars = 32 bytes)
      if (!/^[0-9a-f]{64}$/i.test(cleanKey)) {
        throw new Error("Invalid private key format. Expected 64 hex characters.");
      }

      let newUser: User;
      let mode: AuthMode;

      if (isEthKey) {
        // ETH key
        const { address } = await generateEthKeyPair(); // Generate address from key
        const keyBytes = new Uint8Array(
          cleanKey.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
        );
        const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes);
        const hashBytes = new Uint8Array(hashBuffer);
        const addressHex = Array.from(hashBytes.slice(0, 20))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const derivedAddress = "0x" + addressHex;

        newUser = {
          address: derivedAddress,
          shortAddress: shortenAddress(derivedAddress),
          authMode: "local_eth_key",
          createdAt: Date.now(),
        };
        mode = "local_eth_key";
      } else {
        // Legacy key
        const keyBytes = new Uint8Array(
          key.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
        );
        const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes);
        const publicKey = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        newUser = {
          address: publicKey,
          shortAddress: shortenAddress(publicKey),
          authMode: "legacy_key",
          createdAt: Date.now(),
        };
        mode = "legacy_key";
      }

      localStorage.setItem(STORAGE_KEY_PRIVATE, key);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_AUTH_MODE, mode);

      setPrivateKey(key);
      setUser(newUser);
      setAuthMode(mode);
    } catch (e) {
      console.error("Failed to import private key:", e);
      throw e;
    }
  }, []);

  const exportPrivateKey = useCallback(() => {
    return privateKey;
  }, [privateKey]);

  /**
   * Sign a message using the appropriate method for the auth mode.
   */
  const signRequest = useCallback(async (message: string) => {
    if (authMode === "external_wallet") {
      if (!web3?.signMessage) {
        throw new Error("Wallet not connected");
      }
      return web3.signMessage(message);
    }

    if (!privateKey) return null;

    try {
      if (authMode === "local_eth_key") {
        return await signMessageEth(privateKey, message);
      } else {
        return await signMessageLegacy(privateKey, message);
      }
    } catch (e) {
      console.error("Failed to sign message:", e);
      return null;
    }
  }, [privateKey, authMode, web3]);

  /**
   * Login to the backend server.
   */
  const loginToBackend = useCallback(async () => {
    if (!user) {
      setLoginError("No account found. Create an account first.");
      setLoginStep("error");
      return;
    }

    // Validate signing capability
    if (authMode === "external_wallet" && !web3?.isConnected) {
      setLoginError("Wallet not connected.");
      setLoginStep("error");
      return;
    }

    if (authMode !== "external_wallet" && !privateKey) {
      setLoginError("No private key found.");
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
      let signature: string;

      if (authMode === "external_wallet") {
        // Sign with external wallet
        signature = await web3!.signMessage(challenge);
      } else if (authMode === "local_eth_key") {
        // Sign with local ETH key (EIP-191 format)
        signature = await signMessageEth(privateKey!, challenge);
      } else {
        // Sign with legacy method
        signature = await signMessageLegacy(privateKey!, challenge);
      }

      // Step 3: Verify with server
      setLoginStep("verifying");
      const verifyResponse = await hauntClient.verify({
        publicKey: user.address,
        challenge,
        signature,
        timestamp: challengeTimestamp,
        // Include auth mode hint for backend
        signatureType: authMode === "legacy_key" ? "hmac" : "eth",
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
  }, [user, privateKey, authMode, web3]);

  // Auto-connect to server when authenticated but not connected
  const autoConnectAttempted = useRef(false);
  useEffect(() => {
    const shouldAutoConnect =
      user &&
      (privateKey || authMode === "external_wallet") &&
      !sessionToken &&
      loginStep === "idle" &&
      !autoConnectAttempted.current &&
      !loading;

    if (shouldAutoConnect) {
      // For external wallet, only auto-connect if wallet is connected
      if (authMode === "external_wallet" && !web3?.isConnected) {
        return;
      }

      autoConnectAttempted.current = true;
      console.log("Auto-connecting to server...");
      loginToBackend();
    }
  }, [user, privateKey, authMode, sessionToken, loginStep, loading, loginToBackend, web3?.isConnected]);

  // Reset auto-connect flag when user logs out
  useEffect(() => {
    if (!user) {
      autoConnectAttempted.current = false;
    }
  }, [user]);

  // Auto-reconnect when disconnected (with delay to avoid rapid retries)
  useEffect(() => {
    if (user && (privateKey || authMode === "external_wallet") && !sessionToken && loginStep === "error") {
      const reconnectTimer = setTimeout(() => {
        console.log("Auto-reconnecting to server after error...");
        setLoginStep("idle");
        setLoginError(null);
        autoConnectAttempted.current = false;
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [user, privateKey, authMode, sessionToken, loginStep]);

  return (
    <AuthContext.Provider
      value={{
        user,
        privateKey,
        isAuthenticated: !!user,
        loading,
        authMode,
        // Backend session state
        sessionToken,
        serverProfile,
        isConnectedToServer: !!sessionToken && loginStep === "success",
        loginStep,
        loginError,
        // Actions
        createAccount,
        createEthAccount,
        connectExternalWallet,
        logout,
        importPrivateKey,
        exportPrivateKey,
        signRequest,
        loginToBackend,
        disconnectFromServer,
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
