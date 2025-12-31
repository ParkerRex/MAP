import { type NextRequest, NextResponse } from "next/server";
import { tasksDb } from "@/db/tasks";
import {
  handleApiError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

type Params = Promise<{ tagId: string }>;

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { tagId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      throw validationError("Title is required");
    }

    const tag = await tasksDb.updateTag(tagId, user.id, title);

    if (!tag) {
      throw notFound("Tag");
    }

    return NextResponse.json({ tag });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { tagId } = await params;
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const deleted = await tasksDb.deleteTag(tagId, user.id);

    if (!deleted) {
      throw notFound("Tag");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
