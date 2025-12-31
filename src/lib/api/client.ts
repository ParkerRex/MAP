import { ApiError, ErrorCodes } from "./errors";
import type { Task, Tag, Note, Folder, Goal } from "@/db/schema";
import type { calendar_v3 } from "googleapis";

export interface TaskWithTags extends Task {
  tags: { id: string; title: string }[];
}

export interface TasksResponse {
  tasks: TaskWithTags[];
}

export interface TaskResponse {
  task: Task;
}

export interface TagsResponse {
  tags: Tag[];
}

export interface TagResponse {
  tag: Tag;
}

export interface NotesResponse {
  notes: Note[];
}

export interface NoteResponse {
  note: Note;
}

export interface FoldersResponse {
  folders: (Folder & { notesCount: number })[];
}

export interface FolderResponse {
  folder: Folder;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface GoalResponse {
  goal: Goal;
}

export interface GoalStatsResponse {
  stats: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
}

type CalendarEvent = calendar_v3.Schema$Event;
type CalendarListEntry = calendar_v3.Schema$CalendarListEntry;

export interface EventsResponse {
  events: CalendarEvent[];
}

export interface CalendarsResponse {
  calendars: CalendarListEntry[];
}

export interface ColorsResponse {
  colors: calendar_v3.Schema$Colors;
}

export interface SyncResponse {
  success: boolean;
  calendarsSynced?: number;
  eventsSynced?: number;
  error?: string;
}

export interface CreateTaskInput {
  title: string;
  body?: string;
  dueAt?: string;
}

export interface UpdateTaskInput {
  title?: string;
  body?: string;
  dueAt?: string | null;
  completed?: boolean;
  tags?: string[];
}

export interface CreateTagInput {
  title: string;
}

export interface UpdateTagInput {
  title: string;
}

class ApiClient {
  private baseUrl = "/api";

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.error?.code ?? ErrorCodes.REQUEST_FAILED,
        error.error?.message ?? \`Request failed: \${response.status}\`,
        response.status,
        error.error?.details
      );
    }

    return response.json();
  }

  tasks = {
    list: () => this.request<TasksResponse>("/tasks"),
    get: (id: string) => this.request<TaskResponse>(\`/tasks/\${id}\`),
    create: (data: CreateTaskInput) =>
      this.request<TaskResponse>("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTaskInput) =>
      this.request<TaskResponse>(\`/tasks/\${id}\`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(\`/tasks/\${id}\`, { method: "DELETE" }),
  };

  tags = {
    list: () => this.request<TagsResponse>("/tags"),
    get: (id: string) => this.request<TagResponse>(\`/tags/\${id}\`),
    create: (data: CreateTagInput) =>
      this.request<TagResponse>("/tags", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UpdateTagInput) =>
      this.request<TagResponse>(\`/tags/\${id}\`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(\`/tags/\${id}\`, { method: "DELETE" }),
  };
}

export const api = new ApiClient();
