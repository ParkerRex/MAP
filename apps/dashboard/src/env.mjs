import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    VERCEL_URL: z
      .string()
      .optional()
      .transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
  },
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    OPENAI_API_KEY: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    LOOPS_ENDPOINT: z.string().optional(),
    LOOPS_API_KEY: z.string().optional(),
    NOVU_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: z.string().optional(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    VERCEL_URL: process.env.VERCEL_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PORT: process.env.PORT,
    LOOPS_ENDPOINT: process.env.LOOPS_ENDPOINT,
    LOOPS_API_KEY: process.env.LOOPS_API_KEY,
    NOVU_API_KEY: process.env.NOVU_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER:
      process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
