import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { EventSchema, EventsSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getEventRoute = createRoute({
  method: "get",
  path: "/{calendarId}/{eventId}",
  request: {
    params: z.object({
      calendarId: z.string(),
      eventId: z.string(),
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
  },
});

router.openapi(getEventRoute, async (c) => {
  const { calendarId, eventId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventSchema, () =>
    provider.getEvent(calendarId, eventId),
  );
});

const listEventsRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
    query: z.object({
      timeMin: z.string().optional(),
      timeMax: z.string().optional(),
      maxResults: z.string().optional(),
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
  },
});

router.openapi(listEventsRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const params = c.req.valid("query");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventsSchema, () =>
    provider.listEvents(calendarId, params),
  );
});

const insertEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
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
  },
});

router.openapi(insertEventRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const event = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventSchema, () =>
    provider.insertEvent(calendarId, event),
  );
});

const updateEventRoute = createRoute({
  method: "put",
  path: "/{calendarId}/{eventId}",
  request: {
    params: z.object({
      calendarId: z.string(),
      eventId: z.string(),
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
  },
});

router.openapi(updateEventRoute, async (c) => {
  const { calendarId, eventId } = c.req.valid("param");
  const event = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventSchema, () =>
    provider.updateEvent(calendarId, eventId, event),
  );
});

const deleteEventRoute = createRoute({
  method: "delete",
  path: "/{calendarId}/{eventId}",
  request: {
    params: z.object({
      calendarId: z.string(),
      eventId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted event",
    },
  },
});

router.openapi(deleteEventRoute, async (c) => {
  const { calendarId, eventId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  await provider.deleteEvent(calendarId, eventId);
  return c.json(null, 204);
});

const moveEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}/{eventId}/move",
  request: {
    params: z.object({
      calendarId: z.string(),
      eventId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            destination: z.string(),
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
  },
});

router.openapi(moveEventRoute, async (c) => {
  const { calendarId, eventId } = c.req.valid("param");
  const { destination } = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, EventSchema, () =>
    provider.moveEvent(calendarId, eventId, destination),
  );
});

export { router };
