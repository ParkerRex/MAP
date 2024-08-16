import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../../providers/whoop/whoop-provider";
import type { Bindings } from "../../../types";
import { ActivitiesResponseSchema, GetActivitiesSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getActivitiesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get activities",
  description:
    "Get all workouts for a user, paginated. Results are sorted by start time in descending order.",
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

app.openapi(getActivitiesRoute, async (c) => {
  try {
    const { accessToken, start, end, limit, nextToken } = c.req.valid("query");
    const provider = new WhoopProvider(c);
    const data = await provider.getActivities(
      accessToken,
      start,
      end,
      limit,
      nextToken,
    );
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve activities",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
