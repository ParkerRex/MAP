import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import {
  handleApiError,
  notFound,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
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
      throw unauthorized();
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      throw validationError("Name is required");
    }

    const folder = await notesDb.updateFolder(folderId, user.id, name);

    if (!folder) {
      throw notFound("Folder");
    }

    return NextResponse.json({ folder });
  } catch (error) {
    return handleApiError(error);
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
      throw unauthorized();
    }

    const deleted = await notesDb.deleteFolder(folderId, user.id);

    if (!deleted) {
      throw notFound("Folder");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
