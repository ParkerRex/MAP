import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { GetSleepsSchema, SleepsResponseSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getSleepsRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: GetSleepsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SleepsResponseSchema,
        },
      },
      description: "Successfully retrieved sleeps",
    },
  },
});

router.openapi(getSleepsRoute, async (c) => {
  const { accessToken, start, end } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, SleepsResponseSchema, async () => ({
    data: await provider.getSleeps(accessToken, start, end),
  }));
});

export { router };
