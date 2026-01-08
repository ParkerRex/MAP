import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertOwner } from "./lib/ownership";

const taskStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
);

export const list = query({
  args: {
    status: v.optional(taskStatus),
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let tasksQuery = ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("deletedAt"), undefined));

    if (args.status) {
      tasksQuery = tasksQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    } else if (args.includeCompleted === false) {
      tasksQuery = tasksQuery.filter((q) =>
        q.neq(q.field("status"), "completed"),
      );
    }

    const tasks = await tasksQuery.collect();
    return tasks.sort(
      (a, b) =>
        (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      title: args.title,
      body: args.body,
      dueAt: args.dueAt,
      projectId: args.projectId,
      status: "pending",
      createdAt: now,
      createdBy: user._id,
      updatedAt: now,
      updatedBy: user._id,
    });
    return await ctx.db.get(taskId);
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    status: v.optional(taskStatus),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }
    assertOwner(String(task.userId), String(user._id));

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
      updatedBy: user._id,
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.body !== undefined) updates.body = args.body;
    if (args.dueAt !== undefined) updates.dueAt = args.dueAt;
    if (args.status !== undefined) {
      updates.status = args.status;
      updates.completedAt = args.status === "completed" ? Date.now() : undefined;
    }

    await ctx.db.patch(args.taskId, updates);
    return await ctx.db.get(args.taskId);
  },
});

export const toggle = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }
    assertOwner(String(task.userId), String(user._id));

    const nextStatus = task.status === "completed" ? "pending" : "completed";
    await ctx.db.patch(args.taskId, {
      status: nextStatus,
      completedAt: nextStatus === "completed" ? Date.now() : undefined,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    return await ctx.db.get(args.taskId);
  },
});

export const remove = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      return null;
    }
    assertOwner(String(task.userId), String(user._id));

    await ctx.db.patch(args.taskId, {
      deletedAt: Date.now(),
      deletedBy: user._id,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    return await ctx.db.get(args.taskId);
  },
});
