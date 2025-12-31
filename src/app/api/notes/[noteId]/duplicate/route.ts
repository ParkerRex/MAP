import { notesDb } from "@/db/notes";
import { notFound } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const POST = withAuth(async (user, _request, { params }) => {
  const { noteId } = await params;
  const note = await notesDb.duplicateNote(noteId, user.id);

  if (!note) {
    throw notFound("Note");
  }

  return { note };
});
