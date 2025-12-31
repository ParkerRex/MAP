import { tasksDb } from "@/db/tasks";
import { notFound, validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const PUT = withAuth(async (user, request, { params }) => {
  const { tagId } = await params;
  const body = await request.json();
  const { title } = body;

  if (!title) {
    throw validationError("Title is required");
  }

  const tag = await tasksDb.updateTag(tagId, user.id, title);

  if (!tag) {
    throw notFound("Tag");
  }

  return { tag };
});

export const DELETE = withAuth(async (user, _request, { params }) => {
  const { tagId } = await params;
  const deleted = await tasksDb.deleteTag(tagId, user.id);

  if (!deleted) {
    throw notFound("Tag");
  }

  return { success: true };
});
