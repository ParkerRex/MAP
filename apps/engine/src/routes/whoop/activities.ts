import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { ActivitiesResponseSchema, GetActivitiesSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getActivitiesRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: GetActivitiesSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ActivitiesResponseSchema,
        },
      },
      description: "Successfully retrieved activities",
    },
  },
});

router.openapi(getActivitiesRoute, async (c) => {
  const { accessToken, start, end } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, ActivitiesResponseSchema, async () => ({
    data: await provider.getActivities(accessToken, start, end),
  }));
});

export { router };
