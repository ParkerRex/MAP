import { type NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import {
  handleApiError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
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

    const task = await tasksDb.getTaskById(taskId, user.id);

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
      const task = await tasksDb.toggleTaskComplete(taskId, user.id, completed);
      if (!task) {
        throw notFound("Task");
      }
      return NextResponse.json({ task });
    }

    // Handle due date update
    if (dueAt !== undefined) {
      const task = await tasksDb.updateTaskDueDate(
        taskId,
        user.id,
        dueAt ? new Date(dueAt) : null,
      );
      if (!task) {
        throw notFound("Task");
      }
      return NextResponse.json({ task });
    }

    // Handle tags update
    if (tags !== undefined) {
      const task = await tasksDb.updateTaskTags(taskId, user.id, tags);
      if (!task) {
        throw notFound("Task");
      }
      return NextResponse.json({ task });
    }

    // General update
    const task = await tasksDb.updateTask(taskId, user.id, {
      title,
      body: taskBody,
      updatedBy: user.id,
    });

    if (!task) {
      throw notFound("Task");
    }

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

    const deleted = await tasksDb.deleteTask(taskId, user.id);

    if (!deleted) {
      throw notFound("Task");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
