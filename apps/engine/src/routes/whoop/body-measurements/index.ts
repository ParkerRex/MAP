import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../../providers/whoop/whoop-provider";
import type { Bindings } from "../../../types";
import {
  BodyMeasurementSchema,
  BodyMeasurementsResponseSchema,
  CreateBodyMeasurementSchema,
  GetBodyMeasurementsSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getBodyMeasurementsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get body measurements",
  description: "Get the user's body measurements",
  request: {
    query: GetBodyMeasurementsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BodyMeasurementsResponseSchema,
        },
      },
      description: "Successfully retrieved body measurements",
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

app.openapi(getBodyMeasurementsRoute, async (c) => {
  try {
    const { accessToken } = c.req.valid("query");
    const provider = new WhoopProvider(c);
    const data = await provider.getBodyMeasurements(accessToken);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve body measurements",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const createBodyMeasurementRoute = createRoute({
  method: "post",
  path: "/",
  summary: "Create body measurement",
  description: "Create a new body measurement for the user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateBodyMeasurementSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BodyMeasurementSchema,
        },
      },
      description: "Successfully created body measurement",
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

app.openapi(createBodyMeasurementRoute, async (c) => {
  try {
    const { accessToken, ...measurement } = c.req.valid("json");
    const provider = new WhoopProvider(c);
    const data = await provider.createBodyMeasurement(accessToken, measurement);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to create body measurement",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
