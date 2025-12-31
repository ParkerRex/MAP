import { NextResponse } from "next/server";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const calendar = await getGoogleCalendarClient();
    const response = await calendar.colors.get();

    return NextResponse.json({ colors: response.data });
  } catch (error) {
    return handleApiError(error);
  }
}
