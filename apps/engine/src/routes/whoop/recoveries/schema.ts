import { z } from "zod";

export const GetRecoveriesSchema = z
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
  .openapi("GetRecoveriesSchema");

const RecoveryScoreSchema = z
  .object({
    user_calibrating: z.boolean().openapi({ example: false }),
    recovery_score: z.number().int().openapi({ example: 44 }),
    resting_heart_rate: z.number().int().openapi({ example: 64 }),
    hrv_rmssd_milli: z.number().openapi({ example: 31.813562 }),
    spo2_percentage: z.number().openapi({ example: 95.6875 }),
    skin_temp_celsius: z.number().openapi({ example: 33.7 }),
  })
  .openapi("RecoveryScoreSchema");

const RecoverySchema = z
  .object({
    cycle_id: z.number().int().openapi({ example: 93845 }),
    sleep_id: z.number().int().openapi({ example: 10235 }),
    user_id: z.number().int().openapi({ example: 10129 }),
    created_at: z
      .string()
      .datetime()
      .openapi({ example: "2022-04-24T11:25:44.774Z" }),
    updated_at: z
      .string()
      .datetime()
      .openapi({ example: "2022-04-24T14:25:44.774Z" }),
    score_state: z.string().openapi({ example: "SCORED" }),
    score: RecoveryScoreSchema,
  })
  .openapi("RecoverySchema");

export const RecoveriesResponseSchema = z
  .object({
    data: z.object({
      records: z.array(RecoverySchema),
      next_token: z.string().optional().openapi({ example: "MTIzOjEyMzEyMw" }),
    }),
  })
  .openapi("RecoveriesResponseSchema");
