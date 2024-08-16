import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import {
  BodyMeasurementSchema,
  BodyMeasurementsResponseSchema,
  CreateBodyMeasurementSchema,
  GetBodyMeasurementsSchema,
} from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getBodyMeasurementsRoute = createRoute({
  method: "get",
  path: "/",
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
  },
});

router.openapi(getBodyMeasurementsRoute, async (c) => {
  const { accessToken } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, BodyMeasurementsResponseSchema, async () => ({
    data: await provider.getBodyMeasurements(accessToken),
  }));
});

const createBodyMeasurementRoute = createRoute({
  method: "post",
  path: "/",
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
  },
});

router.openapi(createBodyMeasurementRoute, async (c) => {
  const { accessToken, ...measurement } = c.req.valid("json");
  const provider = new WhoopProvider(c);
  return handleResponse(c, BodyMeasurementSchema, () =>
    provider.createBodyMeasurement(accessToken, measurement),
  );
});

export { router };
