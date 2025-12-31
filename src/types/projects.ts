import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().optional(),
  user_id: z.string().uuid(),
  project_position: z.number().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
