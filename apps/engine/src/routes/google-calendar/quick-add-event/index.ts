import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { QuickAddEventSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const quickAddEventRoute = createRoute({
  method: "post",
  path: "/{calendarId}/events/quickAdd",
  summary: "Quick add event",
  description: "Quickly adds an event to a calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
    query: z.object({
      text: z.string().openapi({ example: "Dinner with John tomorrow at 7pm" }),
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

app.openapi(quickAddEventRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const { text } = c.req.valid("query");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.quickAddEvent(calendarId, text);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to quick add event",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
