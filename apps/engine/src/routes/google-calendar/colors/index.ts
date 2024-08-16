import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { ColorsSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getColorsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get colors",
  description: "Retrieves the color definitions for calendars and events",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColorsSchema,
        },
      },
      description: "Successfully retrieved colors",
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

app.openapi(getColorsRoute, async (c) => {
  try {
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getColors();
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve colors",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
