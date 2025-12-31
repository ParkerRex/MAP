import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const notes = await notesDb.getNotes(user.id);
    return NextResponse.json({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

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

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}
