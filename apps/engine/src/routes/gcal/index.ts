import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { GoogleCalendarProvider } from "@/providers/calendars/gcal/gcal-provider";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { z } from "zod";
import { GetEventsParamsSchema, GetEventsSchema } from "./schema";
import {
  AclParamsSchema,
  AclSchema,
  CalendarListParamsSchema,
  CalendarListSchema,
  CalendarParamsSchema,
  CalendarSchema,
  ChannelRequestSchema,
  ChannelSchema,
  ColorsSchema,
  CreateEventSchema,
  EventSchema,
  FreeBusyRequestSchema,
  FreeBusySchema,
  SettingsParamsSchema,
  SettingsSchema,
  UpdateEventSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Endpoint for getting events
const getEventsRoute = createRoute({
  method: "get",
  path: "/events",
  summary: "Get Google Calendar events",
  request: {
    query: GetEventsParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetEventsSchema,
        },
      },
      description: "Retrieve Google Calendar events",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getEventsRoute, async (c) => {
  const envs = env(c);
  const { accessToken, timeMin, timeMax } = c.req.valid("query");

  const api = new GoogleCalendarProvider({
    envs,
    accessToken,
  });

  try {
    const events = await api.getEvents({
      accessToken,
      timeMin,
      timeMax,
    });

    return c.json(
      {
        data: events,
      },
      200,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));

    return c.json(errorResponse, 400);
  }
});

// Endpoint for creating an event
const createEventRoute = createRoute({
  method: "post",
  path: "/events",
  summary: "Create a Google Calendar event",
  request: {
    body: CreateEventSchema,
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Event created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(createEventRoute, async (c) => {
  const envs = env(c);
  const { accessToken, event } = c.req.valid("body");

  const api = new GoogleCalendarProvider({
    envs,
    accessToken,
  });

  try {
    const createdEvent = await api.createEvent({
      accessToken,
      event,
    });

    return c.json(
      {
        data: createdEvent,
      },
      201,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));

    return c.json(errorResponse, 400);
  }
});

// Endpoint for updating an event
const updateEventRoute = createRoute({
  method: "put",
  path: "/events/:eventId",
  summary: "Update a Google Calendar event",
  request: {
    params: { eventId: String },
    body: UpdateEventSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EventSchema,
        },
      },
      description: "Event updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(updateEventRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { eventId } = c.req.valid("params");
  const event = c.req.valid("body");

  const api = new GoogleCalendarProvider({
    envs,
    accessToken,
  });

  try {
    const updatedEvent = await api.updateEvent({
      accessToken,
      eventId,
      event,
    });

    return c.json(
      {
        data: updatedEvent,
      },
      200,
    );
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));

    return c.json(errorResponse, 400);
  }
});

// Endpoint for deleting an event
const deleteEventRoute = createRoute({
  method: "delete",
  path: "/events/:eventId",
  summary: "Delete a Google Calendar event",
  request: {
    params: { eventId: String },
  },
  responses: {
    204: {
      description: "Event deleted successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(deleteEventRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { eventId } = c.req.valid("params");

  const api = new GoogleCalendarProvider({
    envs,
    accessToken,
  });

  try {
    await api.deleteEvent({
      accessToken,
      eventId,
    });

    return c.json({}, 204);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));

    return c.json(errorResponse, 400);
  }
});

// ACL routes
const getAclRoute = createRoute({
  method: "get",
  path: "/acl/:calendarId/:ruleId",
  summary: "Get ACL rule",
  request: {
    params: { calendarId: String, ruleId: String },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
      description: "ACL rule retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getAclRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { calendarId, ruleId } = c.req.valid("params");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const aclRule = await api.getAcl({ calendarId, ruleId });
    return c.json({ data: aclRule }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Calendar List routes
const getCalendarListRoute = createRoute({
  method: "get",
  path: "/calendar-list/:calendarId",
  summary: "Get Calendar List entry",
  request: {
    params: { calendarId: String },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarListSchema,
        },
      },
      description: "Calendar List entry retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getCalendarListRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { calendarId } = c.req.valid("params");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const calendarListEntry = await api.getCalendarList({ calendarId });
    return c.json({ data: calendarListEntry }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// ACL routes
const listAclRoute = createRoute({
  method: "get",
  path: "/acl/:calendarId",
  summary: "List ACL rules",
  request: {
    params: { calendarId: String },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(AclSchema),
        },
      },
      description: "ACL rules retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(listAclRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { calendarId } = c.req.valid("params");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const aclRules = await api.listAcl({ calendarId });
    return c.json({ data: aclRules }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Add routes for insertAcl, updateAcl, and deleteAcl
const insertAclRoute = createRoute({
  method: "post",
  path: "/acl/:calendarId",
  summary: "Insert ACL rule",
  request: {
    params: { calendarId: String },
    body: AclSchema,
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
      description: "ACL rule inserted successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(insertAclRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { calendarId } = c.req.valid("params");
  const aclRule = c.req.valid("body");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const insertedAcl = await api.insertAcl({
      calendarId,
      requestBody: aclRule,
    });
    return c.json({ data: insertedAcl }, 201);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Add similar routes for updateAcl and deleteAcl

// Calendar routes
const getCalendarRoute = createRoute({
  method: "get",
  path: "/calendars/:calendarId",
  summary: "Get Calendar",
  request: {
    params: { calendarId: String },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CalendarSchema,
        },
      },
      description: "Calendar retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getCalendarRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { calendarId } = c.req.valid("params");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const calendar = await api.getCalendar({ calendarId });
    return c.json({ data: calendar }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Add routes for createCalendar, updateCalendar, and deleteCalendar

// Colors route
const getColorsRoute = createRoute({
  method: "get",
  path: "/colors",
  summary: "Get color definitions",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColorsSchema,
        },
      },
      description: "Color definitions retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getColorsRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const colors = await api.getColors();
    return c.json({ data: colors }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// FreeBusy route
const queryFreeBusyRoute = createRoute({
  method: "post",
  path: "/freebusy",
  summary: "Query for free/busy time",
  request: {
    body: FreeBusyRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FreeBusySchema,
        },
      },
      description: "Free/busy information retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(queryFreeBusyRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const freeBusyRequest = c.req.valid("body");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const freeBusyResponse = await api.queryFreeBusy(freeBusyRequest);
    return c.json({ data: freeBusyResponse }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Settings routes
const getSettingRoute = createRoute({
  method: "get",
  path: "/settings/:setting",
  summary: "Get a single user setting",
  request: {
    params: { setting: String },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettingsSchema,
        },
      },
      description: "User setting retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getSettingRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");
  const { setting } = c.req.valid("params");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const userSetting = await api.getSetting({ setting });
    return c.json({ data: userSetting }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

const listSettingsRoute = createRoute({
  method: "get",
  path: "/settings",
  summary: "List user settings",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettingsSchema,
        },
      },
      description: "User settings retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(listSettingsRoute, async (c) => {
  const envs = env(c);
  const { accessToken } = c.req.valid("query");

  const api = new GoogleCalendarProvider({ envs, accessToken });

  try {
    const settings = await api.listSettings();
    return c.json({ data: settings }, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

export default app;
