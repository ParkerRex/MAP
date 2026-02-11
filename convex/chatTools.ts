import { createTool, type ToolCtx } from "@convex-dev/agent";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { api } from "./_generated/api";

type ChatToolAccess = "read-only" | "read-write";

type ConvexToolContext = ToolCtx & {
  runQuery: (query: unknown, args?: unknown) => Promise<unknown>;
  runMutation: (mutation: unknown, args?: unknown) => Promise<unknown>;
};

type DataRecord = Record<string, unknown>;

const taskStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const goalStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const goalCategorySchema = z.enum(["health", "work", "personal", "family", "spiritual"]);

function asRecord(value: unknown): DataRecord {
  if (typeof value === "object" && value !== null) {
    return value as DataRecord;
  }
  return {};
}

function asNullableRecord(value: unknown): DataRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as DataRecord;
  }
  return null;
}

function asRecordArray(value: unknown): DataRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(asRecord);
}

function toDateMs(value: string | undefined, field: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) {
    throw new ConvexError(`${field} must be a valid ISO datetime string`);
  }
  return dateMs;
}

function toIsoString(value: string, field: string): string {
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) {
    throw new ConvexError(`${field} must be a valid ISO datetime string`);
  }
  return new Date(dateMs).toISOString();
}

function calendarRangeFromArgs(args: { from?: string; to?: string; days?: number }) {
  const startMs = toDateMs(args.from, "from") ?? Date.now();
  const rangeDays = Math.max(1, Math.min(args.days ?? 7, 30));
  const endMs = toDateMs(args.to, "to") ?? startMs + rangeDays * 24 * 60 * 60 * 1000;

  if (endMs <= startMs) {
    throw new ConvexError("to must be greater than from");
  }

  return {
    from: new Date(startMs).toISOString(),
    to: new Date(endMs).toISOString(),
  };
}

function summarizeTask(task: DataRecord) {
  return {
    id: String(task._id),
    title: task.title,
    status: task.status,
    dueAt: task.dueAt ?? null,
    updatedAt: task.updatedAt ?? task.createdAt,
  };
}

function summarizeGoal(goal: DataRecord) {
  return {
    id: String(goal._id),
    title: goal.title,
    category: goal.category,
    status: goal.status,
    dueAt: goal.dueAt ?? null,
    updatedAt: goal.updatedAt ?? goal.createdAt,
  };
}

function summarizeNote(note: DataRecord) {
  const content = typeof note.content === "string" ? note.content : "";
  const preview = content.length > 240 ? `${content.slice(0, 240)}...` : content;
  return {
    id: String(note._id),
    title: note.title,
    folderId: note.folderId ? String(note.folderId) : null,
    preview,
    updatedAt: note.updatedAt ?? note.createdAt,
  };
}

function summarizeEvent(event: DataRecord) {
  return {
    id: String(event._id),
    calendarId: String(event.calendarId),
    summary: event.summary ?? "",
    startTime: event.startTime,
    endTime: event.endTime,
    isAllDay: event.isAllDay ?? false,
    updatedAt: event.updatedAt ?? event.createdAt,
  };
}

const readTools = {
  list_tasks: createTool({
    description: "List the user's tasks, optionally filtered by status.",
    args: z.object({
      status: taskStatusSchema.optional(),
      includeCompleted: z.boolean().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const tasks = asRecordArray(
        await ctx.runQuery(api.tasks.list, {
          status: args.status,
          includeCompleted: args.includeCompleted,
        }),
      );
      return {
        count: tasks.length,
        tasks: tasks.map(summarizeTask),
      };
    },
  }),

  search_notes: createTool({
    description: "Search or list notes. Pass query for semantic note lookup.",
    args: z.object({
      query: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const notes = asRecordArray(
        await ctx.runQuery(api.notes.list, {
          query: args.query?.trim() || undefined,
          limit: args.limit ?? 20,
        }),
      );
      return {
        count: notes.length,
        notes: notes.map(summarizeNote),
      };
    },
  }),

  list_goals: createTool({
    description: "List user goals with optional status/category filters.",
    args: z.object({
      status: goalStatusSchema.optional(),
      category: goalCategorySchema.optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const goals = asRecordArray(
        await ctx.runQuery(api.goals.list, {
          status: args.status,
          category: args.category,
        }),
      );
      return {
        count: goals.length,
        goals: goals.map(summarizeGoal),
      };
    },
  }),

  list_calendar_events: createTool({
    description: "List calendar events in a date range. Defaults to now through the next 7 days.",
    args: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      days: z.number().int().min(1).max(30).optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const range = calendarRangeFromArgs(args);
      const events = asRecordArray(await ctx.runQuery(api.calendar.listEvents, range));
      return {
        range,
        count: events.length,
        events: events.map(summarizeEvent),
      };
    },
  }),

  health_summary: createTool({
    description: "Get health summary and averages over a recent day window.",
    args: z.object({
      days: z.number().int().min(1).max(30).optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const summary = asRecord(
        await ctx.runQuery(api.health.summary, {
          days: args.days ?? 7,
        }),
      );
      return {
        latest: summary.latest ?? null,
        average: summary.average ?? null,
        daysCount: Array.isArray(summary.days) ? summary.days.length : 0,
      };
    },
  }),
};

const writeTools = {
  create_task: createTool({
    description: "Create a task with optional body and due date.",
    args: z.object({
      title: z.string().min(1),
      body: z.string().optional(),
      dueAt: z.string().optional(),
      projectId: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const task = asNullableRecord(
        await ctx.runMutation(api.tasks.create, {
          title: args.title,
          body: args.body,
          dueAt: toDateMs(args.dueAt, "dueAt"),
          projectId: args.projectId,
        }),
      );
      return {
        task: task ? summarizeTask(task) : null,
      };
    },
  }),

  update_task: createTool({
    description: "Update an existing task by id.",
    args: z.object({
      taskId: z.string().min(1),
      title: z.string().optional(),
      body: z.string().optional(),
      dueAt: z.string().optional(),
      status: taskStatusSchema.optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const task = asNullableRecord(
        await ctx.runMutation(api.tasks.update, {
          taskId: args.taskId,
          title: args.title,
          body: args.body,
          dueAt: toDateMs(args.dueAt, "dueAt"),
          status: args.status,
        }),
      );
      return {
        task: task ? summarizeTask(task) : null,
      };
    },
  }),

  toggle_task: createTool({
    description: "Toggle a task between completed and pending.",
    args: z.object({
      taskId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const task = asNullableRecord(
        await ctx.runMutation(api.tasks.toggle, {
          taskId: args.taskId,
        }),
      );
      return {
        task: task ? summarizeTask(task) : null,
      };
    },
  }),

  remove_task: createTool({
    description: "Soft-delete a task.",
    args: z.object({
      taskId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const task = asNullableRecord(
        await ctx.runMutation(api.tasks.remove, {
          taskId: args.taskId,
        }),
      );
      return {
        task: task ? summarizeTask(task) : null,
      };
    },
  }),

  create_note: createTool({
    description: "Create a note.",
    args: z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      folderId: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const note = asNullableRecord(
        await ctx.runMutation(api.notes.create, {
          title: args.title,
          content: args.content,
          folderId: args.folderId,
        }),
      );
      return {
        note: note ? summarizeNote(note) : null,
      };
    },
  }),

  update_note: createTool({
    description: "Update a note.",
    args: z.object({
      noteId: z.string().min(1),
      title: z.string().optional(),
      content: z.string().optional(),
      folderId: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const note = asNullableRecord(
        await ctx.runMutation(api.notes.update, {
          noteId: args.noteId,
          title: args.title,
          content: args.content,
          folderId: args.folderId,
        }),
      );
      return {
        note: note ? summarizeNote(note) : null,
      };
    },
  }),

  remove_note: createTool({
    description: "Soft-delete a note.",
    args: z.object({
      noteId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const note = asNullableRecord(
        await ctx.runMutation(api.notes.remove, {
          noteId: args.noteId,
        }),
      );
      return {
        note: note ? summarizeNote(note) : null,
      };
    },
  }),

  create_goal: createTool({
    description: "Create a goal.",
    args: z.object({
      title: z.string().min(1),
      category: goalCategorySchema,
      dueAt: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const goal = asNullableRecord(
        await ctx.runMutation(api.goals.create, {
          title: args.title,
          category: args.category,
          dueAt: toDateMs(args.dueAt, "dueAt"),
        }),
      );
      return {
        goal: goal ? summarizeGoal(goal) : null,
      };
    },
  }),

  update_goal: createTool({
    description: "Update a goal.",
    args: z.object({
      goalId: z.string().min(1),
      title: z.string().optional(),
      category: goalCategorySchema.optional(),
      status: goalStatusSchema.optional(),
      dueAt: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const goal = asNullableRecord(
        await ctx.runMutation(api.goals.update, {
          goalId: args.goalId,
          title: args.title,
          category: args.category,
          status: args.status,
          dueAt: toDateMs(args.dueAt, "dueAt"),
        }),
      );
      return {
        goal: goal ? summarizeGoal(goal) : null,
      };
    },
  }),

  toggle_goal: createTool({
    description: "Toggle a goal between completed and in-progress.",
    args: z.object({
      goalId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const goal = asNullableRecord(
        await ctx.runMutation(api.goals.toggle, {
          goalId: args.goalId,
        }),
      );
      return {
        goal: goal ? summarizeGoal(goal) : null,
      };
    },
  }),

  remove_goal: createTool({
    description: "Soft-delete a goal.",
    args: z.object({
      goalId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const goal = asNullableRecord(
        await ctx.runMutation(api.goals.remove, {
          goalId: args.goalId,
        }),
      );
      return {
        goal: goal ? summarizeGoal(goal) : null,
      };
    },
  }),

  create_calendar_event: createTool({
    description: "Create a local calendar event.",
    args: z.object({
      summary: z.string().min(1),
      description: z.string().optional(),
      startTime: z.string().min(1),
      endTime: z.string().min(1),
      isAllDay: z.boolean().optional(),
      calendarId: z.string().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const event = asNullableRecord(
        await ctx.runMutation(api.calendar.createEvent, {
          summary: args.summary,
          description: args.description,
          startTime: toIsoString(args.startTime, "startTime"),
          endTime: toIsoString(args.endTime, "endTime"),
          isAllDay: args.isAllDay,
          calendarId: args.calendarId,
        }),
      );
      return {
        event: event ? summarizeEvent(event) : null,
      };
    },
  }),

  update_calendar_event: createTool({
    description: "Update an existing calendar event.",
    args: z.object({
      eventId: z.string().min(1),
      summary: z.string().optional(),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAllDay: z.boolean().optional(),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const event = asNullableRecord(
        await ctx.runMutation(api.calendar.updateEvent, {
          eventId: args.eventId,
          summary: args.summary,
          description: args.description,
          startTime: args.startTime ? toIsoString(args.startTime, "startTime") : undefined,
          endTime: args.endTime ? toIsoString(args.endTime, "endTime") : undefined,
          isAllDay: args.isAllDay,
        }),
      );
      return {
        event: event ? summarizeEvent(event) : null,
      };
    },
  }),

  remove_calendar_event: createTool({
    description: "Soft-delete a calendar event.",
    args: z.object({
      eventId: z.string().min(1),
    }),
    handler: async (ctx: ConvexToolContext, args) => {
      const event = asNullableRecord(
        await ctx.runMutation(api.calendar.removeEvent, {
          eventId: args.eventId,
        }),
      );
      return {
        event: event ? summarizeEvent(event) : null,
      };
    },
  }),
};

export function buildChatTools(access: ChatToolAccess) {
  if (access === "read-write") {
    return {
      ...readTools,
      ...writeTools,
    };
  }

  return {
    ...readTools,
  };
}
