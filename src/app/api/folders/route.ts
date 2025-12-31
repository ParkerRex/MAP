import { NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await notesDb.getFolders(user.id);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Failed to fetch folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const folder = await notesDb.createFolder({ name, userId: user.id });
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}
