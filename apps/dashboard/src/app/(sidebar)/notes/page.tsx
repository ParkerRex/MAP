"use client";

import FolderBar from "@/components/notes/folder-bar";
import { useFolders, useNotes } from "@/hooks/use-notes";

export default function NotePage() {
	const { data: notesData, isLoading: notesLoading } = useNotes();
	const { data: foldersData, isLoading: foldersLoading } = useFolders();

	if (notesLoading || foldersLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				Loading...
			</div>
		);
	}

	const notes = notesData?.notes ?? [];
	const folders = foldersData?.folders ?? [];

	return (
		<div className="hidden flex-col md:flex w-full h-screen">
			<FolderBar folders={folders} notes={notes} />
		</div>
	);
}
