import { z } from "zod";

const envSchema = z.object({
  GOOGLE_CALENDAR_CLIENT_ID: z.string(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string(),
  WHOOP_CLIENT_ID: z.string(),
  WHOOP_CLIENT_SECRET: z.string(),
  API_SECRET_KEY: z.string(),
  KV_NAMESPACE: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  UPSTASH_REDIS_REST_URL: z.string(),
});

export function validateEnv(env: Record<string, string | undefined>) {
  const parsedEnv = Object.fromEntries(
    Object.entries(env).filter(([, value]) => typeof value === "string"),
  );

  try {
    envSchema.parse(parsedEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join("."));
      throw new Error(
        `Missing environment variables: ${missingVars.join(", ")}`,
      );
    }
    throw error;
  }
}
