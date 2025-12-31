import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().max(100000).optional(),
  folderId: z.string().uuid("Folder ID is required"),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().max(100000).optional().nullable(),
  folderId: z.string().uuid().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
