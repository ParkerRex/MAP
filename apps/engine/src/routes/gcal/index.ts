import { GoogleCalendarProvider } from "@/providers/calendars/gcal/gcal-provider";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import {
  CalendarListSchema,
  CalendarSchema,
  ColorsSchema,
  EventSchema,
  EventsSchema,
  FreeBusyResponseSchema,
  StopChannelRequestSchema,
  WatchRequestSchema,
  WatchResponseSchema,
} from "./schema";

export const getCalendarListRoute = createRoute({
  method: "get",
  path: "/list",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken, maxResults, syncToken } = c.req.valid("query");
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const calendarList = await api.getCalendarList({ maxResults, syncToken });
      return c.json({ data: calendarList }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  response: {
    200: { schema: CalendarListSchema },
  },
});

export const getEventsRoute = createRoute({
  method: "get",
  path: "/events",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken, calendarId, timeMin, timeMax, syncToken } =
      c.req.valid("query");
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const events = await api.getEvents({
        calendarId,
        timeMin,
        timeMax,
        syncToken,
      });
      return c.json({ data: events }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  response: {
    200: { schema: EventsSchema },
  },
});

export const updateEventRoute = createRoute({
  method: "put",
  path: "/events/:eventId",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { calendarId, eventId } = c.req.param();
    const resource = await c.req.json();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const updatedEvent = await api.updateEvent({
        calendarId,
        eventId,
        resource,
      });
      return c.json({ data: updatedEvent }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  response: {
    200: { schema: EventSchema },
  },
});

export const deleteEventRoute = createRoute({
  method: "delete",
  path: "/events/:eventId",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { calendarId, eventId } = c.req.param();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      await api.deleteEvent({ calendarId, eventId });
      return c.json({ success: true }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
});

export const deleteCalendarRoute = createRoute({
  method: "delete",
  path: "/calendars/:calendarId",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { calendarId } = c.req.param();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      await api.deleteCalendar({ calendarId });
      return c.json({ success: true }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
});

export const updateCalendarRoute = createRoute({
  method: "put",
  path: "/calendars/:calendarId",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { calendarId } = c.req.param();
    const resource = await c.req.json();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const updatedCalendar = await api.updateCalendar({
        calendarId,
        resource,
      });
      return c.json({ data: updatedCalendar }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  response: {
    200: { schema: CalendarSchema },
  },
});

export const getCalendarResourcesRoute = createRoute({
  method: "post",
  path: "/resources",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { timeMin, timeMax, items } = await c.req.json();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const resources = await api.getCalendarResources({
        timeMin,
        timeMax,
        items,
      });
      return c.json({ data: resources }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  response: {
    200: { schema: FreeBusyResponseSchema },
  },
});

export const getColorsRoute = createRoute({
  method: "get",
  path: "/colors",
  handler: async (c) => {
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
  },
  response: {
    200: { schema: ColorsSchema },
  },
});

export const watchEventsRoute = createRoute({
  method: "post",
  path: "/watch",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { calendarId, resource } = await c.req.json();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      const watchResponse = await api.watchEvents({ calendarId, resource });
      return c.json({ data: watchResponse }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  request: {
    body: { content: { "application/json": { schema: WatchRequestSchema } } },
  },
  response: {
    200: { schema: WatchResponseSchema },
  },
});

export const stopChannelRoute = createRoute({
  method: "post",
  path: "/stop-channel",
  handler: async (c) => {
    const envs = env(c);
    const { accessToken } = c.req.valid("query");
    const { id, resourceId } = await c.req.json();
    const api = new GoogleCalendarProvider({ envs, accessToken });

    try {
      await api.stopChannel({ id, resourceId });
      return c.json({ success: true }, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 400);
    }
  },
  request: {
    body: {
      content: { "application/json": { schema: StopChannelRequestSchema } },
    },
  },
});
