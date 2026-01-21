import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.eval.ts"],
    testTimeout: 60000, // 60s timeout for LLM calls
  },
});
