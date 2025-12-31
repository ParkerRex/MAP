import { ApiError, ErrorCodes } from "./errors";
import type { Task, Tag, Note, Folder, Goal } from "@/db/schema";
import type { calendar_v3 } from "googleapis";

// Response types
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

// Input types
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

export interface CreateNoteInput {
  title: string;
  content?: string;
  folderId: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  folderId?: string;
}

export interface CreateFolderInput {
  name: string;
}

export interface UpdateFolderInput {
  name: string;
}

export interface CreateGoalInput {
  title: string;
  dueAt?: string;
}

export interface UpdateGoalInput {
  title?: string;
  dueAt?: string;
  completed?: boolean;
}

export interface CreateTagInput {
  title: string;
}

export interface UpdateTagInput {
  title: string;
}

class ApiClient {
  private baseUrl = "/api";

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
        error.error?.message ?? `Request failed: ${response.status}`,
        response.status,
        error.error?.details,
      );
    }

    return response.json();
  }

  // Tasks
  tasks = {
    list: () => this.request<TasksResponse>("/tasks"),
    get: (id: string) => this.request<TaskResponse>(`/tasks/${id}`),
    create: (data: CreateTaskInput) =>
      this.request<TaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTaskInput) =>
      this.request<TaskResponse>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  };

  // Tags
  tags = {
    list: () => this.request<TagsResponse>("/tags"),
    get: (id: string) => this.request<TagResponse>(`/tags/${id}`),
    create: (data: CreateTagInput) =>
      this.request<TagResponse>("/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTagInput) =>
      this.request<TagResponse>(`/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/tags/${id}`, {
        method: "DELETE",
      }),
  };

  // Notes
  notes = {
    list: () => this.request<NotesResponse>("/notes"),
    get: (id: string) => this.request<NoteResponse>(`/notes/${id}`),
    create: (data: CreateNoteInput) =>
      this.request<NoteResponse>("/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateNoteInput) =>
      this.request<NoteResponse>(`/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/notes/${id}`, {
        method: "DELETE",
      }),
    duplicate: (id: string) =>
      this.request<NoteResponse>(`/notes/${id}/duplicate`, {
        method: "POST",
      }),
  };

  // Folders
  folders = {
    list: () => this.request<FoldersResponse>("/folders"),
    create: (data: CreateFolderInput) =>
      this.request<FolderResponse>("/folders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateFolderInput) =>
      this.request<FolderResponse>(`/folders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/folders/${id}`, {
        method: "DELETE",
      }),
    ensureCoachNotes: () =>
      this.request<FolderResponse>("/folders/coach-notes", {
        method: "POST",
      }),
  };

  // Goals
  goals = {
    list: () => this.request<GoalsResponse>("/goals"),
    stats: () => this.request<GoalStatsResponse>("/goals/stats"),
    create: (data: CreateGoalInput) =>
      this.request<GoalResponse>("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateGoalInput) =>
      this.request<GoalResponse>(`/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/goals/${id}`, {
        method: "DELETE",
      }),
    deleteAll: () =>
      this.request<{ success: boolean }>("/goals", {
        method: "DELETE",
      }),
  };

  // Calendar
  calendar = {
    listCalendars: () => this.request<CalendarsResponse>("/calendar/calendars"),
    getEvents: (calendarId: string, timeMin: string, timeMax: string) => {
      const params = new URLSearchParams({ calendarId, timeMin, timeMax });
      return this.request<EventsResponse>(`/calendar/events?${params}`);
    },
    getMultiEvents: async (
      calendarIds: string[],
      timeMin: string,
      timeMax: string,
    ) => {
      const allEvents: CalendarEvent[] = [];
      await Promise.all(
        calendarIds.map(async (calendarId) => {
          try {
            const data = await this.calendar.getEvents(
              calendarId,
              timeMin,
              timeMax,
            );
            allEvents.push(...data.events);
          } catch {
            // Ignore failed calendar fetches
          }
        }),
      );
      return allEvents;
    },
    getColors: () => this.request<ColorsResponse>("/calendar/colors"),
    createEvent: (calendarId: string, event: CalendarEvent) =>
      this.request<{ event: CalendarEvent }>(
        `/calendar/events?calendarId=${calendarId}`,
        {
          method: "POST",
          body: JSON.stringify(event),
        },
      ),
    updateEvent: (
      calendarId: string,
      eventId: string,
      event: Partial<CalendarEvent>,
    ) =>
      this.request<{ event: CalendarEvent }>(
        `/calendar/events/${eventId}?calendarId=${calendarId}`,
        {
          method: "PUT",
          body: JSON.stringify(event),
        },
      ),
    deleteEvent: (calendarId: string, eventId: string) =>
      this.request<{ success: boolean }>(
        `/calendar/events/${eventId}?calendarId=${calendarId}`,
        {
          method: "DELETE",
        },
      ),
    sync: () =>
      this.request<SyncResponse>("/calendar/sync", {
        method: "POST",
      }),
  };
}

export const api = new ApiClient();
