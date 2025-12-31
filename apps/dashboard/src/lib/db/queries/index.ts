import { db, schema } from "../db";
import { eq, asc, desc, isNull, and } from "drizzle-orm";

const { users, goals, tasks, projects, headers, folders, notes, tags, tagTasks, calendars, calendarEvents, integrations } = schema;

export async function getUserQuery(userId: string) {
	const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	return result[0] || null;
}

export async function getGoalsQuery(userId: string) {
	return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.dueAt));
}

export async function getTasksQuery(userId: string) {
	return db
		.select()
		.from(tasks)
		.where(and(eq(tasks.createdBy, userId), isNull(tasks.deletedAt)))
		.orderBy(asc(tasks.dueAt));
}

export async function getProjectsQuery(userId: string) {
	return db
		.select()
		.from(projects)
		.where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
		.orderBy(desc(projects.createdAt));
}

export async function getHeadersQuery(userId: string) {
	return db
		.select()
		.from(headers)
		.where(and(eq(headers.userId, userId), isNull(headers.deletedAt)));
}

export async function getFoldersQuery(userId: string) {
	return db.select().from(folders).where(eq(folders.userId, userId));
}

export async function getNotesQuery(userId: string) {
	return db
		.select()
		.from(notes)
		.where(eq(notes.userId, userId))
		.orderBy(desc(notes.updatedAt));
}

export async function getTagsQuery(userId: string) {
	return db.select().from(tags).where(eq(tags.userId, userId));
}

export async function getTagTasksQuery(taskId: string) {
	return db.select().from(tagTasks).where(eq(tagTasks.taskId, taskId));
}

export async function getCalendarsQuery(accountId: string) {
	return db.select().from(calendars).where(eq(calendars.accountId, accountId));
}

export async function getCalendarEventsQuery(calendarId: string) {
	return db
		.select()
		.from(calendarEvents)
		.where(eq(calendarEvents.calendarId, calendarId))
		.orderBy(asc(calendarEvents.startTime));
}

export async function getIntegrationsQuery(userId: string) {
	return db.select().from(integrations).where(eq(integrations.userId, userId));
}
