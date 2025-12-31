import { NextRequest, NextResponse } from "next/server";
import { getGoogleCalendarClient, mapGoogleEventToDb } from "@/lib/google-calendar";
import { calendarDb } from "@/db/calendar";
import { createClient } from "@map/supabase/server";

type Params = Promise<{ eventId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.events.get({
      calendarId,
      eventId,
    });

    return NextResponse.json({ event: response.data });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { eventId } = await params;
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

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: body,
    });

    const event = response.data;

    // Update in database
    if (event.id) {
      await calendarDb.updateEvent(eventId, calendarId, mapGoogleEventToDb(event, calendarId));
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendar = await getGoogleCalendarClient();

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    // Delete from database
    await calendarDb.deleteEvent(eventId, calendarId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
