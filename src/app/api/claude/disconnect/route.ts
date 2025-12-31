import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    await calendarDb.deleteIntegration(user.id, "CLAUDE");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
