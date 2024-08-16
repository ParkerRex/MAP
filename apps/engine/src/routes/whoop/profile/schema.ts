import { z } from "zod";

export const GetProfileSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
  })
  .openapi("GetProfileSchema");

export const ProfileSchema = z
  .object({
    user_id: z.number().int().openapi({ example: 10129 }),
    email: z.string().email().openapi({ example: "jsmith123@whoop.com" }),
    first_name: z.string().openapi({ example: "John" }),
    last_name: z.string().openapi({ example: "Smith" }),
  })
  .openapi("ProfileSchema");

export const ProfileResponseSchema = z
  .object({
    data: ProfileSchema,
  })
  .openapi("ProfileResponseSchema");
