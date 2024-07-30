import { z } from 'zod';

export const SyncJobStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'error',
]);

export type SyncJobStatus = z.infer<typeof SyncJobStatusSchema>;

export const SyncJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: SyncJobStatusSchema,
  job_type: z.string(),
  details: z.record(z.unknown()).nullable(),
  updated_at: z.string().datetime(),
});

export type SyncJob = z.infer<typeof SyncJobSchema>;

export const SyncErrorSchema = z.object({
  user_id: z.string().uuid(),
  error_message: z.string(),
  created_at: z.string().datetime(),
});

export type SyncError = z.infer<typeof SyncErrorSchema>;
