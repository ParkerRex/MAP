import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Hono } from "hono";
import {
  authMiddleware,
  cacheMiddleware,
  loggingMiddleware,
  securityMiddleware,
} from "./middleware";
import { authRoutes } from "./routes/auth";
import googleCalendarRoutes from "./routes/google-calendar";
import { whoopRoutes } from "./routes/whoop";
import type { Bindings } from "./types";
import { validateEnv } from "./utils/env-validator";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Validate environment variables
app.use("*", async (c, next) => {
  validateEnv(c.env as unknown as Record<string, string | undefined>);
  await next();
});

// Apply authentication middleware (except for auth routes)
app.use("*", async (c, next) => {
  if (!c.req.path.startsWith("/auth")) {
    return authMiddleware(c, next);
  }
  await next();
});

// Apply other middlewares
app.use("*", cacheMiddleware);
app.use("*", securityMiddleware);
app.use("*", loggingMiddleware);

app.use("/swagger", swaggerUI({ url: "/doc" }));

app.route("/auth", authRoutes as unknown as Hono);
app.route("/google-calendar", googleCalendarRoutes);
app.route("/whoop", whoopRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
} as const);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "Calendar and Health API",
    version: "1.0.0",
  },
  security: [{ ApiKeyAuth: [] }],
});

export default app;
