import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  body: z.string().optional(), // GFM
  resources: z.string().array().optional(), // Links/Attachments to external items (Figma file, PDF, etc)
  source_type: z.enum(['agent', 'user', 'integration']),

  // AI Processing
  proposal: z.string().optional(), // AI's attempt
  cognitive_load: z.number().optional(), // Ranking of estimated cognitive load

  // Outcomes
  result: z.string().optional(), // User can store outcome here if needed

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  due_at: z.string().datetime().optional(),
  scheduled_for: z.string().datetime().optional(),
  estimated_duration: z.number().optional(),
  actual_duration: z.number().optional(),
  started_at: z.string().datetime().optional(),

  // Task Relations
  blocked_by: z.string().uuid().optional(),

  // User Relations
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
  deleted_by: z.string().uuid().optional(),
  completed_by: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),

  // Organization
  tags: TagSchema.array().optional(),
  contact: z
    .object({
      company: z.string().optional(),
      contact_name: z.string().optional(),
      email: z.string().email().optional(),
      phone_number: z.string().optional(),
    })
    .optional(),
});

export type Task = z.infer<typeof TaskSchema>;
