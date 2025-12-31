import { NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import { createClient } from "@map/supabase/server";

type Params = Promise<{ taskId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { taskId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await tasksDb.getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { taskId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, body: taskBody, dueAt, completed, tags } = body;

    // Handle toggle complete
    if (typeof completed === "boolean") {
      const task = await tasksDb.toggleTaskComplete(taskId, completed);
      return NextResponse.json({ task });
    }

    // Handle due date update
    if (dueAt !== undefined) {
      const task = await tasksDb.updateTaskDueDate(taskId, dueAt ? new Date(dueAt) : null);
      return NextResponse.json({ task });
    }

    // Handle tags update
    if (tags !== undefined) {
      const task = await tasksDb.updateTaskTags(taskId, tags);
      return NextResponse.json({ task });
    }

    // General update
    const task = await tasksDb.updateTask(taskId, {
      title,
      body: taskBody,
      updatedBy: user.id,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { taskId } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await tasksDb.deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
