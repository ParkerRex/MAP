import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { handleApiError, notFound, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

type Params = Promise<{ noteId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const note = await notesDb.duplicateNote(noteId, user.id);

    if (!note) {
      throw notFound("Note");
    }

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}
