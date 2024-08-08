import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { GoogleCalendarProvider } from "@/providers/googlecalendar/googlecalendar-provider";
import { createErrorResponse } from "@/utils/error";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import {
  AclRequestSchema,
  AclResponseSchema,
  CalendarListRequestSchema,
  CalendarListResponseSchema,
  CalendarRequestSchema,
  CalendarResponseSchema,
  ChannelRequestSchema,
  ChannelResponseSchema,
  ColorsResponseSchema,
  EventRequestSchema,
  EventResponseSchema,
  FreeBusyRequestSchema,
  FreeBusyResponseSchema,
  SettingRequestSchema,
  SettingResponseSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

function getGoogleCalendarProvider(
  c: Context<{ Bindings: Bindings }>,
): GoogleCalendarProvider {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = c.env;
  const refreshToken = ""; // You need to implement a way to get the refresh token

  return new GoogleCalendarProvider({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    refreshToken,
    kv: c.env.KV,
  });
}

// ACL routes
app.openapi(
  createRoute({
    method: "get",
    path: "/acl/{calendarId}/{ruleId}",
    request: {
      params: AclRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: AclResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = c.req.valid("param");
    try {
      const response = await provider.getAcl(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement other ACL routes (list, insert, update, delete) similarly

// Calendar List routes
app.openapi(
  createRoute({
    method: "get",
    path: "/calendar-list/{calendarId}",
    request: {
      params: CalendarListRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: CalendarListResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = c.req.valid("param");
    try {
      const response = await provider.getCalendarList(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement other Calendar List routes (list, insert, update, delete) similarly

// Calendars routes
app.openapi(
  createRoute({
    method: "get",
    path: "/calendars/{calendarId}",
    request: {
      params: CalendarRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: CalendarResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = c.req.valid("param");
    try {
      const response = await provider.getCalendar(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement other Calendars routes (insert, update, delete) similarly

// Events routes
app.openapi(
  createRoute({
    method: "get",
    path: "/events/{calendarId}/{eventId}",
    request: {
      params: EventRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: EventResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = c.req.valid("param");
    try {
      const response = await provider.getEvent(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement other Events routes (list, insert, update, delete) similarly

// Colors route
app.openapi(
  createRoute({
    method: "get",
    path: "/colors",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ColorsResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    try {
      const response = await provider.getColors();
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// FreeBusy route
app.openapi(
  createRoute({
    method: "post",
    path: "/freebusy",
    request: {
      body: {
        content: {
          "application/json": {
            schema: FreeBusyRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: FreeBusyResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = await c.req.json();
    try {
      const response = await provider.queryFreebusy(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Settings routes
app.openapi(
  createRoute({
    method: "get",
    path: "/settings/{setting}",
    request: {
      params: SettingRequestSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: SettingResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = c.req.valid("param");
    try {
      const response = await provider.getSetting(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement Settings list route similarly

// Channel routes
app.openapi(
  createRoute({
    method: "post",
    path: "/channels/watch",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ChannelRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: ChannelResponseSchema,
          },
        },
        description: "Successful response",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Bad request",
      },
    },
  }),
  async (c) => {
    const provider = getGoogleCalendarProvider(c);
    const params = await c.req.json();
    try {
      const response = await provider.watchCalendar(params);
      return c.json(response);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.req.id);
      return c.json(errorResponse, 400);
    }
  },
);

// Implement Channel stop route similarly

export { app as googleCalendarRoutes };
