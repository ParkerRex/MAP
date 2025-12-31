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

// Folders
export const folders = pgTable("folder", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Notes
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  content: text("content"),
  folderId: uuid("folder_id").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Goals
export const goalCategoryEnum = pgEnum("goal_categories", ["health", "career", "personal", "financial", "social", "other"]);
export const goalStatusEnum = pgEnum("goal_status", ["not_started", "in_progress", "completed", "abandoned"]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  completed: boolean("completed").default(false),
  dueAt: timestamp("due_at").notNull(),
  userId: uuid("user_id").notNull(),
  goalCategory: goalCategoryEnum("goal_category").default("other"),
  goalStatus: goalStatusEnum("goal_status").default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Tasks
export const taskStatusEnum = pgEnum("task_status", ["todo", "in_progress", "done", "blocked"]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: uuid("updated_by").notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: uuid("deleted_by"),
  taskStatus: taskStatusEnum("task_status").default("todo"),
  taskPosition: integer("task_position"),
  headerId: uuid("header_id"),
  projectId: uuid("project_id"),
  assignedTo: uuid("assigned_to"),
  blockedBy: uuid("blocked_by"),
  contactId: uuid("contact_id"),
  scheduledFor: timestamp("scheduled_for"),
  result: text("result"),
});

// Tags
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  userId: uuid("user_id"),
});

// Tag Tasks (junction table)
export const tagTasks = pgTable("tag_tasks", {
  tagId: uuid("tag_id").notNull(),
  taskId: uuid("task_id").notNull(),
  parentId: uuid("parent_id"),
});

// Types
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type SyncLog = typeof syncLogs.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
