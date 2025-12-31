import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  dueAt: z.string().datetime().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
