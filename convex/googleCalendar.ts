import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";

// Google Calendar API types
interface GoogleCalendar {
  id: string;
  summary?: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  colorId?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole?: string;
  timeZone?: string;
  etag?: string;
  kind?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
  status?: string;
  creator?: { email?: string };
  organizer?: { email?: string };
  etag?: string;
  iCalUID?: string;
  visibility?: string;
  transparency?: string;
  sequence?: number;
  recurringEventId?: string;
  originalStartTime?: { dateTime?: string; date?: string };
  recurrence?: string[];
  guestsCanInviteOthers?: boolean;
  guestsCanModify?: boolean;
  guestsCanSeeOtherGuests?: boolean;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
    self?: boolean;
    optional?: boolean;
  }>;
}

interface GoogleEventsResponse {
  items?: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// Internal query to get tokens
export const getTokens = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "google"))
      .first();

    if (!integration) return null;

    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
    };
  },
});

// Internal mutation to update tokens after refresh
export const updateTokensInternal = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "google"))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        accessToken: args.accessToken,
        expiresAt: args.expiresAt,
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to upsert calendar account
export const upsertCalendarAccount = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    externalAccountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("calendarAccounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("provider"), "google"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        externalAccountId: args.externalAccountId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("calendarAccounts", {
      userId: args.userId,
      provider: "google",
      email: args.email,
      externalAccountId: args.externalAccountId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to upsert calendar
export const upsertCalendar = internalMutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("calendarAccounts"),
    calendar: v.object({
      externalId: v.string(),
      summary: v.optional(v.string()),
      description: v.optional(v.string()),
      backgroundColor: v.optional(v.string()),
      foregroundColor: v.optional(v.string()),
      colorId: v.optional(v.string()),
      selected: v.optional(v.boolean()),
      isPrimary: v.optional(v.boolean()),
      accessRole: v.optional(v.string()),
      timeZone: v.optional(v.string()),
      etag: v.optional(v.string()),
      kind: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("calendars")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.calendar.externalId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.calendar,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("calendars", {
      userId: args.userId,
      accountId: args.accountId,
      provider: "google",
      ...args.calendar,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to upsert event
export const upsertEvent = internalMutation({
  args: {
    userId: v.id("users"),
    calendarId: v.id("calendars"),
    event: v.object({
      externalId: v.string(),
      summary: v.optional(v.string()),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      startTime: v.string(),
      endTime: v.string(),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      isAllDay: v.optional(v.boolean()),
      colorId: v.optional(v.string()),
      status: v.optional(v.string()),
      creatorEmail: v.optional(v.string()),
      organizerEmail: v.optional(v.string()),
      etag: v.optional(v.string()),
      iCalUid: v.optional(v.string()),
      visibility: v.optional(v.string()),
      transparency: v.optional(v.string()),
      sequence: v.optional(v.number()),
      recurringEventId: v.optional(v.string()),
      originalStartTime: v.optional(v.string()),
      recurrence: v.optional(v.array(v.string())),
      guestsCanInviteOthers: v.optional(v.boolean()),
      guestsCanModify: v.optional(v.boolean()),
      guestsCanSeeOtherGuests: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("calendarEvents")
      .withIndex("by_calendar_external", (q) =>
        q.eq("calendarId", args.calendarId).eq("externalId", args.event.externalId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args.event,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("calendarEvents", {
      userId: args.userId,
      calendarId: args.calendarId,
      ...args.event,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to soft delete event
export const softDeleteEvent = internalMutation({
  args: {
    calendarId: v.id("calendars"),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendarEvents")
      .withIndex("by_calendar_external", (q) =>
        q.eq("calendarId", args.calendarId).eq("externalId", args.externalId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to upsert attendees
export const upsertAttendees = internalMutation({
  args: {
    calendarId: v.id("calendars"),
    eventId: v.id("calendarEvents"),
    attendees: v.array(
      v.object({
        email: v.string(),
        displayName: v.optional(v.string()),
        responseStatus: v.optional(v.string()),
        isOrganizer: v.optional(v.boolean()),
        isSelf: v.optional(v.boolean()),
        optional: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing attendees for this event
    const existing = await ctx.db
      .query("calendarEventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const attendee of existing) {
      await ctx.db.delete(attendee._id);
    }

    // Insert new attendees
    for (const attendee of args.attendees) {
      await ctx.db.insert("calendarEventAttendees", {
        calendarId: args.calendarId,
        eventId: args.eventId,
        ...attendee,
      });
    }
  },
});

// Internal mutation to save/update sync token
export const saveSyncToken = internalMutation({
  args: {
    calendarId: v.id("calendars"),
    syncToken: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendarSyncTokens")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        syncToken: args.syncToken,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("calendarSyncTokens", {
      calendarId: args.calendarId,
      syncToken: args.syncToken,
      updatedAt: Date.now(),
    });
  },
});

// Internal query to get sync token
export const getSyncToken = internalQuery({
  args: { calendarId: v.id("calendars") },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("calendarSyncTokens")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .first();
    return token?.syncToken ?? null;
  },
});

// Internal query to get calendar by external ID
export const getCalendarByExternalId = internalQuery({
  args: { userId: v.id("users"), externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendars")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

// Internal mutation to log sync
export const logSyncInternal = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    status: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", {
      userId: args.userId,
      provider: args.provider,
      status: args.status,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

// Helper to refresh token if needed
async function getValidAccessToken(
  ctx: any,
  userId: Id<"users">,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: number | null;
  },
): Promise<string> {
  // Check if token is expired or will expire in 5 minutes
  if (tokens.expiresAt && tokens.refreshToken) {
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    if (tokens.expiresAt < fiveMinutesFromNow) {
      // Refresh the token
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: tokens.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh Google access token");
      }

      const newTokens = await response.json();
      const expiresAt = Date.now() + newTokens.expires_in * 1000;

      // Update tokens in database
      await ctx.runMutation(internal.googleCalendar.updateTokensInternal, {
        userId,
        accessToken: newTokens.access_token,
        expiresAt,
      });

      return newTokens.access_token;
    }
  }

  return tokens.accessToken;
}

/**
 * Sync calendars from Google Calendar API
 */
export const syncCalendars = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get tokens
    const tokens = await ctx.runQuery(internal.googleCalendar.getTokens, {
      userId: args.userId,
    });

    if (!tokens) {
      throw new Error("No Google integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    // Fetch calendars from Google
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      await ctx.runMutation(internal.googleCalendar.logSyncInternal, {
        userId: args.userId,
        provider: "google",
        status: "error",
        message: `Failed to fetch calendars: ${error}`,
      });
      throw new Error(`Failed to fetch calendars: ${error}`);
    }

    const data = await response.json();
    const calendars: GoogleCalendar[] = data.items ?? [];

    // Get or create calendar account
    const primaryCalendar = calendars.find((c) => c.primary);
    const accountId = await ctx.runMutation(internal.googleCalendar.upsertCalendarAccount, {
      userId: args.userId,
      email: primaryCalendar?.id ?? "unknown",
      externalAccountId: primaryCalendar?.id,
    });

    // Upsert each calendar
    const results = [];
    for (const calendar of calendars) {
      const calendarId = await ctx.runMutation(internal.googleCalendar.upsertCalendar, {
        userId: args.userId,
        accountId,
        calendar: {
          externalId: calendar.id,
          summary: calendar.summary,
          description: calendar.description,
          backgroundColor: calendar.backgroundColor,
          foregroundColor: calendar.foregroundColor,
          colorId: calendar.colorId,
          selected: calendar.selected,
          isPrimary: calendar.primary,
          accessRole: calendar.accessRole,
          timeZone: calendar.timeZone,
          etag: calendar.etag,
          kind: calendar.kind,
        },
      });
      results.push({ externalId: calendar.id, calendarId });
    }

    await ctx.runMutation(internal.googleCalendar.logSyncInternal, {
      userId: args.userId,
      provider: "google",
      status: "success",
      message: `Synced ${calendars.length} calendars`,
    });

    return { calendars: results };
  },
});

/**
 * Sync events from a specific calendar
 */
export const syncEvents = action({
  args: {
    userId: v.id("users"),
    calendarExternalId: v.string(),
    fullSync: v.optional(v.boolean()),
    timeMin: v.optional(v.string()),
    timeMax: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get tokens
    const tokens = await ctx.runQuery(internal.googleCalendar.getTokens, {
      userId: args.userId,
    });

    if (!tokens) {
      throw new Error("No Google integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    // Get calendar from DB
    const calendar = await ctx.runQuery(internal.googleCalendar.getCalendarByExternalId, {
      userId: args.userId,
      externalId: args.calendarExternalId,
    });

    if (!calendar) {
      throw new Error(`Calendar ${args.calendarExternalId} not found`);
    }

    // Get existing sync token for incremental sync
    let syncToken: string | null = null;
    if (!args.fullSync) {
      syncToken = await ctx.runQuery(internal.googleCalendar.getSyncToken, {
        calendarId: calendar._id,
      });
    }

    // Build API URL
    const params = new URLSearchParams({
      maxResults: "2500",
      singleEvents: "true",
    });

    if (syncToken && !args.fullSync) {
      params.set("syncToken", syncToken);
    } else {
      // Full sync - get events from now
      const timeMin = args.timeMin ?? new Date().toISOString();
      params.set("timeMin", timeMin);
      if (args.timeMax) {
        params.set("timeMax", args.timeMax);
      }
    }

    let allEvents: GoogleEvent[] = [];
    let pageToken: string | undefined;
    let newSyncToken: string | undefined;

    // Paginate through all events
    do {
      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(args.calendarExternalId)}/events?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        // If sync token is invalid, do a full sync
        if (response.status === 410 && syncToken) {
          return await ctx.runAction(internal.googleCalendar.syncEvents, {
            userId: args.userId,
            calendarExternalId: args.calendarExternalId,
            fullSync: true,
            timeMin: args.timeMin,
            timeMax: args.timeMax,
          });
        }

        const error = await response.text();
        throw new Error(`Failed to fetch events: ${error}`);
      }

      const data: GoogleEventsResponse = await response.json();
      allEvents = allEvents.concat(data.items ?? []);
      pageToken = data.nextPageToken;
      newSyncToken = data.nextSyncToken;
    } while (pageToken);

    // Process events
    const created = 0;
    let updated = 0;
    let deleted = 0;

    for (const event of allEvents) {
      // Handle cancelled/deleted events
      if (event.status === "cancelled") {
        await ctx.runMutation(internal.googleCalendar.softDeleteEvent, {
          calendarId: calendar._id,
          externalId: event.id,
        });
        deleted++;
        continue;
      }

      // Upsert event
      const startTime = event.start?.dateTime ?? event.start?.date ?? "";
      const endTime = event.end?.dateTime ?? event.end?.date ?? "";

      await ctx.runMutation(internal.googleCalendar.upsertEvent, {
        userId: args.userId,
        calendarId: calendar._id,
        event: {
          externalId: event.id,
          summary: event.summary,
          description: event.description,
          location: event.location,
          startTime,
          endTime,
          startDate: event.start?.date,
          endDate: event.end?.date,
          isAllDay: !!event.start?.date,
          colorId: event.colorId,
          status: event.status,
          creatorEmail: event.creator?.email,
          organizerEmail: event.organizer?.email,
          etag: event.etag,
          iCalUid: event.iCalUID,
          visibility: event.visibility,
          transparency: event.transparency,
          sequence: event.sequence,
          recurringEventId: event.recurringEventId,
          originalStartTime: event.originalStartTime?.dateTime ?? event.originalStartTime?.date,
          recurrence: event.recurrence,
          guestsCanInviteOthers: event.guestsCanInviteOthers,
          guestsCanModify: event.guestsCanModify,
          guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
        },
      });
      updated++;
    }

    // Save new sync token
    if (newSyncToken) {
      await ctx.runMutation(internal.googleCalendar.saveSyncToken, {
        calendarId: calendar._id,
        syncToken: newSyncToken,
      });
    }

    await ctx.runMutation(internal.googleCalendar.logSyncInternal, {
      userId: args.userId,
      provider: "google",
      status: "success",
      message: `Synced events: ${updated} updated, ${deleted} deleted`,
    });

    return { updated, deleted, syncToken: newSyncToken };
  },
});

/**
 * Full sync of all calendars and their events
 */
export const fullSync = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // First sync calendars
    const calendarResult = await ctx.runAction(internal.googleCalendar.syncCalendars, {
      userId: args.userId,
    });

    // Then sync events for each calendar
    const eventResults = [];
    for (const cal of calendarResult.calendars) {
      try {
        const result = await ctx.runAction(internal.googleCalendar.syncEvents, {
          userId: args.userId,
          calendarExternalId: cal.externalId,
          fullSync: true,
        });
        eventResults.push({ calendarId: cal.externalId, ...result });
      } catch (error) {
        eventResults.push({
          calendarId: cal.externalId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      calendars: calendarResult.calendars.length,
      events: eventResults,
    };
  },
});
