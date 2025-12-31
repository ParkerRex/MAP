import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { whoopDb } from "@/db/whoop";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    // Check if WHOOP is connected
    const hasIntegration = await calendarDb.hasIntegration(user.id, "WHOOP");
    if (!hasIntegration) {
      return NextResponse.json({ connected: false, profile: null });
    }

    const profile = await whoopDb.getProfile(user.id);

    return NextResponse.json({
      connected: true,
      profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
