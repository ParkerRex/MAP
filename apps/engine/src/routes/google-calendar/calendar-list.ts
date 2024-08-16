import type { Bindings } from "@/common/bindings";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import { handleResponse } from "../../utils/responseHandler";
import {
  CalendarListEntrySchema,
  CalendarListSchema,
  ChannelSchema,
} from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getCalendarListRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListSchema,
        },
      },
      description: "Successfully retrieved calendar list",
    },
  },
});

router.openapi(getCalendarListRoute, async (c) => {
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarListSchema, async () => {
    const result = await provider.getCalendarList();
    return {
      kind: "calendar#calendarList",
      etag: "",
      items: result,
    };
  });
});

const getCalendarListEntryRoute = createRoute({
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
          schema: CalendarListEntrySchema,
        },
      },
      description: "Successfully retrieved calendar list entry",
    },
  },
});

router.openapi(getCalendarListEntryRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarListEntrySchema, () =>
    provider.getCalendarListEntry(calendarId),
  );
});

const insertCalendarListEntryRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalendarListEntrySchema,
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
  },
});

router.openapi(insertCalendarListEntryRoute, async (c) => {
  const calendarListEntry = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarListEntrySchema, () =>
    provider.insertCalendarListEntry(calendarListEntry),
  );
});

const updateCalendarListEntryRoute = createRoute({
  method: "put",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CalendarListEntrySchema,
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
  },
});

router.openapi(updateCalendarListEntryRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const calendarListEntry = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, CalendarListEntrySchema, () =>
    provider.updateCalendarListEntry(calendarId, calendarListEntry),
  );
});

const deleteCalendarListEntryRoute = createRoute({
  method: "delete",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted calendar list entry",
    },
  },
});

router.openapi(deleteCalendarListEntryRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  await provider.deleteCalendarListEntry(calendarId);
  return c.json(null, 204);
});

const watchCalendarListRoute = createRoute({
  method: "post",
  path: "/watch",
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
  },
});

router.openapi(watchCalendarListRoute, async (c) => {
  const requestBody = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, ChannelSchema, () =>
    provider.watchCalendarList(requestBody),
  );
});

export { router };
