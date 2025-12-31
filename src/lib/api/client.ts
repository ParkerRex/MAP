import type { calendar_v3 } from "googleapis";
import type {
  Folder,
  Goal,
  Note,
  Tag,
  Task,
  WhoopCycle,
  WhoopProfile,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
} from "@/db/schema";
import type { TaskWithTags } from "@/types/tasks";
import { ApiError, ErrorCodes } from "./errors";

export type { TaskWithTags };

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

// WHOOP Response Types
export interface WhoopProfileResponse {
  connected: boolean;
  profile: WhoopProfile | null;
}

export interface WhoopCyclesResponse {
  cycles: WhoopCycle[];
}

export interface WhoopRecoveryResponse {
  latest?: WhoopRecovery | null;
  latestCycle?: WhoopCycle | null;
  recoveries?: WhoopRecovery[];
}

export interface WhoopSleepResponse {
  latest?: WhoopSleep | null;
  sleeps?: WhoopSleep[];
}

export interface WhoopWorkoutsResponse {
  workouts: WhoopWorkout[];
}

export interface WhoopSyncResponse {
  success: boolean;
  synced: {
    cycles: number;
    recoveries: number;
    sleeps: number;
    workouts: number;
  };
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

export interface CreateNoteInput {
  title: string;
  content?: string;
  folderId: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string | null;
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
  dueAt?: string | null;
  completed?: boolean;
}

class ApiClient {
  private baseUrl = "/api";

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(this.baseUrl + endpoint, {
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
        error.error?.message ?? "Request failed: " + response.status,
        response.status,
        error.error?.details,
      );
    }

    return response.json();
  }

  tasks = {
    list: () => this.request<TasksResponse>("/tasks"),
    get: (id: string) => this.request<TaskResponse>("/tasks/" + id),
    create: (data: CreateTaskInput) =>
      this.request<TaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTaskInput) =>
      this.request<TaskResponse>("/tasks/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>("/tasks/" + id, { method: "DELETE" }),
  };

  tags = {
    list: () => this.request<TagsResponse>("/tags"),
    get: (id: string) => this.request<TagResponse>("/tags/" + id),
    create: (data: CreateTagInput) =>
      this.request<TagResponse>("/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTagInput) =>
      this.request<TagResponse>("/tags/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => this.request<{ success: boolean }>("/tags/" + id, { method: "DELETE" }),
  };

  notes = {
    list: () => this.request<NotesResponse>("/notes"),
    get: (id: string) => this.request<NoteResponse>("/notes/" + id),
    create: (data: CreateNoteInput) =>
      this.request<NoteResponse>("/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateNoteInput) =>
      this.request<NoteResponse>("/notes/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>("/notes/" + id, { method: "DELETE" }),
    duplicate: (id: string) =>
      this.request<NoteResponse>("/notes/" + id + "/duplicate", {
        method: "POST",
      }),
  };

  folders = {
    list: () => this.request<FoldersResponse>("/folders"),
    create: (data: CreateFolderInput) =>
      this.request<FolderResponse>("/folders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateFolderInput) =>
      this.request<FolderResponse>("/folders/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>("/folders/" + id, {
        method: "DELETE",
      }),
    ensureCoachNotes: () =>
      this.request<FolderResponse>("/folders/coach-notes", { method: "POST" }),
  };

  goals = {
    list: () => this.request<GoalsResponse>("/goals"),
    stats: () => this.request<GoalStatsResponse>("/goals/stats"),
    create: (data: CreateGoalInput) =>
      this.request<GoalResponse>("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateGoalInput) =>
      this.request<GoalResponse>("/goals/" + id, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ success: boolean }>("/goals/" + id, { method: "DELETE" }),
    deleteAll: () => this.request<{ success: boolean }>("/goals", { method: "DELETE" }),
  };

  calendar = {
    listCalendars: () => this.request<CalendarsResponse>("/calendar/calendars"),
    getColors: () => this.request<ColorsResponse>("/calendar/colors"),
    sync: () => this.request<SyncResponse>("/calendar/sync", { method: "POST" }),
    events: {
      list: (calendarId: string, timeMin: string, timeMax: string) =>
        this.request<EventsResponse>(
          `/calendar/events?calendarId=${calendarId}&timeMin=${timeMin}&timeMax=${timeMax}`,
        ),
      get: (eventId: string, calendarId: string) =>
        this.request<{ event: CalendarEvent }>(
          `/calendar/events/${eventId}?calendarId=${calendarId}`,
        ),
      create: (calendarId: string, event: Partial<CalendarEvent>) =>
        this.request<{ event: CalendarEvent }>(`/calendar/events?calendarId=${calendarId}`, {
          method: "POST",
          body: JSON.stringify(event),
        }),
      update: (eventId: string, calendarId: string, event: Partial<CalendarEvent>) =>
        this.request<{ event: CalendarEvent }>(
          `/calendar/events/${eventId}?calendarId=${calendarId}`,
          {
            method: "PUT",
            body: JSON.stringify(event),
          },
        ),
      delete: (eventId: string, calendarId: string) =>
        this.request<{ success: boolean }>(`/calendar/events/${eventId}?calendarId=${calendarId}`, {
          method: "DELETE",
        }),
    },
  };

  google = {
    status: () => this.request<{ connected: boolean }>("/google/status"),
  };

  whoop = {
    profile: () => this.request<WhoopProfileResponse>("/whoop/profile"),
    cycles: (startDate?: string, endDate?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (limit) params.set("limit", limit.toString());
      const queryString = params.toString();
      return this.request<WhoopCyclesResponse>(
        `/whoop/cycles${queryString ? `?${queryString}` : ""}`,
      );
    },
    recovery: () => this.request<WhoopRecoveryResponse>("/whoop/recovery"),
    sleep: (startDate?: string, endDate?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (limit) params.set("limit", limit.toString());
      const queryString = params.toString();
      return this.request<WhoopSleepResponse>(
        `/whoop/sleep${queryString ? `?${queryString}` : ""}`,
      );
    },
    workouts: (startDate?: string, endDate?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (limit) params.set("limit", limit.toString());
      const queryString = params.toString();
      return this.request<WhoopWorkoutsResponse>(
        `/whoop/workouts${queryString ? `?${queryString}` : ""}`,
      );
    },
    sync: () => this.request<WhoopSyncResponse>("/whoop/sync", { method: "POST" }),
    disconnect: () =>
      this.request<{ success: boolean }>("/whoop/disconnect", {
        method: "POST",
      }),
  };
}

export const api = new ApiClient();
