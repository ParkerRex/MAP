import type { Context, Next } from "hono";
import type { Bindings } from "../types";

export async function authMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next,
) {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey || apiKey !== c.env.API_SECRET_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}
