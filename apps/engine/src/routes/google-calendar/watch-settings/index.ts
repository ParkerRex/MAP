import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { ChannelSchema, WatchRequestSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const watchSettingsRoute = createRoute({
  method: "post",
  path: "/watch",
  summary: "Watch settings",
  description: "Creates a new watch for settings changes",
  request: {
    body: {
      content: {
        "application/json": {
          schema: WatchRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ChannelSchema,
        },
      },
      description: "Successfully created watch for settings",
    },
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

app.openapi(watchSettingsRoute, async (c) => {
  try {
    const requestBody = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.watchSettings(requestBody);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to create watch for settings",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
