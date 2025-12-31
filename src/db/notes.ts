import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { folders, type NewFolder, type NewNote, notes } from "./schema";

export const notesDb = {
  // Notes
  async getNotes(userId: string) {
    return db.select().from(notes).where(eq(notes.userId, userId));
  },

  async getNoteById(noteId: string) {
    const result = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
    return result[0] ?? null;
  },

  async createNote(data: NewNote) {
    const result = await db.insert(notes).values(data).returning();
    return result[0];
  },

  async updateNote(noteId: string, data: { title?: string; content?: string }) {
    const result = await db
      .update(notes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning();
    return result[0];
  },

  async deleteNote(noteId: string) {
    const result = await db.delete(notes).where(eq(notes.id, noteId)).returning();
    return result[0];
  },

  async moveNoteToFolder(noteId: string, folderId: string) {
    const result = await db.update(notes).set({ folderId }).where(eq(notes.id, noteId)).returning();
    return result[0];
  },

  async duplicateNote(noteId: string) {
    const original = await this.getNoteById(noteId);
    if (!original) throw new Error("Note not found");

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

  async getFolderById(folderId: string) {
    const result = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
    return result[0] ?? null;
  },

  async createFolder(data: NewFolder) {
    const result = await db.insert(folders).values(data).returning();
    return result[0];
  },

  async updateFolder(folderId: string, name: string) {
    const result = await db
      .update(folders)
      .set({ name, updatedAt: new Date() })
      .where(eq(folders.id, folderId))
      .returning();
    return result[0];
  },

  async deleteFolder(folderId: string) {
    // Delete all notes in folder first
    await db.delete(notes).where(eq(notes.folderId, folderId));
    const result = await db.delete(folders).where(eq(folders.id, folderId)).returning();
    return result[0];
  },

  async ensureCoachNotesFolder(userId: string) {
    // Check if exists
    const existing = await db.select().from(folders).where(eq(folders.userId, userId)).limit(1);

    const coachFolder = existing.find((f) => f.name === "Coach Notes");
    if (coachFolder) return coachFolder;

    // Create if not exists
    return this.createFolder({ name: "Coach Notes", userId });
  },
};
