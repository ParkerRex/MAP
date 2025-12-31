import { NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import { getUser } from "@/lib/auth";
import {
  handleApiError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { updateTaskSchema } from "@/lib/validations/tasks";

type Params = Promise<{ taskId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { taskId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const task = await tasksDb.getTaskById(taskId);

    if (!task) {
      throw notFound("Task");
    }

    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { taskId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      throw validationError("Invalid input", {
        errors: parsed.error.flatten(),
      });
    }

    const { title, body: taskBody, dueAt, completed, tags } = parsed.data;

    // Handle toggle complete
    if (typeof completed === "boolean") {
      const task = await tasksDb.toggleTaskComplete(taskId, completed);
      return NextResponse.json({ task });
    }

    // Handle due date update
    if (dueAt !== undefined) {
      const task = await tasksDb.updateTaskDueDate(
        taskId,
        dueAt ? new Date(dueAt) : null,
      );
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
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { taskId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    await tasksDb.deleteTask(taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
