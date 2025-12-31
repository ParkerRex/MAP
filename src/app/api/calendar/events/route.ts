import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getGoogleCalendarClient, mapGoogleEventToDb } from "@/lib/google-calendar";
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
    const pageToken = searchParams.get("pageToken");
    const timeZone = searchParams.get("timeZone");
    const q = searchParams.get("q");
    const showDeleted = searchParams.get("showDeleted") === "true";
    const maxResults = Math.min(Number(searchParams.get("maxResults")) || 2500, 2500);

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
      maxResults,
      pageToken: pageToken || undefined,
      timeZone: timeZone || undefined,
      q: q || undefined,
      showDeleted,
    });

    const events = response.data.items || [];

    return NextResponse.json({
      events,
      nextPageToken: response.data.nextPageToken,
    });
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
    const sendUpdates = searchParams.get("sendUpdates") as "all" | "externalOnly" | "none" | null;
    const conferenceDataVersion = searchParams.get("conferenceDataVersion") === "1" ? 1 : undefined;
    const supportsAttachments = searchParams.get("supportsAttachments") === "true";
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
      sendUpdates: sendUpdates || undefined,
      conferenceDataVersion,
      supportsAttachments: supportsAttachments || undefined,
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
