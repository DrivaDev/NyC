import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // next-auth/lib/env.js imports "next/server" without .js extension
      // Vitest ESM requires explicit resolution
      "next/server": path.resolve(__dirname, "./node_modules/next/server.js"),
    },
  },
})
