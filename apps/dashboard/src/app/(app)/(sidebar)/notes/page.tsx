import { fetchFolders, fetchNotes } from "@/actions/notes/note-actions";
import FolderBar from "@/components/notes/folder-bar";

export default async function NotePage() {
  const [notes, folders] = await Promise.all([
    fetchNotes(),
    fetchFolders(userId),
  ]);

  console.log("Fetched notes:", notes);
  console.log("Fetched folders:", folders);

  return (
    <div className="hidden flex-col md:flex w-full h-screen">
      <FolderBar folders={folders} notes={notes} />
    </div>
  );
}
