import { tasksDb } from "@/db/tasks";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { createTaskSchema } from "@/lib/validations/tasks";

export const GET = withAuth(async (user) => {
  const tasks = await tasksDb.getTasks(user.id);
  return { tasks };
});

export const POST = withAuth(async (user, request) => {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid input", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const task = await tasksDb.createTask({
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return { task };
});
