import { z } from "zod";

export const GetSleepsSchema = z
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
  .openapi("GetSleepsSchema");

export const StageSummarySchema = z
  .object({
    total_in_bed_time_milli: z.number().int().openapi({ example: 30272735 }),
    total_awake_time_milli: z.number().int().openapi({ example: 1403507 }),
    total_no_data_time_milli: z.number().int().openapi({ example: 0 }),
    total_light_sleep_time_milli: z
      .number()
      .int()
      .openapi({ example: 14905851 }),
    total_slow_wave_sleep_time_milli: z
      .number()
      .int()
      .openapi({ example: 6630370 }),
    total_rem_sleep_time_milli: z.number().int().openapi({ example: 5879573 }),
    sleep_cycle_count: z.number().int().openapi({ example: 3 }),
    disturbance_count: z.number().int().openapi({ example: 12 }),
  })
  .openapi("StageSummarySchema");

export const SleepNeededSchema = z
  .object({
    baseline_milli: z.number().int().openapi({ example: 27395716 }),
    need_from_sleep_debt_milli: z.number().int().openapi({ example: 352230 }),
    need_from_recent_strain_milli: z
      .number()
      .int()
      .openapi({ example: 208595 }),
    need_from_recent_nap_milli: z.number().int().openapi({ example: -12312 }),
  })
  .openapi("SleepNeededSchema");

export const SleepScoreSchema = z
  .object({
    stage_summary: StageSummarySchema,
    sleep_needed: SleepNeededSchema,
    respiratory_rate: z.number().openapi({ example: 16.11328125 }),
    sleep_performance_percentage: z.number().int().openapi({ example: 98 }),
    sleep_consistency_percentage: z.number().int().openapi({ example: 90 }),
    sleep_efficiency_percentage: z.number().openapi({ example: 91.69533848 }),
  })
  .openapi("SleepScoreSchema");

export const SleepSchema = z
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
    nap: z.boolean().openapi({ example: false }),
    score_state: z.string().openapi({ example: "SCORED" }),
    score: SleepScoreSchema,
  })
  .openapi("SleepSchema");

export const SleepsResponseSchema = z
  .object({
    data: z.object({
      records: z.array(SleepSchema),
      next_token: z.string().optional().openapi({ example: "MTIzOjEyMzEyMw" }),
    }),
  })
  .openapi("SleepsResponseSchema");
