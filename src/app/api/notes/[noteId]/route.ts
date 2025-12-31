import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { getUser } from "@/lib/auth";

type Params = Promise<{ noteId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await notesDb.getNoteById(noteId);

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Failed to fetch note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, folderId } = body;

    if (folderId) {
      await notesDb.moveNoteToFolder(noteId, folderId);
    }

    const note = await notesDb.updateNote(noteId, { title, content });
    return NextResponse.json({ note });
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { noteId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await notesDb.deleteNote(noteId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
