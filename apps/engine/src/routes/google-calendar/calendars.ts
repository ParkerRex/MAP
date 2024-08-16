import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { CalendarSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getCalendarRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
      description: "Successfully retrieved calendar",
    },
  },
});

router.openapi(getCalendarRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarSchema, () =>
    provider.getCalendar(calendarId),
  );
});

const insertCalendarRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
      description: "Successfully inserted calendar",
    },
  },
});

router.openapi(insertCalendarRoute, async (c) => {
  const calendar = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarSchema, () =>
    provider.insertCalendar(calendar),
  );
});

const updateCalendarRoute = createRoute({
  method: "put",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
      description: "Successfully updated calendar",
    },
  },
});

router.openapi(updateCalendarRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const calendar = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarSchema, () =>
    provider.updateCalendar(calendarId, calendar),
  );
});

const deleteCalendarRoute = createRoute({
  method: "delete",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted calendar",
    },
  },
});

router.openapi(deleteCalendarRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  await provider.deleteCalendar(calendarId);
  return c.json(null, 204);
});

const clearCalendarRoute = createRoute({
  method: "post",
  path: "/{calendarId}/clear",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Successfully cleared calendar",
    },
  },
});

router.openapi(clearCalendarRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  await provider.clearCalendar(calendarId);
  return c.json(null, 204);
});

export { router };
