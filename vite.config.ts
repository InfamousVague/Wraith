import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@wraith/ghost": path.resolve(__dirname, "../ghost/src"),
      "react-native": path.resolve(__dirname, "node_modules/react-native-web"),
      "react-native-svg": path.resolve(__dirname, "./src/shims/react-native-svg.tsx"),
      // Force all React imports to use Wraith's React (prevents duplicate React issue with Ghost)
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    extensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".js"],
    // Dedupe React to prevent multiple instances
    dedupe: ["react", "react-dom"],
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
  },
  optimizeDeps: {
    exclude: ["react-native-svg"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["lightweight-charts"],
        },
      },
      // Exclude expo-linear-gradient from build as it's not web-compatible
      external: ["expo-linear-gradient"],
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    target: "esnext",
    sourcemap: false,
  },
  esbuild: {
    treeShaking: true,
  },
  server: {
    fs: {
      // Allow serving files from the Ghost design system
      allow: [
        path.resolve(__dirname, "."),
        path.resolve(__dirname, "../ghost"),
      ],
    },
    proxy: {
      // All API requests go through Haunt backend
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      // Proxy also works in preview mode
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
