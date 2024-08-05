"use server";
import { createClient } from "@map/supabase/server";
import { fetchFolders, fetchNotes, fetchSharedNotes } from "./actions";

export default async function useNote() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const [notes, folders, sharedNotes] = await Promise.all([
    fetchNotes(),
    fetchFolders(userId),
    fetchSharedNotes(userId),
  ]);

  return {
    notes,
    folders,
    sharedNotes,
  };
}
