import type { LucideIcon } from "lucide-react";

export type Note = {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  shared: boolean;
};

export type Folder = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  notesCount: number;
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
