import { calendarDb } from "@/db/calendar";
import { validationError } from "@/lib/api/errors";
import { withAuth } from "@/lib/api/with-auth";
import {
  getGoogleCalendarClient,
  mapGoogleEventToDb,
} from "@/lib/google-calendar";
import { updateCalendarEventSchema } from "@/lib/validations/calendar";

export const GET = withAuth(async (user, request, { params }) => {
  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId") || "primary";

  const calendar = await getGoogleCalendarClient();

  const response = await calendar.events.get({
    calendarId,
    eventId,
  });

  return { event: response.data };
});

export const PUT = withAuth(async (user, request, { params }) => {
  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId") || "primary";
  const sendUpdates = searchParams.get("sendUpdates") as
    | "all"
    | "externalOnly"
    | "none"
    | null;
  const body = await request.json();

  // Validate input
  const parsed = updateCalendarEventSchema.safeParse(body);

  if (!parsed.success) {
    throw validationError("Invalid event data", {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const calendar = await getGoogleCalendarClient();

  // Use PATCH for partial updates - PUT requires the complete event resource
  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: parsed.data,
    sendUpdates: sendUpdates || undefined,
  });

  const event = response.data;

  if (event.id) {
    await calendarDb.updateEvent(
      eventId,
      calendarId,
      mapGoogleEventToDb(event, calendarId),
    );
  }

  return { event };
});

export const DELETE = withAuth(async (user, request, { params }) => {
  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId") || "primary";
  const sendUpdates = searchParams.get("sendUpdates") as
    | "all"
    | "externalOnly"
    | "none"
    | null;

  const calendar = await getGoogleCalendarClient();

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: sendUpdates || undefined,
  });

  await calendarDb.deleteEvent(eventId, calendarId);

  return { success: true };
});
