import { NextResponse } from "next/server";
import { goalsDb } from "@/db/goals";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const stats = await goalsDb.getCompletionStats(user.id);
    return NextResponse.json({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
