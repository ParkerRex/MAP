import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { ColorsSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getColorsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColorsSchema,
        },
      },
      description: "Successfully retrieved colors",
    },
  },
});

router.openapi(getColorsRoute, async (c) => {
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, ColorsSchema, () => provider.getColors());
});

export { router };
