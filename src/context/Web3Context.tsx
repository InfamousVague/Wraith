/**
 * Web3 Context
 *
 * Provides Ethereum wallet connectivity using wagmi and RainbowKit.
 * Supports external wallet connections (MetaMask, WalletConnect) and
 * exposes connection state, address, and signing functions.
 */

import React, { createContext, useContext, useCallback, type ReactNode } from "react";
import { WagmiProvider, useAccount, useSignMessage, useDisconnect, createConfig, http } from "wagmi";
import { mainnet, arbitrum, polygon, optimism, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  getDefaultConfig,
  connectorsForWallets,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import "@rainbow-me/rainbowkit/styles.css";

// Wagmi configuration with supported chains
const config = getDefaultConfig({
  appName: "Wraith",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "wraith-local-dev",
  chains: [mainnet, arbitrum, polygon, optimism, base],
  ssr: false,
});

// Query client for react-query (required by wagmi v2)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
  },
});

/**
 * Web3 context value type.
 */
export type Web3ContextValue = {
  /** Whether a wallet is connected */
  isConnected: boolean;
  /** Whether a connection is in progress */
  isConnecting: boolean;
  /** The connected wallet address (checksummed) */
  address: string | undefined;
  /** Short form of address (0x1234...5678) */
  shortAddress: string | undefined;
  /** Sign a message with the connected wallet */
  signMessage: (message: string) => Promise<string>;
  /** Disconnect the wallet */
  disconnect: () => void;
};

const Web3Context = createContext<Web3ContextValue | null>(null);

/**
 * Hook to access Web3 context.
 */
export function useWeb3(): Web3ContextValue {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

/**
 * Hook to safely access Web3 context (returns null if not in provider).
 */
export function useWeb3Safe(): Web3ContextValue | null {
  return useContext(Web3Context);
}

/**
 * Internal component that provides Web3 context using wagmi hooks.
 */
function Web3ContextProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Shorten address for display
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : undefined;

  // Sign message wrapper with error handling
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!address) {
        throw new Error("No wallet connected");
      }
      const signature = await signMessageAsync({ message });
      return signature;
    },
    [address, signMessageAsync]
  );

  // Disconnect wrapper
  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const value: Web3ContextValue = {
    isConnected,
    isConnecting,
    address,
    shortAddress,
    signMessage,
    disconnect,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

/**
 * Props for the Web3Provider component.
 */
export type Web3ProviderProps = {
  children: ReactNode;
  /** Theme mode for RainbowKit */
  theme?: "dark" | "light";
};

/**
 * Web3 Provider component.
 * Wraps the app with wagmi, react-query, and RainbowKit providers.
 *
 * @example
 * ```tsx
 * <Web3Provider theme="dark">
 *   <App />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({ children, theme = "dark" }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme === "dark" ? darkTheme() : lightTheme()}
          modalSize="compact"
        >
          <Web3ContextProvider>{children}</Web3ContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Export the RainbowKit ConnectButton for use in UI.
 */
export { ConnectButton } from "@rainbow-me/rainbowkit";
