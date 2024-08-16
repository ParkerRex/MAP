import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { EventInstancesSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getEventInstancesRoute = createRoute({
  method: "get",
  path: "/{calendarId}/events/{eventId}/instances",
  request: {
    params: z.object({
      calendarId: z.string(),
      eventId: z.string(),
    }),
    query: z.object({
      maxResults: z.string().optional(),
      originalStart: z.string().optional(),
      pageToken: z.string().optional(),
      timeMax: z.string().optional(),
      timeMin: z.string().optional(),
      timeZone: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventInstancesSchema,
        },
      },
      description: "Successfully retrieved event instances",
    },
  },
});

router.openapi(getEventInstancesRoute, async (c) => {
  const { calendarId, eventId } = c.req.valid("param");
  const params = c.req.valid("query");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventInstancesSchema, () =>
    provider.getEventInstances(calendarId, eventId, params),
  );
});

export { router };
