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
  },
});
