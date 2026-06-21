// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  // plugins: [tsconfigPaths()],
  test: {
    // Your Vitest settings here
  },
});
