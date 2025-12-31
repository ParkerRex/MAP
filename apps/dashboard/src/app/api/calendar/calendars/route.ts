import { NextResponse } from "next/server";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

export async function GET() {
  try {
    const calendar = await getGoogleCalendarClient();

    const response = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = response.data.items || [];

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Failed to fetch calendars:", error);
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
  }
}
