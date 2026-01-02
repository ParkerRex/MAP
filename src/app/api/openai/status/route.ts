import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    const integration = await calendarDb.getIntegration(user.id, "OPENAI");

    return NextResponse.json({
      connected: !!integration,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
