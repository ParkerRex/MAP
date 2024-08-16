// project-root/apps/engine/src/routes/whoop/schema.ts

import { z } from "@hono/zod-openapi";

export const GetProfileSchema = z.object({
  accessToken: z.string().openapi({
    description: "Whoop access token",
    example: "access_token_example",
  }),
});

export const ProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(["male", "female", "other"]),
  height: z.number(),
  weight: z.number(),
  country: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GetCyclesSchema = z.object({
  accessToken: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const CycleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  score: z.number().min(0).max(100),
  strain: z.number().min(0).max(21),
  kilojoules: z.number(),
  averageHeartRate: z.number(),
  maxHeartRate: z.number(),
});

export const GetWorkoutsSchema = z.object({
  accessToken: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const WorkoutSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sportId: z.number(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  score: z.number().min(0).max(100),
  strain: z.number().min(0).max(21),
  kilojoules: z.number(),
  averageHeartRate: z.number(),
  maxHeartRate: z.number(),
  distance: z.number().optional(),
  altitude: z.number().optional(),
});

export const GetRecoveriesSchema = z.object({
  accessToken: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const GetSleepsSchema = z.object({
  accessToken: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const RecoverySchema = z.object({
  id: z.string(),
  userId: z.string(),
  cycleId: z.string(),
  score: z.number().min(0).max(100),
  restingHeartRate: z.number(),
  hrvMs: z.number(),
  sleepPerformancePercentage: z.number(),
});

export const SleepSchema = z.object({
  id: z.string(),
  userId: z.string(),
  cycleId: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  score: z.number().min(0).max(100),
  needMinutes: z.number(),
  totalSleepMinutes: z.number(),
  slowWaveSleepMinutes: z.number(),
  remSleepMinutes: z.number(),
  lightSleepMinutes: z.number(),
  wakeSleepMinutes: z.number(),
  latencyMinutes: z.number(),
  efficiency: z.number(),
});

export const BodyMeasurementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  timestamp: z.string().datetime(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bodyFatPercentage: z.number().optional(),
  boneMass: z.number().optional(),
  muscleMass: z.number().optional(),
});

export const ActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  duration: z.number(),
  calories: z.number(),
  distance: z.number().optional(),
  steps: z.number().optional(),
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TeamMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  teamId: z.string(),
  role: z.enum(["member", "admin"]),
  joinedAt: z.string().datetime(),
});

export const GetBodyMeasurementsSchema = z.object({
  accessToken: z.string(),
});

export const CreateBodyMeasurementSchema = z.object({
  accessToken: z.string(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bodyFatPercentage: z.number().optional(),
  boneMass: z.number().optional(),
  muscleMass: z.number().optional(),
});

export const GetActivitiesSchema = z.object({
  accessToken: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const GetTeamsSchema = z.object({
  accessToken: z.string(),
});

export const GetTeamMembersSchema = z.object({
  accessToken: z.string(),
  teamId: z.string(),
});

// Response schemas
export const ProfileResponseSchema = z.object({
  data: ProfileSchema,
});

export const CyclesResponseSchema = z.object({
  data: z.array(CycleSchema),
});

export const WorkoutsResponseSchema = z.object({
  data: z.array(WorkoutSchema),
});

export const RecoveriesResponseSchema = z.object({
  data: z.array(RecoverySchema),
});

export const SleepsResponseSchema = z.object({
  data: z.array(SleepSchema),
});

export const BodyMeasurementsResponseSchema = z.object({
  data: z.array(BodyMeasurementSchema),
});

export const ActivitiesResponseSchema = z.object({
  data: z.array(ActivitySchema),
});

export const TeamsResponseSchema = z.object({
  data: z.array(TeamSchema),
});

export const TeamMembersResponseSchema = z.object({
  data: z.array(TeamMemberSchema),
});
