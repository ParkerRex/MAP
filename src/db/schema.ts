import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  interval,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const integrationProviderEnum = pgEnum("integration_provider", [
  "GOOGLE",
  "WHOOP",
  "CLAUDE",
  "OPENAI",
]);
export const goalCategoryEnum = pgEnum("goal_categories", [
  "health",
  "work",
  "personal",
  "family",
  "spiritual",
]);
export const goalStatusEnum = pgEnum("goal_status", ["pending", "in_progress", "completed"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed"]);

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  email: text("email").notNull().unique(),
  // Google's 'sub' claim - primary identifier for Google-only auth
  googleId: text("google_id").notNull().unique(),
  displayName: text("display_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  locale: text("locale"),
  profilePhotoUrl: text("profile_photo_url"),
  githubUsername: text("github_username"),
  status: text("status").notNull().default("active"),
});

// Sessions
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Folders
export const folders = pgTable("folder", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  notes: many(notes),
}));

// Notes
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  content: text("content"),
  folderId: uuid("folder_id").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const notesRelations = relations(notes, ({ one }) => ({
  folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
  user: one(users, { fields: [notes.userId], references: [users.id] }),
}));

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  description: text("description"),
  projectPosition: integer("project_position"),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Headers
export const headers = pgTable("headers", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Goals
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  completed: boolean("completed").default(false),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  userId: uuid("user_id").notNull(),
  goalCategory: goalCategoryEnum("goal_category").default("personal"),
  goalStatus: goalStatusEnum("goal_status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedBy: uuid("completed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by"),
  taskStatus: taskStatusEnum("task_status").default("pending"),
  taskPosition: integer("task_position"),
  headerId: uuid("header_id"),
  projectId: uuid("project_id"),
  assignedTo: uuid("assigned_to"),
  blockedBy: uuid("blocked_by"),
  contactId: uuid("contact_id"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  result: text("result"),
  actualDuration: interval("actual_duration"),
  estimatedDuration: interval("estimated_duration"),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  header: one(headers, { fields: [tasks.headerId], references: [headers.id] }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
}));

// Tags
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  userId: uuid("user_id"),
});

// Tag Tasks (junction table)
export const tagTasks = pgTable(
  "tag_tasks",
  {
    tagId: uuid("tag_id").notNull(),
    taskId: uuid("task_id").notNull(),
    parentId: uuid("parent_id"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tagId, table.taskId] }),
  }),
);

// Integrations
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  provider: integrationProviderEnum("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Calendar Accounts
export const calendarAccounts = pgTable("calendar_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Calendars
export const calendars = pgTable("calendars", {
  id: text("id").primaryKey(),
  accountId: uuid("account_id").notNull(),
  provider: text("provider").notNull(),
  summary: text("summary"),
  description: text("description"),
  backgroundColor: text("background_color"),
  foregroundColor: text("foreground_color"),
  colorId: text("color_id"),
  selected: boolean("selected").default(true),
  isPrimary: boolean("is_primary").default(false),
  accessRole: text("access_role"),
  timeZone: text("time_zone"),
  etag: text("etag"),
  kind: text("kind"),
  emoji: text("emoji"),
  subtitle: text("subtitle"),
});

// Calendar Events
export const calendarEvents = pgTable(
  "calendar_events",
  {
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
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.calendarId] }),
  }),
);

// Calendar Event Attendees
export const calendarEventAttendees = pgTable(
  "calendar_event_attendees",
  {
    calendarId: text("calendar_id").notNull(),
    eventId: text("event_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    responseStatus: text("response_status"),
    isOrganizer: boolean("is_organizer"),
    isSelf: boolean("is_self"),
    optional: boolean("optional"),
    contactId: uuid("contact_id"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.calendarId, table.eventId, table.email] }),
  }),
);

// Calendar Sync Tokens
export const calendarSyncTokens = pgTable("calendar_sync_tokens", {
  calendarId: text("calendar_id").primaryKey(),
  syncToken: text("sync_token").notNull(),
});

// Sync Logs
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Preferences
export const preferences = pgTable("preferences", {
  userId: uuid("user_id").primaryKey(),
  primaryTimeZone: text("primary_time_zone"),
  preferredLocale: text("preferred_locale"),
  showWeekNumbers: boolean("show_week_numbers"),
  dismissedWelcomeDialog: boolean("dismissed_welcome_dialog"),
  dismissedWelcomeChecklist: boolean("dismissed_welcome_checklist"),
  dismissedReferralCard: boolean("dismissed_referral_card"),
  shownWelcomeDialog: boolean("shown_welcome_dialog"),
  autoAddConferencingPromptViewed: boolean("auto_add_conferencing_prompt_viewed"),
  autoChangeTimeZonesPromptEnabled: boolean("auto_change_time_zones_prompt_enabled"),
});

// Contacts
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull(),
  resourceName: text("resource_name").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  photoUrl: text("photo_url"),
  etag: text("etag"),
  type: text("type"),
});

// WHOOP Score State Enum
export const whoopScoreStateEnum = pgEnum("whoop_score_state", [
  "SCORED",
  "PENDING_SCORE",
  "UNSCORABLE",
]);

// WHOOP Cycles (Physiological Cycles)
export const whoopCycles = pgTable("whoop_cycles", {
  id: text("id").primaryKey(), // WHOOP cycle ID
  odataId: text("odata_id"), // Original v1 ID for migration
  userId: uuid("user_id").notNull(),
  whoopUserId: text("whoop_user_id").notNull(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  end: timestamp("end", { withTimezone: true }),
  timezoneOffset: text("timezone_offset"),
  scoreState: whoopScoreStateEnum("score_state").notNull(),
  strain: text("strain"), // Stored as text to preserve precision
  kilojoule: text("kilojoule"),
  averageHeartRate: integer("average_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// WHOOP Recovery
export const whoopRecovery = pgTable("whoop_recovery", {
  id: uuid("id").primaryKey().defaultRandom(),
  cycleId: text("cycle_id")
    .notNull()
    .references(() => whoopCycles.id, { onDelete: "cascade" }),
  sleepId: text("sleep_id"), // UUID from WHOOP
  userId: uuid("user_id").notNull(),
  whoopUserId: text("whoop_user_id").notNull(),
  scoreState: whoopScoreStateEnum("score_state").notNull(),
  recoveryScore: integer("recovery_score"), // 0-100
  restingHeartRate: text("resting_heart_rate"), // bpm
  hrvRmssd: text("hrv_rmssd"), // ms
  spo2Percentage: text("spo2_percentage"), // % blood oxygen
  skinTempCelsius: text("skin_temp_celsius"), // °C
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// WHOOP Sleep
export const whoopSleep = pgTable("whoop_sleep", {
  id: text("id").primaryKey(), // WHOOP sleep UUID
  odataId: text("odata_id"), // Original v1 ID
  cycleId: text("cycle_id").references(() => whoopCycles.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").notNull(),
  whoopUserId: text("whoop_user_id").notNull(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  end: timestamp("end", { withTimezone: true }),
  timezoneOffset: text("timezone_offset"),
  isNap: boolean("is_nap").default(false),
  scoreState: whoopScoreStateEnum("score_state").notNull(),
  // Sleep stages (in milliseconds)
  totalInBedTime: integer("total_in_bed_time"),
  totalAwakeTime: integer("total_awake_time"),
  totalNoDataTime: integer("total_no_data_time"),
  totalLightSleepTime: integer("total_light_sleep_time"),
  totalSlowWaveSleepTime: integer("total_slow_wave_sleep_time"),
  totalRemSleepTime: integer("total_rem_sleep_time"),
  sleepCycleCount: integer("sleep_cycle_count"),
  disturbanceCount: integer("disturbance_count"),
  // Sleep quality metrics
  sleepNeeded: integer("sleep_needed"), // Baseline + adjustments
  respiratoryRate: text("respiratory_rate"),
  sleepPerformancePercentage: text("sleep_performance_percentage"),
  sleepConsistencyPercentage: text("sleep_consistency_percentage"),
  sleepEfficiencyPercentage: text("sleep_efficiency_percentage"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// WHOOP Workouts
export const whoopWorkouts = pgTable("whoop_workouts", {
  id: text("id").primaryKey(), // WHOOP workout UUID
  odataId: text("odata_id"), // Original v1 ID
  userId: uuid("user_id").notNull(),
  whoopUserId: text("whoop_user_id").notNull(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  end: timestamp("end", { withTimezone: true }),
  timezoneOffset: text("timezone_offset"),
  sportId: integer("sport_id"),
  sportName: text("sport_name"),
  scoreState: whoopScoreStateEnum("score_state").notNull(),
  // Workout metrics
  strain: text("strain"), // 0-21 scale
  averageHeartRate: integer("average_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  kilojoule: text("kilojoule"),
  distanceMeters: text("distance_meters"),
  altitudeGainMeters: text("altitude_gain_meters"),
  altitudeLossMeters: text("altitude_loss_meters"),
  // Heart rate zones (in milliseconds)
  zoneZeroMs: integer("zone_zero_ms"),
  zoneOneMs: integer("zone_one_ms"),
  zoneTwoMs: integer("zone_two_ms"),
  zoneThreeMs: integer("zone_three_ms"),
  zoneFourMs: integer("zone_four_ms"),
  zoneFiveMs: integer("zone_five_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// WHOOP User Profile (cached from API)
export const whoopProfiles = pgTable("whoop_profiles", {
  userId: uuid("user_id").primaryKey(),
  whoopUserId: text("whoop_user_id").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  heightMeter: text("height_meter"),
  weightKilogram: text("weight_kilogram"),
  maxHeartRate: integer("max_heart_rate"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
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
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Header = typeof headers.$inferSelect;
export type NewHeader = typeof headers.$inferInsert;
export type Preference = typeof preferences.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type CalendarSyncToken = typeof calendarSyncTokens.$inferSelect;
export type CalendarAccount = typeof calendarAccounts.$inferSelect;
export type CalendarEventAttendee = typeof calendarEventAttendees.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type WhoopCycle = typeof whoopCycles.$inferSelect;
export type NewWhoopCycle = typeof whoopCycles.$inferInsert;
export type WhoopRecovery = typeof whoopRecovery.$inferSelect;
export type NewWhoopRecovery = typeof whoopRecovery.$inferInsert;
export type WhoopSleep = typeof whoopSleep.$inferSelect;
export type NewWhoopSleep = typeof whoopSleep.$inferInsert;
export type WhoopWorkout = typeof whoopWorkouts.$inferSelect;
export type NewWhoopWorkout = typeof whoopWorkouts.$inferInsert;
export type WhoopProfile = typeof whoopProfiles.$inferSelect;
export type NewWhoopProfile = typeof whoopProfiles.$inferInsert;
