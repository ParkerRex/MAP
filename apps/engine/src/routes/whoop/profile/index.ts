import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../../providers/whoop/whoop-provider";
import type { Bindings } from "../../../types";
import { GetProfileSchema, ProfileResponseSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getProfileRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get user profile",
  description: "Get the user's Basic Profile",
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
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Client error constructing the request",
    },
    401: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Invalid authorization",
    },
    429: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Request rejected due to rate limiting",
    },
    500: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Server error occurred while making request",
    },
  },
});

app.openapi(getProfileRoute, async (c) => {
  try {
    const { accessToken } = c.req.valid("query");
    const provider = new WhoopProvider(c);
    const data = await provider.getProfile(accessToken);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve profile",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
