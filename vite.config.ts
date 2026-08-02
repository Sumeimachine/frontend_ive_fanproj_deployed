import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js is intentionally isolated in a viewport-triggered lazy chunk.
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      "/backend-api": {
        target: "https://api.iveph.com/api",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/backend-api/, ""),
      },
    },
  },
});
