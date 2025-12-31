import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    const integration = await calendarDb.getIntegration(user.id, "CLAUDE");

    return NextResponse.json({
      connected: !!integration,
      expiresAt: integration?.expiresAt?.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
