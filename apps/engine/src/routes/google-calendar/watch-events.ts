import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { ChannelSchema, WatchRequestSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const watchEventsRoute = createRoute({
  method: "post",
  path: "/{calendarId}/events/watch",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
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
      description: "Successfully created watch for events",
    },
  },
});

router.openapi(watchEventsRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const requestBody = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, ChannelSchema, () =>
    provider.watchEvents(calendarId, requestBody),
  );
});

export { router };
