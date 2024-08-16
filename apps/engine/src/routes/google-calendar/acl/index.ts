import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Bindings } from "hono/types";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../../providers/google-calendar/google-calendar-provider";
import { AclRuleInputSchema, AclSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getAclRoute = createRoute({
  method: "get",
  path: "/{calendarId}",
  summary: "Get ACL for a calendar",
  description: "Retrieves the ACL for the specified calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
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
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

app.openapi(getAclRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.getAcl(calendarId);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve ACL",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const insertAclRoute = createRoute({
  method: "post",
  path: "/{calendarId}",
  summary: "Insert ACL rule",
  description: "Inserts a new ACL rule for the specified calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AclRuleInputSchema,
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
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

app.openapi(insertAclRoute, async (c) => {
  try {
    const { calendarId } = c.req.valid("param");
    const rule = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.insertAcl(calendarId, rule);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to insert ACL rule",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const updateAclRoute = createRoute({
  method: "put",
  path: "/{calendarId}/{ruleId}",
  summary: "Update ACL rule",
  description: "Updates an existing ACL rule for the specified calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      ruleId: z.string().openapi({ example: "user:example@gmail.com" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AclRuleInputSchema,
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
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

app.openapi(updateAclRoute, async (c) => {
  try {
    const { calendarId, ruleId } = c.req.valid("param");
    const rule = c.req.valid("json");
    const provider = new GoogleCalendarProvider(c);
    const data = await provider.updateAcl(calendarId, ruleId, rule);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to update ACL rule",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const deleteAclRoute = createRoute({
  method: "delete",
  path: "/{calendarId}/{ruleId}",
  summary: "Delete ACL rule",
  description: "Deletes an ACL rule for the specified calendar",
  request: {
    params: z.object({
      calendarId: z.string().openapi({ example: "primary" }),
      ruleId: z.string().openapi({ example: "user:example@gmail.com" }),
    }),
  },
  responses: {
    204: {
      description: "Successfully deleted ACL rule",
    },
    400: {
      content: {
        "application/json": {
          schema: GeneralErrorSchema,
        },
      },
      description: "Bad Request",
    },
  },
});

app.openapi(deleteAclRoute, async (c) => {
  try {
    const { calendarId, ruleId } = c.req.valid("param");
    const provider = new GoogleCalendarProvider(c);
    await provider.deleteAcl(calendarId, ruleId);
    return c.json(null, 204);
  } catch (error) {
    return c.json(
      {
        error: "Failed to delete ACL rule",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
