import { NextRequest, NextResponse } from "next/server";
import { getGoogleCalendarClient, mapGoogleEventToDb } from "@/lib/google-calendar";
import { calendarDb } from "@/db/calendar";
import { createClient } from "@map/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      return NextResponse.json({ error: "timeMin and timeMax are required" }, { status: 400 });
    }

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const events = response.data.items || [];

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const body = await request.json();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.events.insert({
      calendarId,
      requestBody: body,
    });

    const event = response.data;

    // Save to database
    if (event.id) {
      await calendarDb.createEvent(mapGoogleEventToDb(event, calendarId));
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
