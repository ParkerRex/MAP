import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../../types";
import { SettingSchema, SettingsSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getSettingsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get settings",
  description: "Retrieves all calendar settings",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettingsSchema,
        },
      },
      description: "Successfully retrieved settings",
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

app.openapi(getSettingsRoute, async (c) => {
  try {
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getSettings();
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve settings",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const getSettingRoute = createRoute({
  method: "get",
  path: "/{settingId}",
  summary: "Get setting",
  description: "Retrieves a specific calendar setting",
  request: {
    params: z.object({
      settingId: z.string().openapi({ example: "settingId" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettingSchema,
        },
      },
      description: "Successfully retrieved setting",
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

app.openapi(getSettingRoute, async (c) => {
  try {
    const { settingId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getSetting(settingId);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve setting",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
