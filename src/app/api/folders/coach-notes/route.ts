import { notesDb } from "@/db/notes";
import { withAuth } from "@/lib/api/with-auth";

export const POST = withAuth(async (user) => {
  const folder = await notesDb.ensureCoachNotesFolder(user.id);
  return { folder };
});
