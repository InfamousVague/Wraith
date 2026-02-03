/**
 * @file main.tsx
 * @description Application entry point and root component setup.
 *
 * This file bootstraps the Wraith application by:
 * 1. Initializing i18n for internationalization
 * 2. Setting up the React component tree with all required providers
 * 3. Defining application routes
 *
 * ## Provider Nesting Order (outer to inner):
 *
 * 1. **React.StrictMode** - Development checks for deprecated patterns
 * 2. **BrowserRouter** - Client-side routing (react-router-dom)
 * 3. **ThemeProvider** - Dark/light theme state management
 * 4. **AuthProvider** - Authentication state, login/logout, session tokens
 * 5. **PreferenceSyncProvider** - Cross-server preference synchronization
 * 6. **HintProvider** - Tutorial hints and onboarding state
 * 7. **GhostThemeBridge** - Bridges Wraith theme to Ghost component library
 * 8. **PerformanceProvider** - Performance mode settings (reduced animations)
 * 9. **ApiServerProvider** - API server selection and health checking
 * 10. **HauntSocketProvider** - WebSocket connection to Haunt backend
 *
 * The order matters because inner providers may depend on outer ones:
 * - GhostThemeBridge needs ThemeProvider's theme value
 * - PreferenceSyncProvider needs AuthProvider's session token
 * - HauntSocketProvider needs ApiServerProvider's selected server
 *
 * ## Routes:
 * - `/` - Dashboard (asset list, market overview)
 * - `/asset/:id` - Asset detail page (charts, signals, predictions)
 * - `/profile` - User profile management
 * - `/settings` - Application settings
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { PreferenceSyncProvider } from "./context/PreferenceSyncContext";
import { HintProvider } from "./context/HintContext";
import { PerformanceProvider } from "./context/PerformanceContext";
import { ApiServerProvider } from "./context/ApiServerContext";
import { GhostThemeProvider } from "@wraith/ghost";
import { HauntSocketProvider } from "./hooks/useHauntSocket";
import { Dashboard } from "./pages/Dashboard";
import { AssetDetail } from "./pages/AssetDetail";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { PriceTicker } from "./components/PriceTicker";

/**
 * Bridge component that connects Wraith's theme context to Ghost's theme provider.
 * This is necessary because Ghost is a separate component library with its own
 * theme system. The bridge reads Wraith's theme and passes it to Ghost.
 */
function GhostThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GhostThemeProvider mode={theme}>
      {children}
    </GhostThemeProvider>
  );
}

/**
 * Root application component containing the main layout and routes.
 *
 * Layout structure:
 * - PriceTicker: Scrolling price ticker at the top of every page
 * - Routes: Page content based on current URL path
 *
 * @returns The main application UI wrapped in a flex container
 */
function App() {
  return (
    <View style={{ flex: 1 }}>
      <PriceTicker />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/asset/:id" element={<AssetDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </View>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PreferenceSyncProvider>
            <HintProvider>
              <GhostThemeBridge>
                <PerformanceProvider>
                  <ApiServerProvider>
                    <HauntSocketProvider>
                      <App />
                    </HauntSocketProvider>
                  </ApiServerProvider>
                </PerformanceProvider>
              </GhostThemeBridge>
            </HintProvider>
          </PreferenceSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
