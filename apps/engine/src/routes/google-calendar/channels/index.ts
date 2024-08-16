import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { ChannelSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const stopChannelRoute = createRoute({
  method: "post",
  path: "/stop",
  summary: "Stop channel",
  description: "Stops a channel that was previously created",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChannelSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Successfully stopped channel",
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

app.openapi(stopChannelRoute, async (c) => {
  try {
    const channel = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    await provider.stopChannel(channel);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to stop channel",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
