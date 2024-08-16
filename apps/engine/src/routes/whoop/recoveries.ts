import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { GetRecoveriesSchema, RecoveriesResponseSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getRecoveriesRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: GetRecoveriesSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RecoveriesResponseSchema,
        },
      },
      description: "Successfully retrieved recoveries",
    },
  },
});

router.openapi(getRecoveriesRoute, async (c) => {
  const { accessToken, start, end } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, RecoveriesResponseSchema, async () => ({
    data: await provider.getRecoveries(accessToken, start, end),
  }));
});

export { router };
