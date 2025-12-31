import { tasksDb } from "@/db/tasks";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const GET = withAuth(async (user) => {
  const tags = await tasksDb.getTags(user.id);
  return { tags };
});

export const POST = withAuth(async (user, request) => {
  const body = await request.json();
  const { title } = body;

  if (!title) {
    throw validationError("Title is required");
  }

  const tag = await tasksDb.createTag({ title, userId: user.id });
  return { tag };
});
