// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    exclude: ["dist/**", "node_modules/**", "src/apps/api/e2e/**"],
  },
});
