export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    detail: (id: string) => ["tasks", id] as const,
  },
  tags: {
    all: ["tags"] as const,
    detail: (id: string) => ["tags", id] as const,
  },
  notes: {
    all: ["notes"] as const,
    detail: (id: string) => ["notes", id] as const,
    byFolder: (folderId: string) => ["notes", "folder", folderId] as const,
  },
  folders: {
    all: ["folders"] as const,
    detail: (id: string) => ["folders", id] as const,
  },
  goals: {
    all: ["goals"] as const,
    stats: ["goals", "stats"] as const,
    detail: (id: string) => ["goals", id] as const,
  },
  calendars: {
    all: ["calendars"] as const,
    colors: ["calendar-colors"] as const,
  },
  events: {
    all: ["events"] as const,
    byCalendar: (calendarId: string, timeMin: string, timeMax: string) =>
      ["events", calendarId, timeMin, timeMax] as const,
    multi: (calendarIds: string[], timeMin: string, timeMax: string) =>
      [
        "events",
        "multi",
        calendarIds.sort().join(","),
        timeMin,
        timeMax,
      ] as const,
  },
  whoop: {
    profile: ["whoop", "profile"] as const,
    cycles: (startDate?: string, endDate?: string) =>
      ["whoop", "cycles", startDate, endDate] as const,
    recovery: ["whoop", "recovery"] as const,
    sleep: (startDate?: string, endDate?: string) =>
      ["whoop", "sleep", startDate, endDate] as const,
    workouts: (startDate?: string, endDate?: string) =>
      ["whoop", "workouts", startDate, endDate] as const,
    all: ["whoop"] as const,
  },
  google: {
    status: ["google", "status"] as const,
  },
  claude: {
    status: ["claude", "status"] as const,
    all: ["claude"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
