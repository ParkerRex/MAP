import { type NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import {
  handleApiError,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const tags = await tasksDb.getTags(user.id);
    return NextResponse.json({ tags });
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
    const { title } = body;

    if (!title) {
      throw validationError("Title is required");
    }

    const tag = await tasksDb.createTag({ title, userId: user.id });
    return NextResponse.json({ tag });
  } catch (error) {
    return handleApiError(error);
  }
}
