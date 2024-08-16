import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { FreeBusyRequestSchema, FreeBusyResponseSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const queryFreebusyRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Query freebusy",
  description: "Queries for free/busy time of a set of calendars",
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
      description: "Successfully queried freebusy",
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

app.openapi(queryFreebusyRoute, async (c) => {
  try {
    const request = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.queryFreebusy(request);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to query freebusy",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
