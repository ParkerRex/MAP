import { notesDb } from "@/db/notes";
import { notFound } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const GET = withAuth(async (user, _request, { params }) => {
  const { noteId } = await params;
  const note = await notesDb.getNoteById(noteId, user.id);

  if (!note) {
    throw notFound("Note");
  }

  return { note };
});

export const PUT = withAuth(async (user, request, { params }) => {
  const { noteId } = await params;
  const body = await request.json();
  const { title, content, folderId } = body;

  if (folderId) {
    const moved = await notesDb.moveNoteToFolder(noteId, user.id, folderId);
    if (!moved) {
      throw notFound("Note");
    }
  }

  const note = await notesDb.updateNote(noteId, user.id, { title, content });

  if (!note) {
    throw notFound("Note");
  }

  return { note };
});

export const DELETE = withAuth(async (user, _request, { params }) => {
  const { noteId } = await params;
  const deleted = await notesDb.deleteNote(noteId, user.id);

  if (!deleted) {
    throw notFound("Note");
  }

  return { success: true };
});
