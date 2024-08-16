import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { CyclesResponseSchema, GetCyclesSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getCyclesRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: GetCyclesSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CyclesResponseSchema,
        },
      },
      description: "Successfully retrieved cycles",
    },
  },
});

router.openapi(getCyclesRoute, async (c) => {
  const { accessToken, start, end } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, CyclesResponseSchema, async () => ({
    data: await provider.getCycles(accessToken, start, end),
  }));
});

export { router };
