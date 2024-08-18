import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import {
  CalendarListEntryInputSchema,
  CalendarListEntrySchema,
  CalendarListSchema,
  ChannelSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getCalendarListRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get calendar list",
  description: "Retrieves the list of calendars for the authenticated user",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListSchema,
        },
      },
      description: "Successfully retrieved calendar list",
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

app.openapi(getCalendarListRoute, async (c) => {
  try {
    const provider = new GoogleCalendarProvider(c);
    const result = await provider.getCalendarList();
    return c.json(
      {
        data: {
          kind: "calendar#calendarList",
          etag: "",
          items: result,
        },
      },
      200,
    );
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve calendar list",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const getCalendarListEntryRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  summary: "Get calendar list entry",
  description: "Retrieves a specific calendar list entry",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListEntrySchema,
        },
      },
      description: "Successfully retrieved calendar list entry",
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

app.openapi(getCalendarListEntryRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const googleCalendarProvider = new GoogleCalendarProvider(c.env as Bindings);

  try {
    const data = await googleCalendarProvider.getCalendarList(calendarId);
    return c.json(data, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to get calendar list entry",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.env.requestId,
        code: "GOOGLE_CALENDAR_LIST_ERROR",
      },
      400,
    );
  }
});

const insertCalendarListEntryRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Insert calendar list entry",
  description: "Inserts a new calendar into the user's calendar list",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalendarListEntryInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListEntrySchema,
        },
      },
      description: "Successfully inserted calendar list entry",
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

app.openapi(insertCalendarListEntryRoute, async (c) => {
  try {
    const calendarListEntry = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.insertCalendarListEntry(calendarListEntry);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to insert calendar list entry",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const updateCalendarListEntryRoute = createRoute({
  method: "put",
  path: "/{calendarId}",
  summary: "Update calendar list entry",
  description: "Updates an existing calendar list entry",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: CalendarListEntryInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListEntrySchema,
        },
      },
      description: "Successfully updated calendar list entry",
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

app.openapi(updateCalendarListEntryRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const calendarListEntry = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.updateCalendarListEntry(
      calendarId,
      calendarListEntry,
    );
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to update calendar list entry",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const deleteCalendarListEntryRoute = createRoute({
  method: "delete",
  path: "/{calendarId}",
  summary: "Delete calendar list entry",
  description: "Removes a calendar from the user's calendar list",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted calendar list entry",
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

app.openapi(deleteCalendarListEntryRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    await provider.deleteCalendarListEntry(calendarId);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to delete calendar list entry",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const watchCalendarListRoute = createRoute({
  method: "post",
  path: "/watch",
  summary: "Watch calendar list",
  description:
    "Sets up push notifications for changes to the user's calendar list",
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
    200: {
      content: {
        "application/json": {
          schema: ChannelSchema,
        },
      },
      description: "Successfully created watch for calendar list",
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

app.openapi(watchCalendarListRoute, async (c) => {
  try {
    const requestBody = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.watchCalendarList(requestBody);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to create watch for calendar list",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
