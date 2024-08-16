import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { FreeBusyRequestSchema, FreeBusyResponseSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const queryFreebusyRoute = createRoute({
  method: "post",
  path: "/",
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
  },
});

router.openapi(queryFreebusyRoute, async (c) => {
  const request = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, FreeBusyResponseSchema, () =>
    provider.queryFreebusy(request),
  );
});

export { router };
