import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";
import {
  ensureCoachNotesFolder,
  fetchFolders,
  fetchNotes,
  fetchSharedNotes,
} from "./actions";

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    redirect("/login");
  }

  await ensureCoachNotesFolder(userId);

  const [notes, folders, sharedNotes] = await Promise.all([
    fetchNotes(),
    fetchFolders(userId),
    fetchSharedNotes(userId),
  ]);

  return <div className="flex w-full h-screen">{children}</div>;
}
