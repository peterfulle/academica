import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config();

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Tenant-isolation suites share one real Postgres database and each does
    // its own delete-then-seed in beforeAll — running test files in parallel
    // lets one file's cleanup wipe another's in-progress fixtures.
    fileParallelism: false,
  },
});
