import { getUser } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { NextResponse } from "next/server";

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
