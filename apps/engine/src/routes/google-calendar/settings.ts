import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { SettingSchema, SettingsSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getSettingsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(SettingsSchema),
        },
      },
      description: "Successfully retrieved settings",
    },
  },
});

router.openapi(getSettingsRoute, async (c) => {
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, z.array(SettingsSchema), () =>
    provider.getSettings(),
  );
});

const getSettingRoute = createRoute({
  method: "get",
  path: "/{settingId}",
  request: {
    params: z.object({
      settingId: z.string(),
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
  },
});

router.openapi(getSettingRoute, async (c) => {
  const { settingId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, SettingSchema, () => provider.getSetting(settingId));
});

export { router };
