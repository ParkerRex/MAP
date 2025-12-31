import { NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import { getUser } from "@/lib/auth";
import {
  handleApiError,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { createTaskSchema } from "@/lib/validations/tasks";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    const tasks = await tasksDb.getTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      throw validationError("Invalid input", {
        errors: parsed.error.flatten(),
      });
    }

    const task = await tasksDb.createTask({
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      createdBy: user.id,
      updatedBy: user.id,
    });

    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}
