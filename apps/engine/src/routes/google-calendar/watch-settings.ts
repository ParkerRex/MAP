import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { ChannelSchema, WatchRequestSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const watchSettingsRoute = createRoute({
  method: "post",
  path: "/watch",
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
  },
});

router.openapi(watchSettingsRoute, async (c) => {
  const requestBody = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, ChannelSchema, () =>
    provider.watchSettings(requestBody),
  );
});

export { router };
