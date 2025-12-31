import { notesDb } from "@/db/notes";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";

export const GET = withAuth(async (user) => {
  const folders = await notesDb.getFolders(user.id);
  return { folders };
});

export const POST = withAuth(async (user, request) => {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    throw validationError("Name is required");
  }

  const folder = await notesDb.createFolder({ name, userId: user.id });
  return { folder };
});
