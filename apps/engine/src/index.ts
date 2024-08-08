import type { Bindings } from "@/common/bindings";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";
import {
  authMiddleware,
  cacheMiddleware,
  loggingMiddleware,
  securityMiddleware,
} from "./middleware";
import authRoutes from "./routes/auth";
import { googleCalendarRoutes } from "./routes/googlecalendar-routes";

const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    console.log(result);
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 422);
    }
  },
});

app.use("*", requestId());
app.use(authMiddleware);
app.use(securityMiddleware);
app.use(loggingMiddleware);

app.route("/auth", authRoutes);
app.route("/google-calendar", googleCalendarRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

app.get(
  "/",
  swaggerUI({
    url: "/openapi",
  }),
);

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: "Google Calendar API",
  },
});

export default app;
