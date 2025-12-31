import { z } from "zod";
import { tasksDb } from "@/db/tasks";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

const bulkUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  completed: z.boolean().optional(),
});

const bulkDeleteSchema = z.object({
  taskIds: z.array(z.string()).min(1),
});

export const PUT = withAuth(async (user, request) => {
  const body = await request.json();
  const parsed = bulkUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid input", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { taskIds, completed } = parsed.data;

  if (completed === true) {
    const count = await tasksDb.bulkCompleteTasks(taskIds, user.id);
    return { success: true, count };
  }

  return { success: true, count: 0 };
});

export const DELETE = withAuth(async (user, request) => {
  const body = await request.json();
  const parsed = bulkDeleteSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid input", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { taskIds } = parsed.data;
  const count = await tasksDb.bulkDeleteTasks(taskIds, user.id);

  return { success: true, count };
});
