import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  body: z.string().max(10000).optional(),
  dueAt: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(10000).optional().nullable(),
  dueAt: z.string().datetime().nullable().optional(),
  completed: z.boolean().optional(),
  tags: z.array(z.string().uuid()).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
