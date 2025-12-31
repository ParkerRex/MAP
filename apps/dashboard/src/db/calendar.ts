import { db } from "./index";
import {
  calendarEvents,
  calendars,
  calendarAccounts,
  integrations,
  syncLogs,
  calendarEventAttendees,
  calendarColorDefinitions,
  type NewCalendarEvent,
  type NewCalendar,
} from "./schema";
import { eq, and, gte, lte, or } from "drizzle-orm";

export const calendarDb = {
  // Events
  async getEvents(calendarIds: string[], timeMin: string, timeMax: string) {
    return db
      .select()
      .from(calendarEvents)
      .where(
        and(
          or(...calendarIds.map((id) => eq(calendarEvents.calendarId, id))),
          or(
            // For timed events
            and(gte(calendarEvents.startTime, timeMin), lte(calendarEvents.startTime, timeMax)),
            // For all-day events
            and(gte(calendarEvents.startDate, timeMin.split("T")[0]), lte(calendarEvents.startDate, timeMax.split("T")[0]))
          )
        )
      );
  },

  async getEventById(eventId: string, calendarId: string) {
    const result = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.calendarId, calendarId)))
      .limit(1);
    return result[0] ?? null;
  },

  async createEvent(data: NewCalendarEvent) {
    const result = await db.insert(calendarEvents).values(data).returning();
    return result[0];
  },

  async updateEvent(eventId: string, calendarId: string, data: Partial<NewCalendarEvent>) {
    const result = await db
      .update(calendarEvents)
      .set(data)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.calendarId, calendarId)))
      .returning();
    return result[0];
  },

  async deleteEvent(eventId: string, calendarId: string) {
    const result = await db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.calendarId, calendarId)))
      .returning();
    return result[0];
  },

  // Calendars
  async getCalendarsByAccountId(accountId: string) {
    return db.select().from(calendars).where(eq(calendars.accountId, accountId));
  },

  async getCalendarById(calendarId: string) {
    const result = await db.select().from(calendars).where(eq(calendars.id, calendarId)).limit(1);
    return result[0] ?? null;
  },

  async upsertCalendar(data: NewCalendar) {
    const result = await db
      .insert(calendars)
      .values(data)
      .onConflictDoUpdate({
        target: calendars.id,
        set: {
          summary: data.summary,
          description: data.description,
          backgroundColor: data.backgroundColor,
          foregroundColor: data.foregroundColor,
          selected: data.selected,
          isPrimary: data.isPrimary,
          accessRole: data.accessRole,
          timeZone: data.timeZone,
        },
      })
      .returning();
    return result[0];
  },

  // Calendar Accounts
  async getCalendarAccountsByEmail(email: string) {
    return db.select().from(calendarAccounts).where(eq(calendarAccounts.email, email));
  },

  async upsertCalendarAccount(data: { id: string; email: string; provider: string }) {
    const result = await db
      .insert(calendarAccounts)
      .values(data)
      .onConflictDoUpdate({
        target: calendarAccounts.id,
        set: { email: data.email, provider: data.provider },
      })
      .returning();
    return result[0];
  },

  // Integrations
  async getIntegration(userId: string, provider: "GOOGLE" | "WHOOP") {
    const result = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)))
      .limit(1);
    return result[0] ?? null;
  },

  async updateIntegration(
    userId: string,
    provider: "GOOGLE" | "WHOOP",
    data: { accessToken?: string; refreshToken?: string; expiresAt?: string }
  ) {
    const result = await db
      .update(integrations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)))
      .returning();
    return result[0];
  },

  // Sync Logs
  async createSyncLog(data: { userId: string; status: string; message?: string }) {
    const result = await db.insert(syncLogs).values(data).returning();
    return result[0];
  },

  // Colors
  async getColors() {
    return db.select().from(calendarColorDefinitions);
  },

  // Attendees
  async getEventAttendees(eventId: string, calendarId: string) {
    return db
      .select()
      .from(calendarEventAttendees)
      .where(and(eq(calendarEventAttendees.eventId, eventId), eq(calendarEventAttendees.calendarId, calendarId)));
  },

  async deleteEventAttendees(eventId: string, calendarId: string) {
    return db
      .delete(calendarEventAttendees)
      .where(and(eq(calendarEventAttendees.eventId, eventId), eq(calendarEventAttendees.calendarId, calendarId)));
  },

  async insertEventAttendees(attendees: Array<{ eventId: string; calendarId: string; email: string; displayName?: string; responseStatus?: string; isOrganizer?: boolean; isSelf?: boolean; optional?: boolean }>) {
    if (attendees.length === 0) return [];
    return db.insert(calendarEventAttendees).values(attendees).returning();
  },
};
