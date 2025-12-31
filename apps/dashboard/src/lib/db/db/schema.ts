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
import { relations } from "drizzle-orm";

// Enums
export const goalCategoriesEnum = pgEnum("goal_categories", [
	"health",
	"work",
	"personal",
	"family",
	"spiritual",
]);

export const goalStatusEnum = pgEnum("goal_status", ["pending", "in_progress", "completed"]);

export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed"]);

export const integrationProviderEnum = pgEnum("integration_provider", ["WHOOP", "GOOGLE"]);

// Users
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	displayName: text("display_name"),
	email: text("email").notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	locale: text("locale"),
	profilePhotoUrl: text("profile_photo_url"),
	status: text("status").notNull().default("active"),
});

// Folders
export const folders = pgTable("folder", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	name: text("name").notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
	user: one(users, { fields: [folders.userId], references: [users.id] }),
	notes: many(notes),
}));

// Notes
export const notes = pgTable("notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	title: text("title"),
	content: text("content"),
	folderId: uuid("folder_id")
		.notNull()
		.references(() => folders.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export const notesRelations = relations(notes, ({ one }) => ({
	folder: one(folders, { fields: [notes.folderId], references: [folders.id] }),
	user: one(users, { fields: [notes.userId], references: [users.id] }),
}));

// Projects
export const projects = pgTable("projects", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
	name: text("name"),
	description: text("description"),
	projectPosition: integer("project_position"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// Headers
export const headers = pgTable("headers", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
	title: text("title").notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// Tasks
export const tasks = pgTable("tasks", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	body: text("body"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	dueAt: timestamp("due_at", { withTimezone: true }),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	taskStatus: taskStatusEnum("task_status").default("pending"),
	taskPosition: integer("task_position"),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	updatedBy: uuid("updated_by")
		.notNull()
		.references(() => users.id),
	assignedTo: uuid("assigned_to").references(() => users.id),
	completedBy: uuid("completed_by").references(() => users.id),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
	deletedBy: uuid("deleted_by").references(() => users.id),
	projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
	headerId: uuid("header_id").references(() => headers.id, { onDelete: "set null" }),
	blockedBy: uuid("blocked_by"),
	contactId: uuid("contact_id"),
	result: text("result"),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
	actualDuration: interval("actual_duration"),
	estimatedDuration: interval("estimated_duration"),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
	project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
	header: one(headers, { fields: [tasks.headerId], references: [headers.id] }),
	creator: one(users, { fields: [tasks.createdBy], references: [users.id] }),
}));

// Tags
export const tags = pgTable("tags", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// Tag-Task junction
export const tagTasks = pgTable(
	"tag_tasks",
	{
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
		taskId: uuid("task_id")
			.notNull()
			.references(() => tasks.id, { onDelete: "cascade" }),
		parentId: uuid("parent_id").references(() => tags.id, { onDelete: "set null" }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.tagId, table.taskId] }),
	}),
);

// Goals
export const goals = pgTable("goals", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
	title: text("title"),
	completed: boolean("completed").default(false),
	goalCategory: goalCategoriesEnum("goal_category").default("personal"),
	goalStatus: goalStatusEnum("goal_status").default("pending"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// Integrations
export const integrations = pgTable("integrations", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
	provider: integrationProviderEnum("provider").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

// Calendar Accounts
export const calendarAccounts = pgTable("calendar_accounts", {
	id: uuid("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	email: text("email").notNull(),
	provider: text("provider").notNull(),
});

// Calendars
export const calendars = pgTable("calendars", {
	id: text("id").primaryKey(),
	accountId: uuid("account_id")
		.notNull()
		.references(() => calendarAccounts.id, { onDelete: "cascade" }),
	provider: text("provider").notNull(),
	summary: text("summary"),
	description: text("description"),
	timeZone: text("time_zone"),
	backgroundColor: text("background_color"),
	foregroundColor: text("foreground_color"),
	isPrimary: boolean("is_primary").default(false),
	selected: boolean("selected").default(true),
	accessRole: text("access_role"),
	colorId: text("color_id"),
	emoji: text("emoji"),
	etag: text("etag"),
	kind: text("kind"),
	subtitle: text("subtitle"),
});

// Calendar Events
export const calendarEvents = pgTable(
	"calendar_events",
	{
		id: text("id").notNull(),
		calendarId: text("calendar_id")
			.notNull()
			.references(() => calendars.id, { onDelete: "cascade" }),
		summary: text("summary"),
		description: text("description"),
		startTime: text("start_time"),
		startDate: text("start_date"),
		endTime: text("end_time"),
		endDate: text("end_date"),
		isAllDay: boolean("is_all_day").default(false),
		location: text("location"),
		status: text("status"),
		recurrence: text("recurrence").array(),
		recurringEventId: text("recurring_event_id"),
		colorId: text("color_id"),
		created: text("created"),
		updated: text("updated"),
		creatorEmail: text("creator_email"),
		organizerEmail: text("organizer_email"),
		iCalUid: text("i_cal_uid"),
		etag: text("etag"),
		sequence: integer("sequence"),
		visibility: text("visibility"),
		transparency: text("transparency"),
		guestsCanInviteOthers: boolean("guests_can_invite_others"),
		guestsCanModify: boolean("guests_can_modify"),
		guestsCanSeeOtherGuests: boolean("guests_can_see_other_guests"),
		originalStartTime: text("original_start_time"),
		contactId: uuid("contact_id"),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id, table.calendarId] }),
	}),
);

// Preferences
export const preferences = pgTable("preferences", {
	userId: uuid("user_id")
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
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

// Sync Logs
export const syncLogs = pgTable("sync_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
	status: text("status").notNull(),
	message: text("message"),
});

// Contacts
export const contacts = pgTable("contacts", {
	id: uuid("id").primaryKey().defaultRandom(),
	accountId: uuid("account_id")
		.notNull()
		.references(() => calendarAccounts.id, { onDelete: "cascade" }),
	resourceName: text("resource_name").notNull(),
	displayName: text("display_name"),
	email: text("email"),
	photoUrl: text("photo_url"),
	etag: text("etag"),
	type: text("type"),
});
