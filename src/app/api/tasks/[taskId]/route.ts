import { tasksDb } from "@/db/tasks";
import { notFound, validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import { updateTaskSchema } from "@/lib/validations/tasks";

export const GET = withAuth(async (user, _request, { params }) => {
  const { taskId } = await params;
  const task = await tasksDb.getTaskWithTags(taskId, user.id);

  if (!task) {
    throw notFound("Task");
  }

  return { task };
});

export const PUT = withAuth(async (user, request, { params }) => {
  const { taskId } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid input", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { title, body: taskBody, dueAt, completed, tags } = parsed.data;

  const loadTaskWithTags = async () => {
    const task = await tasksDb.getTaskWithTags(taskId, user.id);
    if (!task) throw notFound("Task");
    return task;
  };

  // Handle toggle complete
  if (typeof completed === "boolean") {
    const task = await tasksDb.toggleTaskComplete(taskId, user.id, completed);
    if (!task) throw notFound("Task");
    return { task: await loadTaskWithTags() };
  }

  // Handle due date update
  if (dueAt !== undefined) {
    const task = await tasksDb.updateTaskDueDate(taskId, user.id, dueAt ? new Date(dueAt) : null);
    if (!task) throw notFound("Task");
    return { task: await loadTaskWithTags() };
  }

  // Handle tags update
  if (tags !== undefined) {
    const task = await tasksDb.updateTaskTags(taskId, user.id, tags);
    if (!task) throw notFound("Task");
    return { task };
  }

  // General update
  const task = await tasksDb.updateTask(taskId, user.id, {
    title,
    body: taskBody,
    updatedBy: user.id,
  });

  if (!task) {
    throw notFound("Task");
  }

  return { task: await loadTaskWithTags() };
});

export const DELETE = withAuth(async (user, _request, { params }) => {
  const { taskId } = await params;
  const deleted = await tasksDb.deleteTask(taskId, user.id);

  if (!deleted) {
    throw notFound("Task");
  }

  return { success: true };
});
