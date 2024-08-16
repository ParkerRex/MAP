import { GeneralErrorSchema } from "@/common/schema";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { WhoopProvider } from "../../../providers/whoop/whoop-provider";
import type { Bindings } from "../../../types";
import {
  GetTeamMembersSchema,
  GetTeamsSchema,
  TeamMembersResponseSchema,
  TeamsResponseSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getTeamsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "Get teams",
  description: "Get all teams for a user",
  request: {
    query: GetTeamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TeamsResponseSchema,
        },
      },
      description: "Successfully retrieved teams",
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

app.openapi(getTeamsRoute, async (c) => {
  try {
    const { accessToken } = c.req.valid("query");
    const provider = new WhoopProvider(c);
    const data = await provider.getTeams(accessToken);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve teams",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

const getTeamMembersRoute = createRoute({
  method: "get",
  path: "/{teamId}/members",
  summary: "Get team members",
  description: "Get all members of a specific team",
  request: {
    query: GetTeamMembersSchema,
    params: z.object({
      teamId: z.string().openapi({ example: "team123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TeamMembersResponseSchema,
        },
      },
      description: "Successfully retrieved team members",
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

app.openapi(getTeamMembersRoute, async (c) => {
  try {
    const { accessToken } = c.req.valid("query");
    const { teamId } = c.req.valid("param");
    const provider = new WhoopProvider(c);
    const data = await provider.getTeamMembers(accessToken, teamId);
    return c.json({ data }, 200);
  } catch (error) {
    return c.json(
      {
        error: "Failed to retrieve team members",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId: c.get("requestId"),
        code: "400",
      },
      400,
    );
  }
});

export default app;
