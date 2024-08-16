import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { EventSchema, EventsSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getEventRoute = createRoute({
  method: "get",
  path: "/{calendarId}/{eventId}",
  summary: "Get event",
  description: "Retrieves an event",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      eventId: z.string().openapi({ example: "eventId" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Successfully retrieved event",
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

app.openapi(getEventRoute, async (c) => {
  try {
    const { calendarId, eventId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getEvent(calendarId, eventId);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const listEventsRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  summary: "List events",
  description: "Retrieves a list of events",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
    query: z.object({
      timeMin: z
        .string()
        .optional()
        .openapi({ example: "2023-01-01T00:00:00Z" }),
      timeMax: z
        .string()
        .optional()
        .openapi({ example: "2023-12-31T23:59:59Z" }),
      maxResults: z.string().optional().openapi({ example: "250" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventsSchema,
        },
      },
      description: "Successfully retrieved events",
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

app.openapi(listEventsRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const params = c.req.valid("query");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.listEvents(calendarId, params);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve events",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const insertEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}",
  summary: "Insert event",
  description: "Creates a new event",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Successfully inserted event",
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

app.openapi(insertEventRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const event = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.insertEvent(calendarId, event);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to insert event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const updateEventRoute = createRoute({
  method: "put",
  path: "/{calendarId}/{eventId}",
  summary: "Update event",
  description: "Updates an existing event",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      eventId: z.string().openapi({ example: "eventId" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Successfully updated event",
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

app.openapi(updateEventRoute, async (c) => {
  try {
    const { calendarId, eventId } = c.req.valid("param");
    const event = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.updateEvent(calendarId, eventId, event);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to update event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const deleteEventRoute = createRoute({
  method: "delete",
  path: "/{calendarId}/{eventId}",
  summary: "Delete event",
  description: "Deletes an event",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      eventId: z.string().openapi({ example: "eventId" }),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted event",
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

app.openapi(deleteEventRoute, async (c) => {
  try {
    const { calendarId, eventId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    await provider.deleteEvent(calendarId, eventId);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to delete event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const moveEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}/{eventId}/move",
  summary: "Move event",
  description: "Moves an event to another calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      eventId: z.string().openapi({ example: "eventId" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            destination: z
              .string()
              .openapi({ example: "destinationCalendarId" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Successfully moved event",
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

app.openapi(moveEventRoute, async (c) => {
  try {
    const { calendarId, eventId } = c.req.valid("param");
    const { destination } = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.moveEvent(calendarId, eventId, destination);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to move event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
