import { NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { createClient } from "@/lib/db/server";

type Params = Promise<{ noteId: string }>;

export async function POST(request: NextRequest, { params }: { params: Params }) {
  try {
    const { noteId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await notesDb.duplicateNote(noteId);
    return NextResponse.json({ note });
  } catch (error) {
    console.error("Failed to duplicate note:", error);
    return NextResponse.json({ error: "Failed to duplicate note" }, { status: 500 });
  }
}
