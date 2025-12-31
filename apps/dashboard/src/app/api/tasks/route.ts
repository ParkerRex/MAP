import { NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import { createClient } from "@/lib/db/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await tasksDb.getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: taskBody, dueAt } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await tasksDb.createTask({
      title,
      body: taskBody,
      dueAt: dueAt ? new Date(dueAt) : null,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
