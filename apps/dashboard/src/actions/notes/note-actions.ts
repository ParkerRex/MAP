// Break these into separate small functions
"use server";

import type { Note } from "@/types/notes";
import { formatForDatabase, formatForDisplay } from "@/utils/date-utils";
import { createClient } from "@map/supabase/server";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";

export const addNote = async (formData: FormData) => {
  const supabase = createClient();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const user_id = formData.get("user_id") as string;

  if (!title) {
    throw new Error("Note title is required");
  }

  const result = await supabase
    .from("note")
    .insert({
      title,
      content,
      user_id,
    })
    .select();

  console.log({
    note: result,
  });
  revalidatePath("/notes");
  return JSON.stringify(result);
};

export const deleteNote = async (id: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.from("note").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/notes");
  return data;
};

export const fetchNotes = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from("note").select("*");

  if (error) throw error;

  return data;
};

export const fetchFolders = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("folder")
    .select("*, notes(count)")
    .eq("user_id", userId);

  if (error) throw error;

  return data.map((folder) => ({
    ...folder,
    notesCount: folder.notes.length > 0 ? folder.notes[0].count : 0,
  }));
};

export const addFolder = async (name: string, userId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("folder")
    .insert({
      name,
      user_id: userId,
    })
    .select();

  if (error) throw error;

  revalidatePath("/notes");
  return data;
};

export const renameFolder = async (folderId: string, newName: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("folder")
    .update({
      name: newName,
    })
    .eq("id", folderId)
    .select();

  if (error) throw error;

  revalidatePath("/notes");
  return data;
};

export const deleteFolder = async (folderId: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("folder")
    .delete()
    .eq("id", folderId);

  if (error) throw error;

  revalidatePath("/notes");
  return data;
};

export const addNoteToFolder = async (
  title: string,
  content: string,
  userId: string,
  folderId: string,
) => {
  const supabase = createClient();

  console.log("Adding note with the following details:", {
    title,
    content,
    userId,
    folderId,
  });

  const { data, error } = await supabase
    .from("note")
    .insert({
      title,
      content,
      user_id: userId,
      folder_id: folderId,
    })
    .select();

  if (error) {
    console.error("Error adding note:", error);
    throw error;
  }

  console.log("Note added successfully:", data);
  revalidatePath("/notes");
  return data;
};

export const updateNote = async (
  id: string,
  updates: {
    title: string;
    content: string;
  },
) => {
  const supabase = createClient();

  const now = formatForDatabase(new Date());

  const { data, error } = await supabase
    .from("note")
    .update({
      ...updates,
      updated_at: now,
    })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating note:", error);
    throw error;
  }

  console.log("Note updated successfully:", data);
  revalidatePath("/notes");
  return data;
};

export const duplicateNote = async (note: Note) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("note")
    .insert({
      title: `${note.title} (Copy)`,
      content: note.content,
      user_id: note.user_id,
      folder_id: note.folder_id,
    })
    .select();

  if (error) {
    console.error("Error duplicating note:", error);
    throw error;
  }

  console.log("Note duplicated successfully:", data);
  revalidatePath("/notes");
  return data;
};

export const moveNoteToFolder = async (noteId: string, newFolderId: string) => {
  const supabase = createClient();

  console.log(`Moving note with ID ${noteId} to folder with ID ${newFolderId}`);

  const { data, error } = await supabase
    .from("note")
    .update({
      folder_id: newFolderId,
    })
    .eq("id", noteId)
    .select();

  if (error) {
    console.error("Error moving note:", error);
    throw error;
  }

  console.log("Note moved successfully:", data);

  // Revalidate the path to ensure the view updates
  revalidatePath("/notes");

  return data;
};

export const ensureCoachNotesFolder = async (userId: string) => {
  const supabase = createClient();

  // Check if the Coach Notes folder already exists
  const { data: existingFolder, error: checkError } = await supabase
    .from("folder")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Coach Notes")
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking for Coach Notes folder:", checkError);
    throw checkError;
  }

  if (!existingFolder) {
    // Create the Coach Notes folder
    const { data: newFolder, error: createError } = await supabase
      .from("folder")
      .insert({
        name: "Coach Notes",
        user_id: userId,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating Coach Notes folder:", createError);
      throw createError;
    }

    console.log("Coach Notes folder created:", newFolder);
    revalidatePath("/notes");
    return newFolder;
  }

  return existingFolder;
};
