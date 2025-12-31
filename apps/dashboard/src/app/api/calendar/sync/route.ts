import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { calendarDb } from "@/db/calendar";
import { mapGoogleEventToDb } from "@/lib/google-calendar";
import { subMonths, addMonths } from "date-fns";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function syncUserCalendars(userId: string) {
  const integration = await calendarDb.getIntegration(userId, "GOOGLE");

  if (!integration) {
    await calendarDb.createSyncLog({
      userId,
      status: "failure",
      message: "No Google integration found",
    });
    return { success: false, error: "No Google integration found" };
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken ?? undefined,
  });

  // Check if token needs refresh
  if (integration.expiresAt && integration.refreshToken) {
    const expiresAt = new Date(integration.expiresAt);
    const now = new Date();

    if (expiresAt < now) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        await calendarDb.updateIntegration(userId, "GOOGLE", {
          accessToken: credentials.access_token ?? integration.accessToken,
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : undefined,
        });

        oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        await calendarDb.createSyncLog({
          userId,
          status: "failure",
          message: "Failed to refresh Google token",
        });
        return { success: false, error: "Failed to refresh Google token" };
      }
    }
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    // Get all calendars
    const calendarListResponse = await calendar.calendarList.list({
      maxResults: 250,
    });

    const calendars = calendarListResponse.data.items || [];
    let totalEventsSynced = 0;

    const timeMin = subMonths(new Date(), 6).toISOString();
    const timeMax = addMonths(new Date(), 6).toISOString();

    // Sync events for each calendar
    for (const cal of calendars) {
      if (!cal.id) continue;

      try {
        const eventsResponse = await calendar.events.list({
          calendarId: cal.id,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 2500,
        });

        const events = eventsResponse.data.items || [];

        for (const event of events) {
          if (!event.id) continue;

          const eventData = mapGoogleEventToDb(event, cal.id);

          // Upsert event
          const existing = await calendarDb.getEventById(event.id, cal.id);
          if (existing) {
            await calendarDb.updateEvent(event.id, cal.id, eventData);
          } else {
            await calendarDb.createEvent(eventData);
          }

          totalEventsSynced++;
        }
      } catch (error) {
        console.error(`Failed to sync calendar ${cal.id}:`, error);
      }
    }

    await calendarDb.createSyncLog({
      userId,
      status: "success",
      message: `Synced ${calendars.length} calendars and ${totalEventsSynced} events`,
    });

    return {
      success: true,
      calendarsSynced: calendars.length,
      eventsSynced: totalEventsSynced,
    };
  } catch (error) {
    console.error("Failed to sync calendars:", error);
    await calendarDb.createSyncLog({
      userId,
      status: "failure",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: "Failed to sync calendars" };
  }
}

async function retrySync(userId: string, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await syncUserCalendars(userId);

    if (result.success) {
      return result;
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.WEBHOOK_SECRET;

    // Check for webhook secret (for external triggers)
    if (webhookSecret && authHeader === `Bearer ${webhookSecret}`) {
      const body = await request.json();
      const userId = body.record?.id || body.userId;

      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      const result = await retrySync(userId);
      return NextResponse.json(result);
    }

    // Otherwise, use authenticated user
    const { createClient } = await import("@map/supabase/server");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await retrySync(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync calendars" }, { status: 500 });
  }
}
