import { NextResponse } from "next/server";
import { getGoogleCalendarClient } from "@/lib/google-calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = response.data.items || [];

    return NextResponse.json({ calendars });
  } catch (error) {
    return handleApiError(error);
  }
}
