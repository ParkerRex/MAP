import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { EventInstancesSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getEventInstancesRoute = createRoute({
  method: "get",
  path: "/{calendarId}/events/{eventId}/instances",
  summary: "Get event instances",
  description: "Retrieves instances of a recurring event",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      eventId: z.string().openapi({ example: "eventId" }),
    }),
    query: z.object({
      maxResults: z.string().optional().openapi({ example: "250" }),
      originalStart: z
        .string()
        .optional()
        .openapi({ example: "2023-04-01T10:00:00Z" }),
      pageToken: z.string().optional().openapi({ example: "pageToken" }),
      timeMax: z
        .string()
        .optional()
        .openapi({ example: "2023-12-31T23:59:59Z" }),
      timeMin: z
        .string()
        .optional()
        .openapi({ example: "2023-01-01T00:00:00Z" }),
      timeZone: z
        .string()
        .optional()
        .openapi({ example: "America/Los_Angeles" }),
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

app.openapi(getEventInstancesRoute, async (c) => {
  try {
    const { calendarId, eventId } = c.req.valid("param");
    const params = c.req.valid("query");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getEventInstances(calendarId, eventId, params);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve event instances",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
