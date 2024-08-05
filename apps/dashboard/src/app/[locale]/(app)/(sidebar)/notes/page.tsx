import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";
import {
  ensureCoachNotesFolder,
  fetchFolders,
  fetchNotes,
  fetchSharedNotes,
} from "./actions";
import FolderBar from "./components/folderbar";

export default async function NotePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    redirect("/login");
  }

  // Check if the coach folder exists, add if it's not there
  const { data: existingFolder } = await supabase
    .from("folder")
    .select()
    .eq("user_id", userId)
    .eq("name", "Coach Notes")
    .single();

  if (!existingFolder) {
    await supabase
      .from("folder")
      .insert({ name: "Coach Notes", user_id: userId });
  }

  const [notes, folders, sharedNotes] = await Promise.all([
    fetchNotes(),
    fetchFolders(userId),
    fetchSharedNotes(userId),
  ]);

  console.log("Fetched notes:", notes);
  console.log("Fetched folders:", folders);
  console.log("Fetched shared notes:", sharedNotes);

  return (
    <div className="hidden flex-col md:flex w-full h-screen">
      <FolderBar folders={folders} notes={notes} sharedNotes={sharedNotes} />
    </div>
  );
}
