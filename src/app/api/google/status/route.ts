import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    // Check if Google Calendar is connected
    const hasIntegration = await calendarDb.hasIntegration(user.id, "GOOGLE");

    return NextResponse.json({ connected: hasIntegration });
  } catch (error) {
    return handleApiError(error);
  }
}
