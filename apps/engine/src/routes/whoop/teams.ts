import type { Bindings } from "@/common/bindings";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import { handleResponse } from "../../utils/responseHandler";
import {
  GetTeamMembersSchema,
  GetTeamsSchema,
  TeamMembersResponseSchema,
  TeamsResponseSchema,
} from "./schema";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

const getTeamsRoute = createRoute({
  method: "get",
  path: "/",
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
  },
});

router.openapi(getTeamsRoute, async (c) => {
  const { accessToken } = c.req.valid("query");
  const provider = new WhoopProvider(c);
  return handleResponse(c, TeamsResponseSchema, async () => ({
    data: await provider.getTeams(accessToken),
  }));
});

const getTeamMembersRoute = createRoute({
  method: "get",
  path: "/{teamId}/members",
  request: {
    query: GetTeamMembersSchema,
    params: z.object({
      teamId: z.string(),
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
  },
});

router.openapi(getTeamMembersRoute, async (c) => {
  const { accessToken } = c.req.valid("query");
  const { teamId } = c.req.valid("param");
  const provider = new WhoopProvider(c);
  return handleResponse(c, TeamMembersResponseSchema, async () => ({
    data: await provider.getTeamMembers(accessToken, teamId),
  }));
});

export { router };
