import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { ChannelSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const stopChannelRoute = createRoute({
  method: "post",
  path: "/stop",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChannelSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Successfully stopped channel",
    },
  },
});

router.openapi(stopChannelRoute, async (c) => {
  const channel = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  await provider.stopChannel(channel);
  return c.json(null, 204);
});

export { router };
