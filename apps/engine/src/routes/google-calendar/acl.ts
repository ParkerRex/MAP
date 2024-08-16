import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import type { Bindings } from "../../types";
import { handleResponse } from "../../utils/responseHandler";
import { AclSchema } from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getAclRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
      description: "Successfully retrieved ACL",
    },
  },
});

router.openapi(getAclRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, AclSchema, () => provider.getAcl(calendarId));
});

const insertAclRoute = createRoute({
  method: "post",
  path: "/{calendarId}",
  request: {
    params: z.object({
      calendarId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
      description: "Successfully inserted ACL rule",
    },
  },
});

router.openapi(insertAclRoute, async (c) => {
  const { calendarId } = c.req.valid("param");
  const rule = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, AclSchema, () =>
    provider.insertAcl(calendarId, rule),
  );
});

const updateAclRoute = createRoute({
  method: "put",
  path: "/{calendarId}/{ruleId}",
  request: {
    params: z.object({
      calendarId: z.string(),
      ruleId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AclSchema,
        },
      },
      description: "Successfully updated ACL rule",
    },
  },
});

router.openapi(updateAclRoute, async (c) => {
  const { calendarId, ruleId } = c.req.valid("param");
  const rule = c.req.valid("json");
  const provider = new GoogleCalendarProvider(c);
  return handleResponse(c, AclSchema, () =>
    provider.updateAcl(calendarId, ruleId, rule),
  );
});

const deleteAclRoute = createRoute({
  method: "delete",
  path: "/{calendarId}/{ruleId}",
  request: {
    params: z.object({
      calendarId: z.string(),
      ruleId: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted ACL rule",
    },
  },
});

router.openapi(deleteAclRoute, async (c) => {
  const { calendarId, ruleId } = c.req.valid("param");
  const provider = new GoogleCalendarProvider(c);
  await provider.deleteAcl(calendarId, ruleId);
  return c.json(null, 204);
});

export { router };
