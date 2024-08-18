import { z } from "zod";

export const GetCyclesSchema = z
  .object({
    accessToken: z.string().openapi({ example: "your_access_token_here" }),
    start: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: "2023-01-01T00:00:00Z" }),
    end: z
      .string()
      .datetime()
      .optional()
      .openapi({ example: "2023-12-31T23:59:59Z" }),
    limit: z.number().int().min(1).max(25).default(10).openapi({ example: 10 }),
    nextToken: z.string().optional().openapi({ example: "MTIzOjEyMzEyMw" }),
  })
  .openapi("GetCyclesSchema");

export const CycleScoreSchema = z
  .object({
    strain: z.number().openapi({ example: 5.2951527 }),
    kilojoule: z.number().openapi({ example: 8288.297 }),
    average_heart_rate: z.number().int().openapi({ example: 68 }),
    max_heart_rate: z.number().int().openapi({ example: 141 }),
  })
  .openapi("CycleScoreSchema");

export const CycleSchema = z
  .object({
    id: z.number().int().openapi({ example: 93845 }),
    user_id: z.number().int().openapi({ example: 10129 }),
    created_at: z
      .string()
      .datetime()
      .openapi({ example: "2022-04-24T11:25:44.774Z" }),
    updated_at: z
      .string()
      .datetime()
      .openapi({ example: "2022-04-24T14:25:44.774Z" }),
    start: z
      .string()
      .datetime()
      .openapi({ example: "2022-04-24T02:25:44.774Z" }),
    end: z.string().datetime().openapi({ example: "2022-04-24T10:25:44.774Z" }),
    timezone_offset: z.string().openapi({ example: "-05:00" }),
    score_state: z.string().openapi({ example: "SCORED" }),
    score: CycleScoreSchema,
  })
  .openapi("CycleSchema");

export const CyclesResponseSchema = z
  .object({
    data: z.object({
      records: z.array(CycleSchema),
      next_token: z.string().optional().openapi({ example: "MTIzOjEyMzEyMw" }),
    }),
  })
  .openapi("CyclesResponseSchema");
