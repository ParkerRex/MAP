import { NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { createClient } from "@/lib/db/server";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folder = await notesDb.ensureCoachNotesFolder(user.id);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Failed to ensure coach notes folder:", error);
    return NextResponse.json({ error: "Failed to ensure coach notes folder" }, { status: 500 });
  }
}
