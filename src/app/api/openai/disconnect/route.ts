import { NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      throw unauthorized();
    }

    await calendarDb.deleteIntegration(user.id, "OPENAI");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
