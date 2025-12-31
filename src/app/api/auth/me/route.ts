import { NextResponse } from "next/server";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
