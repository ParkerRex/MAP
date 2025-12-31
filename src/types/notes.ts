import type { LucideIcon } from "lucide-react";
import type { Folder as DrizzleFolder, Note as DrizzleNote } from "@/db/schema";

export type Note = DrizzleNote;

export type Folder = DrizzleFolder & {
  notesCount?: number;
};

export interface FolderBarProps {
  folders: FolderType[];
  notes: Note[];
}

export interface FolderType {
  id: string;
  name: string;
  notesCount: number;
}

export interface LinkItem {
  id: string;
  title: string;
  label: string;
  icon: LucideIcon | React.FC<React.ComponentProps<LucideIcon>>;
  variant: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isSelected: boolean;
}
