import { notesDb } from "@/db/notes";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const GET = withAuth(async (user) => {
  const notes = await notesDb.getNotes(user.id);
  return { notes };
});

export const POST = withAuth(async (user, request) => {
  const body = await request.json();
  const { title, content, folderId } = body;

  if (!title) {
    throw validationError("Title is required");
  }

  if (!folderId) {
    throw validationError("Folder ID is required");
  }

  const note = await notesDb.createNote({
    title,
    content,
    folderId,
    userId: user.id,
  });

  return { note };
});
