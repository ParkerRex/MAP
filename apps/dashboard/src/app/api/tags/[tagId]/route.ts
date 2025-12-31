import { NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import { createClient } from "@map/supabase/server";

type Params = Promise<{ tagId: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tagId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const tag = await tasksDb.updateTag(tagId, title);
    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Failed to update tag:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { tagId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await tasksDb.deleteTag(tagId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
