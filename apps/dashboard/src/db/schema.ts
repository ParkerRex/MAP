import { pgTable, text, boolean, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const integrationProviderEnum = pgEnum("integration_provider", ["GOOGLE", "WHOOP"]);

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").notNull(),
  calendarId: text("calendar_id").notNull(),
  summary: text("summary"),
  description: text("description"),
  location: text("location"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isAllDay: boolean("is_all_day"),
  colorId: text("color_id"),
  status: text("status"),
  creatorEmail: text("creator_email"),
  organizerEmail: text("organizer_email"),
  etag: text("etag"),
  iCalUid: text("i_cal_uid"),
  visibility: text("visibility"),
  transparency: text("transparency"),
  sequence: integer("sequence"),
  recurringEventId: text("recurring_event_id"),
  originalStartTime: text("original_start_time"),
  recurrence: text("recurrence").array(),
  guestsCanInviteOthers: boolean("guests_can_invite_others"),
  guestsCanModify: boolean("guests_can_modify"),
  guestsCanSeeOtherGuests: boolean("guests_can_see_other_guests"),
  contactId: text("contact_id"),
  created: text("created"),
  updated: text("updated"),
});

// Calendars
export const calendars = pgTable("calendars", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  provider: text("provider").notNull(),
  summary: text("summary"),
  description: text("description"),
  backgroundColor: text("background_color"),
  foregroundColor: text("foreground_color"),
  colorId: text("color_id"),
  selected: boolean("selected"),
  isPrimary: boolean("is_primary"),
  accessRole: text("access_role"),
  timeZone: text("time_zone"),
  etag: text("etag"),
  kind: text("kind"),
  emoji: text("emoji"),
  subtitle: text("subtitle"),
});

// Calendar Accounts
export const calendarAccounts = pgTable("calendar_accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Integrations
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  provider: integrationProviderEnum("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: text("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sync Logs
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar Event Attendees
export const calendarEventAttendees = pgTable("calendar_event_attendees", {
  eventId: text("event_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  responseStatus: text("response_status"),
  isOrganizer: boolean("is_organizer"),
  isSelf: boolean("is_self"),
  optional: boolean("optional"),
  contactId: text("contact_id"),
});

// Calendar Event Reminders
export const calendarEventReminders = pgTable("calendar_event_reminders", {
  eventId: text("event_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  method: text("method").notNull(),
  minutes: integer("minutes").notNull(),
});

// Calendar Color Definitions
export const calendarColorDefinitions = pgTable("calendar_color_definitions", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  background: text("background"),
  foreground: text("foreground"),
});

// Types
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type SyncLog = typeof syncLogs.$inferSelect;
