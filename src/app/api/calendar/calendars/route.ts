import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { getGoogleCalendarClient } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Get calendars from database
    let calendars = await calendarDb.getCalendarsByUserId(user.id);

    // If no calendars in DB or refresh requested, fetch from Google and update DB
    if (calendars.length === 0 || refresh) {
      try {
        const googleCalendar = await getGoogleCalendarClient();
        const response = await googleCalendar.calendarList.list({
          maxResults: 250,
        });

        const googleCalendars = response.data.items ?? [];

        if (googleCalendars.length > 0) {
          // Get or create calendar account
          const primaryCalendar = googleCalendars.find((c) => c.primary);
          const userEmail = primaryCalendar?.id ?? user.email;

          const account = await calendarDb.upsertCalendarAccount({
            userId: user.id,
            email: userEmail,
            provider: "GOOGLE",
          });

          // Persist all calendars
          for (const cal of googleCalendars) {
            if (!cal.id) continue;

            await calendarDb.upsertCalendar({
              id: cal.id,
              accountId: account.id,
              provider: "GOOGLE",
              summary: cal.summary ?? null,
              description: cal.description ?? null,
              backgroundColor: cal.backgroundColor ?? null,
              foregroundColor: cal.foregroundColor ?? null,
              colorId: cal.colorId ?? null,
              selected: cal.selected ?? true,
              isPrimary: cal.primary ?? false,
              accessRole: cal.accessRole ?? null,
              timeZone: cal.timeZone ?? null,
              etag: cal.etag ?? null,
              kind: cal.kind ?? null,
            });
          }

          // Re-fetch from DB to get consistent format
          calendars = await calendarDb.getCalendarsByUserId(user.id);
        }
      } catch {
        // If Google fetch fails but we have cached data, use it
        if (calendars.length === 0) {
          throw new Error("No calendars found and unable to fetch from Google");
        }
      }
    }

    return NextResponse.json({ calendars });
  } catch (error) {
    return handleApiError(error);
  }
}
