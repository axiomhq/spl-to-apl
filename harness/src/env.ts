import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    AXIOM_TOKEN: z.string().min(1, "Axiom API token required"),
    AXIOM_DATASET: z.string().min(1, "Axiom dataset name required"),
    AXIOM_URL: z.string().url().optional().default("https://api.axiom.co"),

    AI_GATEWAY_API_KEY: z.string().min(1, "Vercel AI Gateway API key required"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
