import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { CalendarInputSchema, CalendarSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getCalendarRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  summary: "Get calendar",
  description: "Retrieves a specific calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
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

app.openapi(getCalendarRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getCalendar(calendarId);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve calendar",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const insertCalendarRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Insert calendar",
  description: "Creates a new secondary calendar",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalendarInputSchema,
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

app.openapi(insertCalendarRoute, async (c) => {
  try {
    const calendar = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.insertCalendar(calendar);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to insert calendar",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const updateCalendarRoute = createRoute({
  method: "put",
  path: "/{calendarId}",
  summary: "Update calendar",
  description: "Updates a secondary calendar",
  request: {
    params: z.object({
      calendarId: z
        .string()
        .openapi({ example: "calendarId@group.calendar.google.com" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: CalendarInputSchema,
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

app.openapi(updateCalendarRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const calendar = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.updateCalendar(calendarId, calendar);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to update calendar",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const deleteCalendarRoute = createRoute({
  method: "delete",
  path: "/{calendarId}",
  summary: "Delete calendar",
  description: "Deletes a secondary calendar",
  request: {
    params: z.object({
      calendarId: z
        .string()
        .openapi({ example: "calendarId@group.calendar.google.com" }),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted calendar",
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

app.openapi(deleteCalendarRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    await provider.deleteCalendar(calendarId);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to delete calendar",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const clearCalendarRoute = createRoute({
  method: "post",
  path: "/{calendarId}/clear",
  summary: "Clear calendar",
  description: "Clears a primary calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
  },
  responses: {
    204: {
      description: "Successfully cleared calendar",
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

app.openapi(clearCalendarRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    await provider.clearCalendar(calendarId);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to clear calendar",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
