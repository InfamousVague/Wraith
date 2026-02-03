import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { HintProvider } from "./context/HintContext";
import { PerformanceProvider } from "./context/PerformanceContext";
import { ApiServerProvider } from "./context/ApiServerContext";
import { PreferenceSyncProvider } from "./context/PreferenceSyncContext";
import { Web3Provider } from "./context/Web3Context";
import { GhostThemeProvider } from "@wraith/ghost";
import { HauntSocketProvider } from "./hooks/useHauntSocket";
import { useAutoLoginOnServerSwitch } from "./hooks/useAutoLoginOnServerSwitch";
import { Dashboard } from "./pages/Dashboard";
import { AssetDetail } from "./pages/AssetDetail";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { PriceTicker } from "./components/PriceTicker";

// Bridge component to connect Wraith's theme to Ghost's theme
function GhostThemeBridge({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <GhostThemeProvider mode={theme}>
      {children}
    </GhostThemeProvider>
  );
}

// Component that handles auto-login on server switch
function AutoLoginHandler({ children }: { children: React.ReactNode }) {
  useAutoLoginOnServerSwitch();
  return <>{children}</>;
}

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
      <Web3Provider>
        <ThemeProvider>
          <AuthProvider>
            <HintProvider>
              <GhostThemeBridge>
                <PerformanceProvider>
                  <ApiServerProvider>
                    <PreferenceSyncProvider>
                      <AutoLoginHandler>
                        <HauntSocketProvider>
                          <App />
                        </HauntSocketProvider>
                      </AutoLoginHandler>
                    </PreferenceSyncProvider>
                  </ApiServerProvider>
                </PerformanceProvider>
              </GhostThemeBridge>
            </HintProvider>
          </AuthProvider>
        </ThemeProvider>
      </Web3Provider>
    </BrowserRouter>
  </React.StrictMode>
);
