"use server";
import { fetchFolders, fetchNotes } from "@/actions/notes/note-actions";
import { createClient } from "@map/supabase/server";

export default async function useNote() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [notes, folders] = await Promise.all([
    fetchNotes(),
    fetchFolders(userId),
  ]);

  return {
    notes,
    folders,
  };
}
