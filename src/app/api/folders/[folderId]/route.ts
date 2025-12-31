import { notesDb } from "@/db/notes";
import { notFound, validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const PUT = withAuth(async (user, request, { params }) => {
  const { folderId } = await params;
  const body = await request.json();
  const { name } = body;

  if (!name) {
    throw validationError("Name is required");
  }

  const folder = await notesDb.updateFolder(folderId, user.id, name);

  if (!folder) {
    throw notFound("Folder");
  }

  return { folder };
});

export const DELETE = withAuth(async (user, _request, { params }) => {
  const { folderId } = await params;
  const deleted = await notesDb.deleteFolder(folderId, user.id);

  if (!deleted) {
    throw notFound("Folder");
  }

  return { success: true };
});
