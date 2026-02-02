/**
 * AuthContext
 *
 * Manages user authentication using crypto wallet keypairs.
 * Generates ed25519-style keypairs for signing requests.
 * Stores private key in localStorage for testing.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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

type AuthContextType = {
  user: User | null;
  privateKey: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  createAccount: () => Promise<void>;
  logout: () => void;
  importPrivateKey: (key: string) => Promise<void>;
  exportPrivateKey: () => string | null;
  signRequest: (message: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_PRIVATE = "wraith_private_key";
const STORAGE_KEY_USER = "wraith_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedPrivateKey = localStorage.getItem(STORAGE_KEY_PRIVATE);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);

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
    localStorage.removeItem(STORAGE_KEY_PRIVATE);
    localStorage.removeItem(STORAGE_KEY_USER);
    setPrivateKey(null);
    setUser(null);
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        privateKey,
        isAuthenticated: !!user,
        loading,
        createAccount,
        logout,
        importPrivateKey,
        exportPrivateKey,
        signRequest,
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
