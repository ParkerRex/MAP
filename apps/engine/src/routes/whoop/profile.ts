import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { GetProfileSchema, ProfileResponseSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getProfileRoute = createRoute({
  method: "get",
  path: "/",
  request: {
    query: GetProfileSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProfileResponseSchema,
        },
      },
      description: "Successfully retrieved profile",
    },
  },
});

router.openapi(getProfileRoute, async (c) => {
  const { accessToken } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, ProfileResponseSchema, async () => ({
    data: await provider.getProfile(accessToken),
  }));
});

export { router };
