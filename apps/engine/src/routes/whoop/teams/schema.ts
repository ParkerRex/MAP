import { z } from "zod";

export const GetTeamsSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
  })
  .openapi("GetTeamsSchema");

export const GetTeamMembersSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
  })
  .openapi("GetTeamMembersSchema");

export const TeamSchema = z
  .object({
    id: z.string().openapi({ example: "team123" }),
    name: z.string().openapi({ example: "My Team" }),
    // Add other team properties as needed
  })
  .openapi("TeamSchema");

export const TeamMemberSchema = z
  .object({
    id: z.string().openapi({ example: "user123" }),
    name: z.string().openapi({ example: "John Doe" }),
    // Add other team member properties as needed
  })
  .openapi("TeamMemberSchema");

export const TeamsResponseSchema = z
  .object({
    data: z.array(TeamSchema),
  })
  .openapi("TeamsResponseSchema");

export const TeamMembersResponseSchema = z
  .object({
    data: z.array(TeamMemberSchema),
  })
  .openapi("TeamMembersResponseSchema");
