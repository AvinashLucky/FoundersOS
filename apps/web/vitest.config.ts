import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest config — mirrors tsconfig's path aliases (vitest doesn't read
 * tsconfig paths on its own) and runs server tests in a Node environment.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@modules": path.resolve(__dirname, "src/modules"),
      "@features": path.resolve(__dirname, "src/features"),
      "@app": path.resolve(__dirname, "src/app"),
    },
  },
});
