import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { GhostThemeProvider } from "@wraith/ghost";
import { HauntSocketProvider } from "./hooks/useHauntSocket";
import { Dashboard } from "./pages/Dashboard";
import { AssetDetail } from "./pages/AssetDetail";
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

function App() {
  return (
    <View style={{ flex: 1 }}>
      <PriceTicker />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/asset/:id" element={<AssetDetail />} />
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
          <GhostThemeBridge>
            <HauntSocketProvider>
              <App />
            </HauntSocketProvider>
          </GhostThemeBridge>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
