import { type NextRequest, NextResponse } from "next/server";
import { notesDb } from "@/db/notes";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const folders = await notesDb.getFolders(user.id);
    return NextResponse.json({ folders });
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
    const { name } = body;

    if (!name) {
      throw validationError("Name is required");
    }

    const folder = await notesDb.createFolder({ name, userId: user.id });
    return NextResponse.json({ folder });
  } catch (error) {
    return handleApiError(error);
  }
}
