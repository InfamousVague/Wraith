import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@wraith/ghost": path.resolve(__dirname, "../Ghost/src"),
      "react-native": path.resolve(__dirname, "node_modules/react-native-web"),
      "react-native-svg": path.resolve(__dirname, "./src/shims/react-native-svg.tsx"),
    },
    extensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".js"],
  },
  define: {
    __DEV__: JSON.stringify(true),
  },
  optimizeDeps: {
    exclude: ["react-native-svg"],
  },
  server: {
    proxy: {
      "/api/cmc": {
        target: "https://pro-api.coinmarketcap.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cmc/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // API key is added via environment variable
            const apiKey = process.env.VITE_CMC_API_KEY;
            if (apiKey) {
              proxyReq.setHeader("X-CMC_PRO_API_KEY", apiKey);
            }
          });
        },
      },
    },
  },
});
