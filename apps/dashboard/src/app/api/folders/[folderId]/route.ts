import { NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { getUser } from "@/lib/auth";

type Params = Promise<{ folderId: string }>;

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { folderId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const folder = await notesDb.updateFolder(folderId, name);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Failed to update folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { folderId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await notesDb.deleteFolder(folderId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
