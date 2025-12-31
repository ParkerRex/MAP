"use server";

import { db, schema, DEV_USER } from "@map/supabase/server";
import { eq, isNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const { tasks, tags, tagTasks } = schema;

export const getAllTasks = async () => {
	const result = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.createdBy, DEV_USER.id), isNull(tasks.deletedAt)));

	return result;
};

export const getAllTags = async () => {
	const result = await db.select().from(tags).where(eq(tags.userId, DEV_USER.id));

	return result;
};

export const createTag = async (title: string) => {
	const result = await db
		.insert(tags)
		.values({
			title,
			userId: DEV_USER.id,
		})
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const updateTag = async (id: string, title: string) => {
	const result = await db.update(tags).set({ title }).where(eq(tags.id, id)).returning();

	revalidatePath("/tasks");
	return result[0];
};

export const deleteTag = async (id: string) => {
	// First delete tag-task associations
	await db.delete(tagTasks).where(eq(tagTasks.tagId, id));

	// Then delete the tag
	const result = await db.delete(tags).where(eq(tags.id, id)).returning();

	revalidatePath("/tasks");
	return result[0];
};

export const handleCreateTask = async (title: string, projectId?: string) => {
	const result = await db
		.insert(tasks)
		.values({
			title,
			createdBy: DEV_USER.id,
			updatedBy: DEV_USER.id,
			projectId: projectId || null,
			taskStatus: "pending",
		})
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const handleDeleteTask = async (id: string) => {
	// Soft delete
	const result = await db
		.update(tasks)
		.set({
			deletedAt: new Date(),
			deletedBy: DEV_USER.id,
		})
		.where(eq(tasks.id, id))
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const updateTaskDueDate = async (id: string, dueAt: Date | null) => {
	const result = await db
		.update(tasks)
		.set({
			dueAt,
			updatedAt: new Date(),
			updatedBy: DEV_USER.id,
		})
		.where(eq(tasks.id, id))
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const handleToggleTask = async (id: string, completed: boolean) => {
	const result = await db
		.update(tasks)
		.set({
			taskStatus: completed ? "completed" : "pending",
			completedAt: completed ? new Date() : null,
			completedBy: completed ? DEV_USER.id : null,
			updatedAt: new Date(),
			updatedBy: DEV_USER.id,
		})
		.where(eq(tasks.id, id))
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const updateTaskTags = async (taskId: string, tagIds: string[]) => {
	// Delete existing tag associations
	await db.delete(tagTasks).where(eq(tagTasks.taskId, taskId));

	// Insert new tag associations
	if (tagIds.length > 0) {
		await db.insert(tagTasks).values(
			tagIds.map((tagId) => ({
				tagId,
				taskId,
			})),
		);
	}

	revalidatePath("/tasks");
	return { success: true };
};

export const updateTaskTitle = async (id: string, title: string) => {
	const result = await db
		.update(tasks)
		.set({
			title,
			updatedAt: new Date(),
			updatedBy: DEV_USER.id,
		})
		.where(eq(tasks.id, id))
		.returning();

	revalidatePath("/tasks");
	return result[0];
};

export const updateTaskBody = async (id: string, body: string) => {
	const result = await db
		.update(tasks)
		.set({
			body,
			updatedAt: new Date(),
			updatedBy: DEV_USER.id,
		})
		.where(eq(tasks.id, id))
		.returning();

	revalidatePath("/tasks");
	return result[0];
};
