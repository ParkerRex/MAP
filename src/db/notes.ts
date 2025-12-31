import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { folders, type NewFolder, type NewNote, notes } from "./schema";

export const notesDb = {
  // Notes
  async getNotes(userId: string) {
    return db.select().from(notes).where(eq(notes.userId, userId));
  },

  async getNoteById(noteId: string, userId: string) {
    const result = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async createNote(data: NewNote) {
    const result = await db.insert(notes).values(data).returning();
    return result[0];
  },

  async updateNote(noteId: string, userId: string, data: { title?: string; content?: string }) {
    const result = await db
      .update(notes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async deleteNote(noteId: string, userId: string) {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async moveNoteToFolder(noteId: string, userId: string, folderId: string) {
    const result = await db
      .update(notes)
      .set({ folderId })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async duplicateNote(noteId: string, userId: string) {
    const original = await this.getNoteById(noteId, userId);
    if (!original) return null;

    return this.createNote({
      title: `${original.title} (Copy)`,
      content: original.content,
      userId: original.userId,
      folderId: original.folderId,
    });
  },

  // Folders
  async getFolders(userId: string) {
    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        userId: folders.userId,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
        notesCount:
          sql<number>`(SELECT COUNT(*) FROM notes WHERE notes.folder_id = ${folders.id})`.as(
            "notes_count",
          ),
      })
      .from(folders)
      .where(eq(folders.userId, userId));
    return result;
  },

  async getFolderById(folderId: string, userId: string) {
    const result = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async createFolder(data: NewFolder) {
    const result = await db.insert(folders).values(data).returning();
    return result[0];
  },

  async updateFolder(folderId: string, userId: string, name: string) {
    const result = await db
      .update(folders)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();
    return result[0] ?? null;
  },

  async deleteFolder(folderId: string, userId: string) {
    // Delete folder first (ownership verified in WHERE clause)
    const result = await db
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();

    // Only delete notes if folder was actually deleted
    if (result[0]) {
      await db.delete(notes).where(eq(notes.folderId, folderId));
    }

    return result[0] ?? null;
  },

  async ensureCoachNotesFolder(userId: string) {
    const existing = await db.select().from(folders).where(eq(folders.userId, userId));

    const coachFolder = existing.find((f) => f.name === "Coach Notes");
    if (coachFolder) return coachFolder;

    return this.createFolder({ name: "Coach Notes", userId });
  },
};
