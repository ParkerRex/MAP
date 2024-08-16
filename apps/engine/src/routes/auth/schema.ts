import { z } from "@hono/zod-openapi";

export const GoogleAuthSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

export const GoogleAuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

export const WhoopAuthSchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

export const WhoopAuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
  provider: z.enum(["google", "whoop"]),
});

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});
