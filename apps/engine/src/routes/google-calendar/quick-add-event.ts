import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { QuickAddEventSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const quickAddEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}/events/quickAdd",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
    query: z.object({
      text: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: QuickAddEventSchema,
        },
      },
      description: "Successfully quick-added event",
    },
  },
});

router.openapi(quickAddEventRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const { text } = c.req.valid("query");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, QuickAddEventSchema, () =>
    provider.quickAddEvent(calendarId, text),
  );
});

export { router };
