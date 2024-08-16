import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../../providers/whoop/whoop-provider";
import type { Bindings } from "../../../types";
import { GetSleepsSchema, SleepsResponseSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getSleepsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get sleeps",
  description:
    "Get all sleeps for a user, paginated. Results are sorted by start time in descending order.",
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

app.openapi(getSleepsRoute, async (c) => {
  try {
    const { accessToken, start, end, limit, nextToken } = c.req.valid("query");
    const provider = new WhoopProvider(c);
    const data = await provider.getSleeps(
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
        error: "Failed to retrieve sleeps",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
