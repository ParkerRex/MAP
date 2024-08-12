import type { Bindings } from "@/common/bindings";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

import { websocketApp } from "./websocket";
const app = new OpenAPIHono<{ Bindings: Bindings }>({
  defaultHook: (result, c) => {
    console.log(result);
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 422);
    }
  },
});

app.route("/api", websocketApp);

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
    title: "Map Engine API",
  },
});

export default app;
