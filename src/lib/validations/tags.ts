import { z } from "zod";

export const createTagSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export const updateTagSchema = z.object({
  title: z.string().min(1).max(100),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
