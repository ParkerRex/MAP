import { NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folder = await notesDb.ensureCoachNotesFolder(user.id);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Failed to ensure coach notes folder:", error);
    return NextResponse.json(
      { error: "Failed to ensure coach notes folder" },
      { status: 500 },
    );
  }
}
