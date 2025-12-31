import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import {
  handleApiError,
  unauthorized,
  validationError,
} from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import {
  getGoogleCalendarClient,
  mapGoogleEventToDb,
} from "@/lib/google-calendar";
import { calendarEventSchema } from "@/lib/validations/calendar";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const timeMin = searchParams.get("timeMin");
    const timeMax = searchParams.get("timeMax");

    if (!timeMin || !timeMax) {
      throw validationError("timeMin and timeMax are required");
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
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get("calendarId") || "primary";
    const body = await request.json();

    // Validate input
    const parsed = calendarEventSchema.safeParse(body);

    if (!parsed.success) {
      throw validationError("Invalid event data", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const calendar = await getGoogleCalendarClient();

    const response = await calendar.events.insert({
      calendarId,
      requestBody: parsed.data,
    });

    const event = response.data;

    if (event.id) {
      await calendarDb.createEvent(mapGoogleEventToDb(event, calendarId));
    }

    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}
