"use server";

import type { Note } from "@/types/notes";
import { db, schema } from "@map/supabase/server";
import { eq, and, sql, count } from "drizzle-orm";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

const { notes, folders } = schema;

export const addNote = async (formData: FormData) => {
	const title = formData.get("title") as string;
	const content = formData.get("content") as string;
	const user_id = formData.get("user_id") as string;

	if (!title) {
		throw new Error("Note title is required");
	}

	const result = await db
		.insert(notes)
		.values({
			title,
			content,
			userId: user_id,
		})
		.returning();

	console.log({ note: result });
	revalidatePath("/notes");
	return JSON.stringify({ data: result, error: null });
};

export const deleteNote = async (id: string) => {
	const result = await db.delete(notes).where(eq(notes.id, id)).returning();

	revalidatePath("/notes");
	return result;
};

export const fetchNotes = async () => {
	const result = await db.select().from(notes);
	return result;
};

export const fetchFolders = async (userId: string) => {
	// Get folders with note count using a subquery
	const result = await db
		.select({
			id: folders.id,
			name: folders.name,
			userId: folders.userId,
			createdAt: folders.createdAt,
			updatedAt: folders.updatedAt,
			notesCount: sql<number>`(SELECT COUNT(*) FROM notes WHERE notes.folder_id = ${folders.id})`.as(
				"notes_count",
			),
		})
		.from(folders)
		.where(eq(folders.userId, userId));

	return result.map((folder) => ({
		...folder,
		notes: [{ count: folder.notesCount }], // Match old format for compatibility
	}));
};

export const addFolder = async (name: string, userId: string) => {
	const result = await db
		.insert(folders)
		.values({
			name,
			userId,
		})
		.returning();

	revalidatePath("/notes");
	return result;
};

export const renameFolder = async (folderId: string, newName: string) => {
	const result = await db
		.update(folders)
		.set({ name: newName })
		.where(eq(folders.id, folderId))
		.returning();

	revalidatePath("/notes");
	return result;
};

export const deleteFolder = async (folderId: string) => {
	const result = await db.delete(folders).where(eq(folders.id, folderId)).returning();

	revalidatePath("/notes");
	return result;
};

export const addNoteToFolder = async (
	title: string,
	content: string,
	userId: string,
	folderId: string,
) => {
	console.log("Adding note with the following details:", {
		title,
		content,
		userId,
		folderId,
	});

	const result = await db
		.insert(notes)
		.values({
			title,
			content,
			userId,
			folderId,
		})
		.returning();

	console.log("Note added successfully:", result);
	revalidatePath("/notes");
	return result;
};

export const updateNote = async (
	id: string,
	updates: {
		title: string;
		content: string;
	},
) => {
	const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

	const result = await db
		.update(notes)
		.set({
			...updates,
			updatedAt: new Date(now),
		})
		.where(eq(notes.id, id))
		.returning();

	console.log("Note updated successfully:", result);
	revalidatePath("/notes");
	return result;
};

export const duplicateNote = async (note: Note) => {
	const result = await db
		.insert(notes)
		.values({
			title: `${note.title} (Copy)`,
			content: note.content,
			userId: note.user_id,
			folderId: note.folder_id,
		})
		.returning();

	console.log("Note duplicated successfully:", result);
	revalidatePath("/notes");
	return result;
};

export const moveNoteToFolder = async (noteId: string, newFolderId: string) => {
	console.log(`Moving note with ID ${noteId} to folder with ID ${newFolderId}`);

	const result = await db
		.update(notes)
		.set({ folderId: newFolderId })
		.where(eq(notes.id, noteId))
		.returning();

	console.log("Note moved successfully:", result);
	revalidatePath("/notes");
	return result;
};

export const ensureCoachNotesFolder = async (userId: string) => {
	// Check if the Coach Notes folder already exists
	const existingFolder = await db
		.select({ id: folders.id })
		.from(folders)
		.where(and(eq(folders.userId, userId), eq(folders.name, "Coach Notes")))
		.limit(1);

	if (existingFolder.length === 0) {
		// Create the Coach Notes folder
		const newFolder = await db
			.insert(folders)
			.values({
				name: "Coach Notes",
				userId,
			})
			.returning();

		console.log("Coach Notes folder created:", newFolder[0]);
		revalidatePath("/notes");
		return newFolder[0];
	}

	return existingFolder[0];
};
