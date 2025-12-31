import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { handleApiError, notFound, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

type Params = Promise<{ noteId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const note = await notesDb.getNoteById(noteId, user.id);

    if (!note) {
      throw notFound("Note");
    }

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

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

    return NextResponse.json({ note });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const deleted = await notesDb.deleteNote(noteId, user.id);

    if (!deleted) {
      throw notFound("Note");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
