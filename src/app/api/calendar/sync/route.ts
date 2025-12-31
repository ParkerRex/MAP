import { addMonths, subMonths } from "date-fns";
import type { GaxiosError } from "gaxios";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { calendarDb } from "@/db/calendar";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";
import { mapGoogleEventToDb } from "@/lib/google-calendar";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Validate webhook secret at module load time
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function isValidWebhookRequest(authHeader: string | null): boolean {
  // Webhook secret must be set and non-empty
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.length < 32) {
    return false;
  }
  // Auth header must match exactly
  return authHeader === `Bearer ${WEBHOOK_SECRET}`;
}

// Helper to check if error is a rate limit error (429)
function isRateLimitError(error: unknown): boolean {
  const gaxiosError = error as GaxiosError;
  return gaxiosError?.response?.status === 429;
}

// Helper to check if syncToken is invalid (410 Gone)
function isSyncTokenInvalid(error: unknown): boolean {
  const gaxiosError = error as GaxiosError;
  return gaxiosError?.response?.status === 410;
}

// Helper to get retry delay from Retry-After header or use exponential backoff
function getRetryDelay(error: unknown, attempt: number): number {
  const gaxiosError = error as GaxiosError;
  const retryAfter = gaxiosError?.response?.headers?.["retry-after"];
  if (retryAfter) {
    // Retry-After can be seconds or a date
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return seconds * 1000;
    }
  }
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return INITIAL_RETRY_DELAY * 2 ** (attempt - 1);
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper for API calls with rate limit handling
async function withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      return await fn();
    } catch (error) {
      if (isRateLimitError(error)) {
        const delay = getRetryDelay(error, attempt);
        console.log(
          `Rate limited on ${context}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`,
        );
        await sleep(delay);
        continue;
      }
      if (attempt >= MAX_RETRIES) {
        throw error;
      }
      await sleep(INITIAL_RETRY_DELAY * attempt);
    }
  }
  throw new Error(`Max retries exceeded for ${context}`);
}

// Fetch events with sync token handling
async function fetchEventsPage(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  options: {
    syncToken: string | null;
    pageToken?: string;
    timeMin?: string;
    timeMax?: string;
  },
): Promise<{
  response: calendar_v3.Schema$Events;
  newSyncToken: string | null;
}> {
  const { syncToken, pageToken, timeMin, timeMax } = options;

  try {
    const response = await withRetry(
      () =>
        calendar.events.list({
          calendarId,
          ...(syncToken
            ? { syncToken }
            : {
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: "startTime",
              }),
          maxResults: 2500,
          pageToken,
          showDeleted: true,
        }),
      `calendar ${calendarId}`,
    );
    return {
      response: response.data,
      newSyncToken: null,
    };
  } catch (error) {
    // Handle 410 Gone - syncToken is invalid, need full sync
    if (isSyncTokenInvalid(error)) {
      console.log(`SyncToken invalid for calendar ${calendarId}, performing full sync`);
      return { response: { items: [] }, newSyncToken: "INVALID" };
    }
    throw error;
  }
}

// Sync a single calendar with incremental sync support
async function syncCalendarEvents(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  forceFullSync = false,
): Promise<{ synced: number; deleted: number }> {
  let synced = 0;
  let deleted = 0;
  let pageToken: string | undefined;
  let currentSyncToken: string | null = forceFullSync
    ? null
    : await calendarDb.getSyncToken(calendarId);

  // For full sync, we need time bounds
  const timeMin = !currentSyncToken ? subMonths(new Date(), 6).toISOString() : undefined;
  const timeMax = !currentSyncToken ? addMonths(new Date(), 6).toISOString() : undefined;

  do {
    const { response, newSyncToken } = await fetchEventsPage(calendar, calendarId, {
      syncToken: currentSyncToken,
      pageToken,
      timeMin,
      timeMax,
    });

    // If syncToken was invalid, we need to do a full sync
    if (newSyncToken === "INVALID") {
      currentSyncToken = null;
      // Restart the loop with full sync parameters
      const fullSyncResult = await syncCalendarEvents(calendar, calendarId, true);
      return fullSyncResult;
    }

    const events = response.items || [];

    for (const event of events) {
      if (!event.id) continue;

      // Handle deleted events in incremental sync
      if (event.status === "cancelled") {
        await calendarDb.deleteEvent(event.id, calendarId);
        deleted++;
        continue;
      }

      const eventData = mapGoogleEventToDb(event, calendarId);
      const existing = await calendarDb.getEventById(event.id, calendarId);

      if (existing) {
        await calendarDb.updateEvent(event.id, calendarId, eventData);
      } else {
        await calendarDb.createEvent(eventData);
      }
      synced++;
    }

    pageToken = response.nextPageToken || undefined;

    // Store the new syncToken when we're done with all pages
    if (!pageToken && response.nextSyncToken) {
      await calendarDb.upsertSyncToken(calendarId, response.nextSyncToken);
    }
  } while (pageToken);

  return { synced, deleted };
}

async function syncUserCalendars(userId: string, forceFullSync = false) {
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
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken ?? undefined,
  });

  // Check if token needs refresh
  if (integration.expiresAt && integration.refreshToken) {
    const expiresAt = new Date(integration.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        await calendarDb.updateIntegration(userId, "GOOGLE", {
          accessToken: credentials.access_token ?? integration.accessToken,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
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
    // Fetch calendar list with rate limit handling
    const calendarListResponse = await withRetry(
      () => calendar.calendarList.list({ maxResults: 250 }),
      "calendarList",
    );

    const calendars = calendarListResponse.data.items || [];
    let totalEventsSynced = 0;
    let totalEventsDeleted = 0;
    const errors: string[] = [];

    for (const cal of calendars) {
      if (!cal.id) continue;

      try {
        const { synced, deleted } = await syncCalendarEvents(calendar, cal.id, forceFullSync);
        totalEventsSynced += synced;
        totalEventsDeleted += deleted;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to sync calendar ${cal.id}:`, error);
        errors.push(`${cal.id}: ${message}`);
      }
    }

    const status = errors.length > 0 ? "partial" : "success";
    await calendarDb.createSyncLog({
      userId,
      status,
      message: `Synced ${calendars.length} calendars, ${totalEventsSynced} events updated, ${totalEventsDeleted} events deleted${errors.length > 0 ? `. Errors: ${errors.join("; ")}` : ""}`,
    });

    return {
      success: true,
      calendarsSynced: calendars.length,
      eventsSynced: totalEventsSynced,
      eventsDeleted: totalEventsDeleted,
      errors: errors.length > 0 ? errors : undefined,
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const forceFullSync = searchParams.get("forceFullSync") === "true";

    // Check for valid webhook request
    if (isValidWebhookRequest(authHeader)) {
      const body = await request.json();
      const userId = body.record?.id || body.userId;

      if (!userId || typeof userId !== "string") {
        throw validationError("Valid user ID required");
      }

      const result = await syncUserCalendars(userId, forceFullSync);
      return NextResponse.json(result);
    }

    // Otherwise, require authenticated user
    const user = await getUser();

    if (!user) {
      throw unauthorized();
    }

    const result = await syncUserCalendars(user.id, forceFullSync);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
